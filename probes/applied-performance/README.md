# Applied input-bound verification reuse

The consumer is an agent making Beads-only changes or adding a research note
after a successful local full verification. The original release/CI command and
all its gates remain unchanged. This technique borrows action-input caching:
https://bazel.build/versions/7.7.0/remote/caching . It is not a research-quality
score or a replacement for executing an applied improvement.

```sh
# Set PATH for bun and set CHROME_PATH to the actual installed browser.
python3 -B scripts/test_verify_incremental.py
bash scripts/verify-local.sh --cache /outside/repo/private-cache.json --full
# Make a Beads edit or add a flat .md note under docs/evidence/applied-research/.
bash scripts/verify-local.sh --cache /outside/repo/private-cache.json
```

The first command runs guard tests. The second executes the original complete
`bun run verify` and saves its captured success only if inputs remain stable.
The third either reports prior-result reuse plus fresh affected checks, or runs
the full command on an ineligible change. `--explain` reports FULL_REQUIRED
(exit 3) instead of doing the expensive fallback. Invalid execution exits 2;
failed affected checks exit 1. Full stdout/stderr and measured wall/CPU are in
JSON output. Cache must live outside the checkout with owner-only permissions.

Inputs: every repository file (including ignored dependencies), modes and links,
tracked membership, available Git objects, environment digest and named tool
executable hashes. Hashing and execution are bracketed by ctime/inode/mtime/size/
mode inventories to detect concurrent writes. Symlinks escaping the repository,
changes to notes present in the certified snapshot, removed paths, executable notes, code/data changes, changed
tools/environment/Git interpretation and missing objects cannot reuse a receipt. Fresh checks apply
the original Gate L privacy predicate to changed bytes and execute the existing
decision identity checker (which detects changed bound receipts/inputs).

Trust boundary: private local cache and stable trusted host. This does not
cryptographically attest execution to another user, bind every OS library, prove
semantic research truth, or defeat a privileged concurrent attacker. No whole
suite is claimed freshly executed on a cache hit. CI always takes the full path;
external CANON, UPDATE_GOLDENS and injected-code environment variables (for example BASH_ENV or NODE_OPTIONS) cannot use the fast path. Another checkout
must earn its own full result. A new gate dependency requires re-reviewing this
narrow allowance; inputs changing already force a new full run.

See PROTOCOL.md for the predeclared comparison. Cold setup, warm latency, CPU,
and cumulative payoff are separate. A 100x warm validation result would not
establish 100x total research productivity or human-time savings.

Optional acceleration: create a virtual environment **outside** the checkout and
install `blake3==1.0.8`; invoke the wrapper with its bin directory first on PATH and `--hash blake3` on both the full
setup and subsequent reuse commands. SHA256 remains the dependency-free default.
Changing backend requires another full result. The backend version plus wrapper
and native extension SHA256 hashes are bound in the receipt. Every input byte is
still read; this is single-threaded hashing, not an mtime cache. The binding is
CC0-1.0 OR Apache-2.0 (https://github.com/oconnor663/blake3-py).

Paired reproduction: `python -B probes/applied-performance/run.py --stable-env --hash blake3
--output /outside/new-run --note /outside/REAL-NEW-NOTE.md` (one shell line).
Set PATH and CHROME_PATH identically for setup and reuse. A different launcher's
environment can correctly force a full run; all environment values are bound.
The ten timing repetitions represent one real note, not ten productive uses.
Hypothetical amortization is a forecast, never observed cumulative savings.

Use `bash scripts/verify-local.sh` for repeatable separate invocations. It runs
both setup and reuse with only HOME, PATH, CHROME_PATH and fixed locale/timezone,
explicitly discarding other inherited settings. CI refuses this entry point.
Set a stable PATH containing the intended Python/bun/node/tools; keep the venv
outside the checkout. The low-level Python command still binds its full inherited
environment and may miss across agent-launcher invocations. This miss was
observed in dogfooding and is retained in the evidence.

Measured results and retained misses: [RESULTS.md](RESULTS.md).
