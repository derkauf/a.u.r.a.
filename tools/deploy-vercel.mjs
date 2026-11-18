#!/usr/bin/env node
/**
 * Deploys the app to Vercel.
 *
 *   npm run deploy                     → production, https://aura.sixvectors.app/
 *                                        (project aura-v1-lola, linked in .vercel/)
 *                                        FROZEN for the judges from 18/11/2026 12:00 PT:
 *                                        refused after that (see FREEZE_AT below).
 *                                        Before that, only a clean, committed tree,
 *                                        and the same commit is pushed to the
 *                                        official repo derkauf/a.u.r.a. (remote
 *                                        "official"), the exact record of what is live.
 *   npm run deploy:dev                 → test build, https://aura-next.sixvectors.app/
 *                                        (also https://aura-dev.sixvectors.app/)
 *                                        (project aura-v1-lola-dev, linked in .vercel-dev/)
 *   npm run deploy:phase -- phase-N    → the frozen build of a project phase,
 *                                        https://aura-phaseN.sixvectors.app/
 *                                        (project aura-v1-lola-phase-N, linked in
 *                                        .vercel-phases/phase-N/), built from the
 *                                        git tag `phase-N` exactly as tagged.
 *
 * Why a copy: inside a git repo the Vercel CLI sends the last commit's
 * author, and on the Hobby plan the deploy is refused when that author does
 * not match a Vercel account ("couldn't match the commit author"). This
 * script puts the project files and the project link into a temporary
 * folder without .git, deploys from there, and removes the copy:
 * - production / dev: tracked files plus new, not-ignored ones, with their
 *   current working-tree content;
 * - phase: the tree of the tag (`git archive`), never the working tree.
 *
 * First deploy of dev or a phase: the Vercel project is created, its link is
 * saved for next time and, for a phase, its domain is attached.
 *
 * Requires: `npx vercel login` done once.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCOPE = 'derkaufs-projects';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const phaseIndex = args.indexOf('--phase');
const phase = phaseIndex >= 0 ? args[phaseIndex + 1] : undefined;

if (phaseIndex >= 0 && !/^phase-\d+$/u.test(phase ?? '')) {
  console.error('Usage: npm run deploy:phase -- phase-N   (a git tag named phase-N must exist)');
  process.exit(1);
}

/** Per-mode settings. */
const mode = phase
  ? {
      label: `PHASE ${phase}`,
      linkDir: path.join(root, '.vercel-phases', phase),
      project: `aura-v1-lola-${phase}`,
      domain: `aura-${phase.replace('-', '')}.sixvectors.app`,
    }
  : isDev
    ? { label: 'DEV', linkDir: path.join(root, '.vercel-dev'), project: 'aura-v1-lola-dev', domain: undefined }
    : { label: 'PRODUCTION', linkDir: path.join(root, '.vercel'), project: undefined, domain: undefined };

/**
 * Judges' freeze: the Meta VR Start Developer Competition deadline,
 * 18/11/2026 12:00 PT (20:00 UTC). After it, aura.sixvectors.app must not
 * change until the results; this repo (aura-next) is development only.
 */
const FREEZE_AT = Date.parse('2026-11-18T20:00:00Z');
const isProduction = !phase && !isDev;
if (isProduction) {
  if (Date.now() >= FREEZE_AT) {
    console.error(
      'Production (aura.sixvectors.app) is FROZEN for the judges since 18/11/2026 12:00 PT.\n' +
        'Use npm run deploy:dev (aura-next.sixvectors.app). See CLAUDE.md, "Congelamento".',
    );
    process.exit(1);
  }
  const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
  if (dirty) {
    console.error('Production deploys need a clean, committed tree, so the official repo records exactly what is live.\n' + dirty);
    process.exit(1);
  }
}

const linked = existsSync(path.join(mode.linkDir, 'project.json'));
if (!phase && !isDev && !linked) {
  console.error('.vercel/project.json not found. Link the project first: npx vercel@latest link');
  process.exit(1);
}

function run(command, commandArgs, cwd) {
  return spawnSync(command, commandArgs, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
}

const work = mkdtempSync(path.join(tmpdir(), 'aura-deploy-'));
try {
  if (phase) {
    // The tag's tree, exactly as frozen.
    execFileSync('git', ['rev-parse', '--verify', `refs/tags/${phase}`], { cwd: root, stdio: 'ignore' });
    const tarPath = path.join(work, '..', `${path.basename(work)}.tar`);
    execFileSync('git', ['archive', '--format=tar', '-o', tarPath, phase], { cwd: root });
    // Relative path from inside the folder: GNU tar reads "C:\..." as a remote host.
    execFileSync('tar', ['-xf', path.join('..', path.basename(tarPath))], { cwd: work });
    rmSync(tarPath, { force: true });
    console.log(`Extracted tag ${phase} to ${work}`);
  } else {
    const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean)
      .filter((file) => existsSync(path.join(root, file))); // skip tracked files deleted locally
    for (const file of files) {
      const target = path.join(work, file);
      mkdirSync(path.dirname(target), { recursive: true });
      cpSync(path.join(root, file), target);
    }
    console.log(`Copied ${files.length} files to ${work}`);
  }

  if (linked) cpSync(mode.linkDir, path.join(work, '.vercel'), { recursive: true });
  console.log(`Deploying ${mode.label}...`);
  const deployArgs = ['-y', 'vercel@latest', 'deploy', '--prod', '--yes', '--scope', SCOPE];
  if (!linked && mode.project) deployArgs.push('--name', mode.project);
  const result = run('npx', deployArgs, work);
  process.exitCode = result.status ?? 1;

  if (isProduction && result.status === 0) {
    // The official repo always holds exactly the commit that is live.
    const pushed = run('git', ['push', 'official', 'HEAD:main'], root);
    if (pushed.status !== 0) {
      console.error('DEPLOYED, but pushing HEAD to derkauf/a.u.r.a. (remote "official") failed. Push it by hand.');
      process.exitCode = 1;
    }
  }

  if (!linked && mode.project && existsSync(path.join(work, '.vercel', 'project.json'))) {
    // Keep the new project's link and attach its domain (first deploy only).
    mkdirSync(mode.linkDir, { recursive: true });
    cpSync(path.join(work, '.vercel'), mode.linkDir, { recursive: true });
    console.log(`Saved the project link to ${path.relative(root, mode.linkDir)}/`);
    if (mode.domain) {
      run('npx', ['-y', 'vercel@latest', 'domains', 'add', mode.domain, mode.project, '--scope', SCOPE], work);
      console.log(`Domain: https://${mode.domain}/`);
    }
  }
} finally {
  // On Windows the npx process can still hold the folder for a moment.
  try {
    rmSync(work, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch {
    console.warn(`Could not remove ${work}; delete it manually (the deploy itself is unaffected).`);
  }
}
