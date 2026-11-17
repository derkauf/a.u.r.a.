#!/usr/bin/env node
/**
 * Deploys the app to Vercel production (https://aura.sixvectors.app/).
 *
 * Why a copy: inside a git repo the Vercel CLI sends the last commit's
 * author, and on the Hobby plan the deploy is refused when that author does
 * not match a Vercel account ("couldn't match the commit author"). This
 * script copies the tracked files (with their current working-tree content)
 * plus the .vercel/ project link into a temporary folder without .git,
 * deploys from there, and removes the copy.
 *
 * Usage: npm run deploy
 * Requires: `npx vercel login` done once, and .vercel/ linked to the project.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCOPE = 'derkaufs-projects';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!existsSync(path.join(root, '.vercel', 'project.json'))) {
  console.error('.vercel/project.json not found. Link the project first: npx vercel@latest link');
  process.exit(1);
}

const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((file) => existsSync(path.join(root, file))); // skip tracked files deleted locally

const work = mkdtempSync(path.join(tmpdir(), 'aura-deploy-'));
try {
  for (const file of files) {
    const target = path.join(work, file);
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(root, file), target);
  }
  cpSync(path.join(root, '.vercel'), path.join(work, '.vercel'), { recursive: true });
  console.log(`Copied ${files.length} files to ${work}; deploying...`);

  const result = spawnSync(
    'npx',
    ['-y', 'vercel@latest', 'deploy', '--prod', '--yes', '--scope', SCOPE],
    { cwd: work, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  process.exitCode = result.status ?? 1;
} finally {
  // On Windows the npx process can still hold the folder for a moment.
  try {
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch {
    console.warn(`Could not remove ${work}; delete it manually (the deploy itself is unaffected).`);
  }
}
