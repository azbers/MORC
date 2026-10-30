// DAUR Supply: send the calendar folders in "04 Platforms" to the local Postiz.
//
//   node daur-postiz-sync.mjs           sync once
//   node daur-postiz-sync.mjs --watch   sync now, then again whenever a calendar
//                                       folder changes and every 15 minutes
//   node daur-postiz-sync.mjs --dry     show what would be sent, send nothing
//
// Reads every 04 Platforms/<Instagram|Facebook|TikTok>/Calendar/<date folder>/postiz.json.
// Posts whose time has passed, and folders with "ready": false, are skipped.
// A post is sent again only when its postiz.json or media files change.
// Needs Node 18 or newer (built in fetch and FormData).

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLATFORMS_DIR = path.resolve(HERE, "..", "..", "04 Platforms");
const CONFIG = JSON.parse(fs.readFileSync(path.join(HERE, "config.json"), "utf8"));
const STATE_FILE = path.join(HERE, "sync-state.json");
const LOG_FILE = path.join(HERE, "sync-log.txt");
const API = CONFIG.postizUrl.replace(/\/$/, "") + "/api/public/v1";
const DRY = process.argv.includes("--dry");

function log(msg) {
  const line = `${new Date().toISOString()}  ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

function apiKey() {
  const f = path.join(HERE, CONFIG.apiKeyFile);
  if (!fs.existsSync(f)) return null;
  const k = fs.readFileSync(f, "utf8").trim();
  return k && !k.startsWith("PASTE") ? k : null;
}

async function call(method, url, key, body, isForm = false) {
  const res = await fetch(API + url, {
    method,
    headers: isForm ? { Authorization: key } : { Authorization: key, "Content-Type": "application/json" },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} ${res.status}: ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

// The calendar folder platform name -> the Postiz provider identifier to use.
function pickIntegration(integrations, platform) {
  const wanted = CONFIG.providers[platform] || [platform];
  return integrations.find((i) => !i.disabled && wanted.includes(i.identifier || i.providerIdentifier));
}

function settingsFor(identifier, kind, title) {
  if (identifier.startsWith("instagram")) return { __type: identifier, post_type: kind === "story" ? "story" : "post" };
  if (identifier === "facebook") return { __type: "facebook" };
  if (identifier === "tiktok")
    return {
      __type: "tiktok", title: title.slice(0, 90), privacy_level: "PUBLIC_TO_EVERYONE",
      duet: false, stitch: false, comment: true, autoAddMusic: "no",
      brand_content_toggle: false, brand_organic_toggle: false, video_made_with_ai: false,
      content_posting_method: CONFIG.tiktokMethod || "UPLOAD",
    };
  return { __type: identifier };
}

function fingerprint(folder, post) {
  const h = crypto.createHash("sha1").update(JSON.stringify(post));
  for (const m of post.media) {
    const st = fs.statSync(path.join(folder, m));
    h.update(`${m}:${st.size}:${st.mtimeMs}`);
  }
  return h.digest("hex");
}

function calendarFiles() {
  const out = [];
  for (const plat of ["Instagram", "Facebook", "TikTok"]) {
    const cal = path.join(PLATFORMS_DIR, plat, "Calendar");
    if (!fs.existsSync(cal)) continue;
    for (const d of fs.readdirSync(cal).sort()) {
      const f = path.join(cal, d, "postiz.json");
      if (fs.existsSync(f)) out.push(f);
    }
  }
  return out;
}

let running = false;
async function syncOnce() {
  if (running) return;
  running = true;
  try {
    const key = apiKey();
    if (!key) { log(`No API key yet. Paste it into ${CONFIG.apiKeyFile} (Postiz > Settings > Public API).`); return; }
    const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : {};
    const integrations = await call("GET", "/integrations", key);
    const now = Date.now();
    let sent = 0, skipped = 0;
    for (const file of calendarFiles()) {
      const folder = path.dirname(file);
      const meta = JSON.parse(fs.readFileSync(file, "utf8"));
      if (meta.ready === false) continue;
      const integ = pickIntegration(integrations, meta.platform);
      if (!integ) { skipped++; continue; }
      const identifier = integ.identifier || integ.providerIdentifier;
      for (const [i, post] of meta.posts.entries()) {
        if (Date.parse(post.time) < now) continue;
        if (identifier === "facebook" && post.kind === "story") continue;
        const id = `${path.relative(PLATFORMS_DIR, folder)}#${i}`;
        const fp = fingerprint(folder, post);
        if (state[id]?.fp === fp) continue;
        if (DRY) { log(`[dry] would send ${id} (${post.kind}, ${post.media.length} files) to ${identifier}`); continue; }
        if (state[id]?.postId) {
          try { await call("DELETE", `/posts/${state[id].postId}`, key); log(`removed old version of ${id}`); }
          catch (e) { log(`could not remove old version of ${id}, delete it by hand in Postiz: ${e.message}`); }
        }
        const images = [];
        for (const m of post.media) {
          const form = new FormData();
          form.append("file", new Blob([fs.readFileSync(path.join(folder, m))]), m);
          const up = await call("POST", "/upload", key, form, true);
          images.push({ id: up.id, path: up.path });
        }
        const body = {
          type: CONFIG.mode, date: post.time, shortLink: false, tags: [],
          posts: [{ integration: { id: integ.id }, value: [{ content: post.caption, image: images }],
                    settings: settingsFor(identifier, post.kind, `DAUR ${meta.title}`) }],
        };
        const res = await call("POST", "/posts", key, body);
        const postId = Array.isArray(res) ? (res[0]?.postId || res[0]?.id) : (res.postId || res.id || res.group);
        state[id] = { fp, postId, sentAt: new Date().toISOString(), mode: CONFIG.mode };
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        log(`sent ${id} as ${CONFIG.mode} for ${post.time} to ${identifier}`);
        sent++;
      }
    }
    if (skipped) log(`${skipped} folders skipped: their platform is not connected in Postiz yet.`);
    log(`sync done, ${sent} sent.`);
  } catch (e) {
    log(`sync failed: ${e.message}`);
  } finally {
    running = false;
  }
}

await syncOnce();
if (process.argv.includes("--watch")) {
  let timer = null;
  fs.watch(PLATFORMS_DIR, { recursive: true }, (_ev, name) => {
    if (!name || !/Calendar/.test(name)) return;
    clearTimeout(timer);
    timer = setTimeout(syncOnce, 10_000);
  });
  setInterval(syncOnce, 15 * 60_000);
  log("watching 04 Platforms for changes");
}
