// Upload local image or video files to the local Postiz and print their public URLs
// (served through the ngrok tunnel), ready to pass as attachments to the Postiz MCP
// schedulePostTool. Also checks each URL is publicly reachable before printing it.
//
//   node postiz-upload.mjs "<file1>" ["<file2>" ...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEY = fs.readFileSync(path.join(HERE, "..", "sync", "api-key.txt"), "utf8").trim();
const API = "http://localhost:4007/api/public/v1";
const files = process.argv.slice(2);
if (!files.length) { console.error("Give one or more file paths."); process.exit(1); }

async function post(form) {
  for (let t = 0; t < 30; t++) {
    const r = await fetch(API + "/upload", { method: "POST", headers: { Authorization: KEY }, body: form });
    if (r.status === 429) { console.error("Postiz rate limit; waiting 2 minutes"); await new Promise((s) => setTimeout(s, 120000)); continue; }
    const text = await r.text();
    if (!r.ok) throw new Error(`upload ${r.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  }
  throw new Error("upload kept hitting the rate limit");
}

const out = [];
for (const f of files) {
  if (!fs.existsSync(f)) throw new Error(`file not found: ${f}`);
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(f)]), path.basename(f));
  const up = await post(form);
  const check = await fetch(up.path, { method: "GET", headers: { "User-Agent": "facebookexternalhit/1.1" } });
  out.push({ file: f, id: up.id, url: up.path, publicCheck: `${check.status} ${check.headers.get("content-type")}` });
}
console.log(JSON.stringify(out, null, 2));
