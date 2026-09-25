// Replace this machine's absolute paths in committed artifacts: the repo root becomes "<repo>" and
// the home directory "~". Node --cpu-prof writes absolute file:// URLs into .cpuprofile files.
// Usage: node scrub-paths.mjs FILE...   (prints how many files changed)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HOME = os.homedir();
let changed = 0;
for (const f of process.argv.slice(2)) {
  const s = fs.readFileSync(f, 'utf8');
  const t = s.split(REPO).join('<repo>').split(HOME).join('~');
  if (t !== s) { fs.writeFileSync(f, t); changed++; }
}
console.log(`scrubbed ${changed} of ${process.argv.length - 2} files`);
