// macOS port of the profiling skill's env_fingerprint.sh (which reads Linux-only /proc and lscpu).
// Usage: node fingerprint.mjs RUN_ID > fingerprint.json
import { execSync } from 'node:child_process';
import os from 'node:os';

const sh = (c) => { try { return execSync(c, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return null; } };
const FR = process.env.FR;
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const mount = sh(`df -P "${FR}" | tail -1`);
const dev = mount ? mount.split(/\s+/)[0] : null;
const fp = {
  run_id: process.argv[2],
  captured_at_utc: new Date().toISOString(),
  git_sha: sh(`git -C "${FR}" rev-parse HEAD`),
  git_dirty_paths: (sh(`git -C "${FR}" status --porcelain`) || '').split('\n').filter(Boolean).length,
  hardware: {
    cpu_model: sh('sysctl -n machdep.cpu.brand_string'),
    cpu_physical: Number(sh('sysctl -n hw.physicalcpu')), cpu_logical: Number(sh('sysctl -n hw.logicalcpu')),
    perf_cores: Number(sh('sysctl -n hw.perflevel0.physicalcpu')), efficiency_cores: Number(sh('sysctl -n hw.perflevel1.physicalcpu')),
    ram_bytes: Number(sh('sysctl -n hw.memsize')), swap: sh('sysctl -n vm.swapusage'),
  },
  storage: { mount_line: mount, filesystem: dev ? sh(`mount | grep "^${dev} " | head -1`) : null },
  os: { product: sh('sw_vers -productName'), version: sh('sw_vers -productVersion'), build: sh('sw_vers -buildVersion'), kernel: os.release() },
  toolchain: { node: process.version, v8: process.versions.v8, chrome: sh(`"${CHROME}" --version`), python: sh('python3 --version') },
  build_profile: { name: 'JS JIT (no build step)', node_flags: 'none for timing; --cpu-prof for sampler runs; --expose-gc for heap child', chrome: 'headless=new, --disable-frame-rate-limit --disable-gpu-vsync', brotli: 'zlib q11', minisearch: '7.2.0 vendored' },
  power_thermal: { power_source: sh('pmset -g batt | head -1'), low_power_mode: sh("pmset -g | awk '/lowpowermode/{print $2}'"), thermal: sh('pmset -g therm') },
  load_at_capture: { loadavg_1_5_15: os.loadavg().map((v) => +v.toFixed(2)), uptime: sh('uptime') },
  workload_isolation: { taskset: null, cgroup: null, bare: true, note: 'shared workstation: other agent sessions were running during the probe (see load average); no CPU pinning on macOS' },
  tuning_applied: 'none (macOS; nothing needed, nothing changed)',
  cache_state: 'warm file cache; HTTP cache disabled in Chrome (Network.setCacheDisabled) so each page load pays the fetch',
};
process.stdout.write(JSON.stringify(fp, null, 1) + '\n');
