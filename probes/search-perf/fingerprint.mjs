// Run fingerprint for committed perf artifacts (a macOS port of the profiling skill's env_fingerprint.sh).
// franken-research is public, so the host is described by class only: architecture, core counts, OS
// family and the toolchain versions that decide the numbers. No CPU or machine model, memory size,
// disks, OS build, host name, user name, uptime or paths.
// Usage: node fingerprint.mjs RUN_ID > fingerprint.json
import { execSync } from 'node:child_process';
import os from 'node:os';

const sh = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; } };
const FR = process.env.FR;
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const logical = os.cpus().length;
const fp = {
  run_id: process.argv[2],
  captured_at_utc: new Date().toISOString(),
  git_sha: sh(`git -C "${FR}" rev-parse HEAD`),
  git_dirty_paths: (sh(`git -C "${FR}" status --porcelain`) || '').split('\n').filter(Boolean).length,
  host_class: `a ${logical}-core ${os.arch()} desktop; phone results use CDP 4x CPU throttle and Fast 4G`,
  os_family: os.platform(),
  toolchain: { node: process.version, v8: process.versions.v8, chrome: (sh(`"${CHROME}" --version`) || '').replace(/^Google Chrome /, 'Chrome ') },
  build_profile: { name: 'JS JIT (no build step)', node_flags: 'none for timing; --cpu-prof for sampler runs; --expose-gc for heap child', chrome: 'headless=new, --disable-frame-rate-limit --disable-gpu-vsync', brotli: 'zlib q11', minisearch: '7.2.0 vendored' },
  load_at_capture: { loadavg_1_5_15: os.loadavg().map((v) => +v.toFixed(2)) },
  workload_isolation: { bare: true, note: 'shared workstation: other agent sessions were running during the probe (see load average); no CPU pinning' },
  tuning_applied: 'none',
  cache_state: 'warm file cache; HTTP cache disabled in Chrome (Network.setCacheDisabled) so each page load pays the fetch',
};
process.stdout.write(JSON.stringify(fp, null, 1) + '\n');
