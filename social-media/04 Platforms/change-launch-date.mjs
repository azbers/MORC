// Move the whole calendar to a new launch date (the date of Day 01).
//   node change-launch-date.mjs 2026-11-23
// Renames every dated folder in Instagram, Facebook, WhatsApp, TikTok and
// Meta Ads, and moves the times inside each postiz.json by the same number of
// days. Run it before posts are scheduled; if the sync already sent drafts,
// it will replace them on its next run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(target || "")) {
  console.log("Usage: node change-launch-date.mjs YYYY-MM-DD   (the new date for Day 01)");
  process.exit(1);
}
const insta = path.join(HERE, "Instagram", "Calendar");
const day1 = fs.readdirSync(insta).find((d) => / Day 01 /.test(d));
const shiftDays = Math.round((Date.parse(target) - Date.parse(day1.slice(0, 10))) / 86400000);
if (shiftDays === 0) { console.log("Already on that date."); process.exit(0); }
const move = (iso, days) => new Date(Date.parse(iso) + days * 86400000).toISOString();
const dirs = ["Instagram/Calendar", "Facebook/Calendar", "WhatsApp/Calendar", "TikTok/Calendar", "Meta Ads"];
let n = 0;
for (const rel of dirs) {
  const base = path.join(HERE, rel);
  if (!fs.existsSync(base)) continue;
  const names = fs.readdirSync(base).filter((d) => /^\d{4}-\d{2}-\d{2} Day /.test(d));
  // rename in an order that never collides with an existing folder
  names.sort(); if (shiftDays > 0) names.reverse();
  for (const d of names) {
    const newDate = move(d.slice(0, 10) + "T00:00:00.000Z", shiftDays).slice(0, 10);
    const to = path.join(base, newDate + d.slice(10));
    fs.renameSync(path.join(base, d), to);
    const pj = path.join(to, "postiz.json");
    if (fs.existsSync(pj)) {
      const j = JSON.parse(fs.readFileSync(pj, "utf8"));
      j.date = newDate;
      for (const p of j.posts) p.time = move(p.time, shiftDays);
      fs.writeFileSync(pj, JSON.stringify(j, null, 2));
    }
    n++;
  }
}
console.log(`Moved ${n} folders by ${shiftDays} days. Day 01 is now ${target}.`);
console.log("Weekday names inside Caption.txt files keep the old date; the folder name is the one to follow.");
