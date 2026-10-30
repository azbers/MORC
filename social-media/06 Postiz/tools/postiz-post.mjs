// Send one dated calendar entry (Instagram + Facebook folders of the same name) to Postiz.
//   node postiz-post.mjs "<folder name, e.g. 2026-11-02 Pre 02 The name>" <draft|schedule|now>
// "now" publishes immediately; "schedule" uses the times in postiz.json; "draft" stores them for review.
// Media is uploaded once per file and checked to be publicly reachable before use.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEY = fs.readFileSync(path.join(HERE, "..", "sync", "api-key.txt"), "utf8").trim();
const API = "http://localhost:4007/api/public/v1";
const PLAT = path.resolve(HERE, "..", "..", "04 Platforms");
const [name, mode] = process.argv.slice(2);
if (!name || !["draft", "schedule", "now"].includes(mode)) { console.error('usage: node postiz-post.mjs "<folder>" <draft|schedule|now>'); process.exit(1); }
const log = (m) => console.log(new Date().toISOString().slice(11, 19), m);

async function call(method, url, body, isForm = false) {
  for (let t = 0; t < 40; t++) {
    const r = await fetch(API + url, { method, headers: isForm ? { Authorization: KEY } : { Authorization: KEY, "Content-Type": "application/json" },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body) });
    if (r.status === 429) { log(`rate limit, waiting 2 minutes (${method} ${url})`); await new Promise((s) => setTimeout(s, 120000)); continue; }
    const text = await r.text();
    if (!r.ok) throw new Error(`${method} ${url} ${r.status}: ${text.slice(0, 400)}`);
    try { return JSON.parse(text); } catch { return text; }
  }
  throw new Error("rate limit did not clear");
}
const uploaded = new Map();
async function upload(file) {
  const k = fs.realpathSync(file);
  const sig = `${path.basename(k)}:${fs.statSync(k).size}`;
  if (uploaded.has(sig)) return uploaded.get(sig);
  const form = new FormData(); form.append("file", new Blob([fs.readFileSync(k)]), path.basename(k));
  const up = await call("POST", "/upload", form, true);
  const chk = await fetch(up.path, { headers: { "User-Agent": "facebookexternalhit/1.1" } });
  if (chk.status !== 200) throw new Error(`media not public (${chk.status}): ${up.path}`);
  log(`uploaded ${path.basename(k)} -> public 200`);
  const img = { id: up.id, path: up.path }; uploaded.set(sig, img); return img;
}
const html = (s) => s.split("\n").map((l) => `<p>${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("");

const integrations = await call("GET", "/integrations");
const byId = (p) => integrations.find((i) => !i.disabled && (i.identifier || i.providerIdentifier) === p);
const results = [];
for (const [folderPlat, ident] of [["Instagram", "instagram"], ["Facebook", "facebook"]]) {
  const dir = path.join(PLAT, folderPlat, "Calendar", name);
  const f = path.join(dir, "postiz.json");
  if (!fs.existsSync(f)) { log(`no ${folderPlat} folder for ${name}`); continue; }
  const integ = byId(ident); if (!integ) { log(`${ident} not connected`); continue; }
  const meta = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const p of meta.posts) {
    if (ident === "facebook" && p.kind === "story") continue;
    const images = [];
    for (const m of p.media) images.push(await upload(path.join(dir, m)));
    const date = mode === "now" ? new Date(Date.now() + 60000).toISOString() : p.time;
    const settings = ident === "instagram" ? { __type: "instagram", post_type: p.kind === "story" ? "story" : "post" } : { __type: "facebook" };
    const body = { type: mode, date, shortLink: false, tags: [],
      posts: [{ integration: { id: integ.id }, value: [{ content: html(p.caption || ""), image: images }], settings }] };
    const res = await call("POST", "/posts", body);
    const id = Array.isArray(res) ? (res[0]?.postId || res[0]?.id) : (res.postId || res.id);
    results.push({ platform: ident, kind: p.kind, date, mode, postId: id });
    log(`${mode}: ${ident} ${p.kind} for ${date} (post ${id})`);
  }
}
console.log(JSON.stringify(results, null, 2));
