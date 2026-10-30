// DAUR Supply: download the Postiz Docker image in many parallel pieces and load it into Docker.
// Why: on this connection GitHub's container registry (ghcr.io) sends about 0.1 MB/s per
// connection, so a normal "docker pull" of the ~1.6 GB image takes hours and restarts from zero
// whenever it drops. This script splits each layer into 8 MB pieces, fetches 16 at a time,
// resumes after any failure, checks every layer's sha256, then runs "docker load".
//
//   node fast-image-download.mjs [image]   default ghcr.io/gitroomhq/postiz-app:latest
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REF = process.argv[2] || "ghcr.io/gitroomhq/postiz-app:latest";
const [, repo, tag] = REF.match(/^ghcr\.io\/([^:]+):(.+)$/);
const WORK = path.join(HERE, "image-cache", repo.replace(/\//g, "_"));
const CHUNK = 8 * 1024 * 1024, PAR = 16;
fs.mkdirSync(path.join(WORK, "blobs", "sha256"), { recursive: true });
const log = (m) => console.log(new Date().toTimeString().slice(0, 8), m);

let token = "";
async function getToken() {
  const r = await fetch(`https://ghcr.io/token?scope=repository:${repo}:pull`);
  token = (await r.json()).token;
}
async function reg(p, accept) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(`https://ghcr.io/v2/${repo}/${p}`, { headers: { Authorization: `Bearer ${token}`, Accept: accept || "*/*" }, redirect: "manual" });
      if (r.status === 401) { await getToken(); continue; }
      return r;
    } catch (e) { if (i > 8) throw e; await new Promise((s) => setTimeout(s, 2000 * (i + 1))); }
  }
}
async function blobUrl(digest) {
  const r = await reg(`blobs/${digest}`);
  if (r.status >= 300 && r.status < 400) return r.headers.get("location");
  throw new Error(`blob url ${digest} ${r.status}`);
}
const MT = "application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.oci.image.manifest.v1+json,application/vnd.docker.distribution.manifest.v2+json";

async function fetchBlob(digest, size) {
  const hex = digest.split(":")[1], out = path.join(WORK, "blobs", "sha256", hex);
  if (fs.existsSync(out) && fs.statSync(out).size === size) return log(`have ${hex.slice(0, 12)} ${(size / 1e6).toFixed(0)} MB`);
  const partDir = out + ".parts"; fs.mkdirSync(partDir, { recursive: true });
  const n = Math.ceil(size / CHUNK); let url = await blobUrl(digest), done = 0;
  const todo = [...Array(n).keys()].filter((i) => { const f = path.join(partDir, String(i)); const want = Math.min(CHUNK, size - i * CHUNK); return !(fs.existsSync(f) && fs.statSync(f).size === want); });
  done = n - todo.length;
  log(`layer ${hex.slice(0, 12)} ${(size / 1e6).toFixed(0)} MB, ${todo.length} of ${n} pieces to fetch`);
  async function worker() {
    while (todo.length) {
      const i = todo.shift(), a = i * CHUNK, b = Math.min(size, a + CHUNK) - 1;
      for (let t = 0; ; t++) {
        try {
          const ac = new AbortController(); const timer = setTimeout(() => ac.abort(), 120000);
          const r = await fetch(url, { headers: { Range: `bytes=${a}-${b}` }, signal: ac.signal });
          if (r.status === 403 || r.status === 401) { url = await blobUrl(digest); throw new Error("url expired"); }
          const buf = Buffer.from(await r.arrayBuffer()); clearTimeout(timer);
          if (buf.length !== b - a + 1) throw new Error(`short piece ${buf.length}`);
          fs.writeFileSync(path.join(partDir, String(i)), buf); done++;
          if (done % 10 === 0) log(`  ${hex.slice(0, 12)} ${Math.round((100 * done) / n)}%`);
          break;
        } catch (e) { if (t > 20) throw e; await new Promise((s) => setTimeout(s, 1500 * (t + 1))); }
      }
    }
  }
  await Promise.all([...Array(PAR)].map(worker));
  const h = crypto.createHash("sha256"), fd = fs.openSync(out + ".tmp", "w");
  for (let i = 0; i < n; i++) { const p = fs.readFileSync(path.join(partDir, String(i))); h.update(p); fs.writeSync(fd, p); }
  fs.closeSync(fd);
  if (h.digest("hex") !== hex) { fs.rmSync(partDir, { recursive: true }); fs.rmSync(out + ".tmp"); throw new Error(`checksum mismatch ${hex}; pieces cleared, run again`); }
  fs.renameSync(out + ".tmp", out); fs.rmSync(partDir, { recursive: true });
  log(`verified ${hex.slice(0, 12)}`);
}

await getToken();
const idxRes = await reg(`manifests/${tag}`, MT); const idxBody = Buffer.from(await idxRes.arrayBuffer());
let idx = JSON.parse(idxBody), manBody = idxBody, manDigest = "sha256:" + crypto.createHash("sha256").update(idxBody).digest("hex");
if (idx.manifests) {
  const m = idx.manifests.find((x) => x.platform?.os === "linux" && x.platform?.architecture === "amd64");
  const r = await reg(`manifests/${m.digest}`, MT); manBody = Buffer.from(await r.arrayBuffer()); manDigest = m.digest;
}
const man = JSON.parse(manBody);
fs.writeFileSync(path.join(WORK, "blobs", "sha256", manDigest.split(":")[1]), manBody);
const total = man.layers.reduce((s, l) => s + l.size, 0);
log(`${REF}: ${man.layers.length} layers, ${(total / 1e6).toFixed(0)} MB`);
await fetchBlob(man.config.digest, man.config.size);
for (const l of [...man.layers].sort((a, b) => a.size - b.size)) await fetchBlob(l.digest, l.size);

fs.writeFileSync(path.join(WORK, "oci-layout"), JSON.stringify({ imageLayoutVersion: "1.0.0" }));
fs.writeFileSync(path.join(WORK, "index.json"), JSON.stringify({ schemaVersion: 2, mediaType: "application/vnd.oci.image.index.v1+json",
  manifests: [{ mediaType: man.mediaType || "application/vnd.oci.image.manifest.v1+json", digest: manDigest, size: manBody.length, annotations: { "io.containerd.image.name": REF, "org.opencontainers.image.ref.name": tag } }] }));
const tar = path.join(HERE, "image-cache", "postiz-app.tar");
log("packing for docker load");
execFileSync("tar", ["-cf", tar, "-C", WORK, "oci-layout", "index.json", "blobs"], { stdio: "inherit" });
log("docker load");
execFileSync("docker", ["load", "-i", tar], { stdio: "inherit" });
log(`done: ${REF} is now in Docker`);
