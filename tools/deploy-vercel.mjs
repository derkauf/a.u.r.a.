#!/usr/bin/env node
/**
 * Deploys the app to Vercel.
 *
 *   npm run deploy       → production, https://aura.sixvectors.app/
 *                          (project aura-v1-lola, linked in .vercel/)
 *   npm run deploy:dev   → test build, https://aura-dev.sixvectors.app/
 *                          (project aura-v1-lola-dev, linked in .vercel-dev/)
 *
 * Why a copy: inside a git repo the Vercel CLI sends the last commit's
 * author, and on the Hobby plan the deploy is refused when that author does
 * not match a Vercel account ("couldn't match the commit author"). This
 * script copies the project files (tracked files plus new, not-ignored
 * ones, with their current working-tree content) and the project link into
 * a temporary folder without .git, deploys from there, and removes the copy.
 *
 * First dev deploy: when .vercel-dev/ does not exist yet, the dev project is
 * created on Vercel and its link is saved to .vercel-dev/ for next time.
 *
 * Requires: `npx vercel login` done once.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCOPE = 'derkaufs-projects';
const DEV_PROJECT = 'aura-v1-lola-dev';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isDev = process.argv.includes('--dev');
const linkDir = path.join(root, isDev ? '.vercel-dev' : '.vercel');
const linked = existsSync(path.join(linkDir, 'project.json'));

if (!isDev && !linked) {
  console.error('.vercel/project.json not found. Link the project first: npx vercel@latest link');
  process.exit(1);
}

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root,
  encoding: 'utf8',
})
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
  if (linked) cpSync(linkDir, path.join(work, '.vercel'), { recursive: true });
  console.log(`Copied ${files.length} files to ${work}; deploying ${isDev ? 'DEV' : 'PRODUCTION'}...`);

  const args = ['-y', 'vercel@latest', 'deploy', '--prod', '--yes', '--scope', SCOPE];
  if (isDev && !linked) args.push('--name', DEV_PROJECT);
  const result = spawnSync('npx', args, { cwd: work, stdio: 'inherit', shell: process.platform === 'win32' });
  process.exitCode = result.status ?? 1;

  // Keep the newly created dev project link for the next deploys.
  if (isDev && !linked && existsSync(path.join(work, '.vercel', 'project.json'))) {
    cpSync(path.join(work, '.vercel'), linkDir, { recursive: true });
    console.log(`Saved the dev project link to ${path.relative(root, linkDir)}/`);
  }
} finally {
  // On Windows the npx process can still hold the folder for a moment.
  try {
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch {
    console.warn(`Could not remove ${work}; delete it manually (the deploy itself is unaffected).`);
  }
}
