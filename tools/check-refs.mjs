#!/usr/bin/env node
/**
 * Checks the reference folders ("input-ref-src") for new or removed files.
 *
 * The user drops references into these folders at any time. The inventory
 * of what was already seen lives in docs/references.json; this script
 * compares the folders with it and lists what is new or gone, so new
 * references are noticed at the start of a session without being announced.
 *
 *   npm run refs:check            → list new / removed files (exit 0 either way)
 *   npm run refs:check -- --update → record the current state as seen
 *
 * The folders are listed in REF_FOLDERS below and described in
 * docs/REFERENCES.md.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(root, 'docs', 'references.json');
const REF_FOLDERS = [
  'docs/aura-visual-id',
  'docs/ux/user-interface-refs',
  'docs/ux/hud-reference',
  'docs/ux/quest-reference',
  'docs/ux/sound-design',
  'docs/ux/ux-illustrated-guide',
];

function listFiles(folder) {
  const abs = path.join(root, folder);
  if (!existsSync(abs)) return [];
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(path.relative(abs, full).split(path.sep).join('/'));
    }
  };
  walk(abs);
  return out.sort();
}

const current = Object.fromEntries(REF_FOLDERS.map((folder) => [folder, listFiles(folder)]));

if (process.argv.includes('--update')) {
  writeFileSync(MANIFEST, `${JSON.stringify(current, null, 2)}\n`);
  const total = Object.values(current).reduce((n, files) => n + files.length, 0);
  console.log(`Recorded ${total} reference files in ${path.relative(root, MANIFEST)}.`);
  process.exit(0);
}

const seen = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
let changes = 0;
for (const folder of REF_FOLDERS) {
  const before = new Set(seen[folder] ?? []);
  const now = new Set(current[folder]);
  const added = [...now].filter((file) => !before.has(file));
  const removed = [...before].filter((file) => !now.has(file));
  if (added.length === 0 && removed.length === 0) continue;
  changes += added.length + removed.length;
  console.log(`\n${folder}`);
  for (const file of added) console.log(`  + ${file}`);
  for (const file of removed) console.log(`  - ${file}`);
}
console.log(
  changes === 0
    ? 'No new references since the last check.'
    : `\n${changes} change(s). After reviewing them, record with: npm run refs:check -- --update`,
);
