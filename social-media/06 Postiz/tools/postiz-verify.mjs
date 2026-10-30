// List Postiz posts in a date range with their status and the live link Postiz recorded
// after publishing, and check that each live link opens.
//
//   node postiz-verify.mjs [startISO] [endISO]     default: last 2 days to next 30 days
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEY = fs.readFileSync(path.join(HERE, "..", "sync", "api-key.txt"), "utf8").trim();
const API = "http://localhost:4007/api/public/v1";
const start = process.argv[2] || new Date(Date.now() - 2 * 864e5).toISOString();
const end = process.argv[3] || new Date(Date.now() + 30 * 864e5).toISOString();

const r = await fetch(`${API}/posts?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`, { headers: { Authorization: KEY } });
if (!r.ok) throw new Error(`list ${r.status}: ${(await r.text()).slice(0, 300)}`);
const j = await r.json();
const posts = j.posts || j;
for (const p of posts) {
  const platform = p.integration?.providerIdentifier || p.integration?.identifier || "";
  let live = "";
  if (p.releaseURL) {
    try { const c = await fetch(p.releaseURL, { redirect: "follow" }); live = `live link ${c.status}`; } catch (e) { live = `live link error ${e.message}`; }
  }
  console.log([p.publishDate, platform, p.state || p.status, p.releaseURL || "(not published yet)", live, (p.error || "").slice(0, 120)].filter(Boolean).join("  |  "));
}
console.log(`${posts.length} posts between ${start} and ${end}`);
