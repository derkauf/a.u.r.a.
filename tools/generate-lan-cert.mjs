#!/usr/bin/env node
/**
 * Generates a self-signed development certificate that covers this PC's
 * LAN IPv4 addresses, so a Quest or phone on the same Wi-Fi can open
 * https://<pc-ip>:8081/ and get a bypassable "not private" warning
 * (Advanced -> Proceed) instead of a hard certificate error.
 *
 * The IWSDK plugin's own certificate only covers localhost, and its
 * `domains` option writes names as DNS entries, which browsers never match
 * against an IP. vite.config.ts picks this certificate up when it exists.
 *
 * Usage: npm run cert:lan   (re-run whenever the PC's IP changes)
 * Output: .iwsdk/https-lan/key.pem, cert.pem (git-ignored)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.iwsdk', 'https-lan');

function findOpenssl() {
  const candidates = [
    'openssl',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
    'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
  ];
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  throw new Error('openssl not found. Install Git for Windows or add openssl to PATH.');
}

function lanIPv4Addresses() {
  const addresses = new Set();
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.')) {
        addresses.add(entry.address);
      }
    }
  }
  return [...addresses];
}

const ips = lanIPv4Addresses();
if (ips.length === 0) {
  console.error('No LAN IPv4 address found. Connect to Wi-Fi and try again.');
  process.exit(1);
}

const altNames = ['DNS:localhost', 'IP:127.0.0.1', ...ips.map((ip) => `IP:${ip}`)];
const config = `[req]
distinguished_name = dn
x509_extensions = v3
prompt = no

[dn]
CN = A.U.R.A. LAN Development

[v3]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = ${altNames.join(', ')}
`;

mkdirSync(outDir, { recursive: true });
const configPath = path.join(outDir, 'openssl.cnf');
writeFileSync(configPath, config);
try {
  execFileSync(
    findOpenssl(),
    [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '365',
      '-keyout', path.join(outDir, 'key.pem'),
      '-out', path.join(outDir, 'cert.pem'),
      '-config', configPath,
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  );
} finally {
  rmSync(configPath, { force: true });
}

if (!existsSync(path.join(outDir, 'cert.pem'))) {
  console.error('Certificate generation failed.');
  process.exit(1);
}
console.log(`LAN certificate written to ${path.relative(root, outDir)}`);
console.log(`Covers: ${altNames.join(', ')}`);
console.log('Restart the dev server (npm run dev), then open:');
for (const ip of ips) console.log(`  https://${ip}:8081/`);
