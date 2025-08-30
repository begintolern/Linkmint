// scripts/check-route-conflicts.mjs
// Fails if the same API path exists in both Pages Router (pages/api/*)
// and App Router (app/api/*). Example conflict: /api/admin/referral-groups

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagesApi = path.join(root, "pages", "api");
const appApi = path.join(root, "app", "api");

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function listPagesApi(dir, prefix = "") {
  const out = [];
  if (!isDir(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const rel = path.posix.join(prefix, e.name).replace(/\\/g, "/");
    if (e.isDirectory()) out.push(...listPagesApi(p, rel));
    else if (e.isFile() && e.name.endsWith(".ts")) {
      out.push(rel.replace(/\.ts$/, "")); // e.g. admin/referral-groups
    }
  }
  return out;
}

function listAppApi(dir, prefix = "") {
  const out = [];
  if (!isDir(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const rel = path.posix.join(prefix, e.name).replace(/\\/g, "/");
    if (e.isDirectory()) out.push(...listAppApi(p, rel));
    else if (e.isFile() && e.name === "route.ts") {
      out.push(rel.replace(/\/route\.ts$/, "")); // e.g. admin/referral-groups
    }
  }
  return out;
}

const pages = listPagesApi(pagesApi).map(s => s.replace(/^api\//, ""));
const app = listAppApi(appApi).map(s => s.replace(/^api\//, ""));

const conflicts = pages.filter(p => app.includes(p));
if (conflicts.length) {
  console.error("Conflicting API routes found (remove one side):");
  for (const c of conflicts) console.error(` - /api/${c}`);
  process.exit(1);
} else {
  console.log("No API route conflicts found.");
}
