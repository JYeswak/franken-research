# franken_markdown: re-check after v0.5.0 (addendum, 2026-10-03)

**Repository:** `Dicklesworthstone/franken_markdown` ·
**Packet pin (unchanged):** `88a6a99ed1ebc48c7910c28213005d8b35963079` (2026-09-22 14:37:59 UTC),
assessed in [`packets/franken_markdown-assessment.md`](../packets/franken_markdown-assessment.md) ·
**Re-check pin:** `cc5196d786eae3174c9502eea73ca8dd13c01a37` (2026-10-02 21:54:58 UTC), the commit
the `v0.5.0` tag and GitHub Release point at and the default-branch HEAD at census time,
135 commits after the packet pin ·
**HEAD at re-check, not assessed as a pin:** `cc5196d786eae3174c9502eea73ca8dd13c01a37` —
HEAD *is* the re-check pin; the census of 2026-10-03 records no commits after it ·
**Re-check date:** 2026-10-03 · **Rules:** [RULEBOOK.md](../RULEBOOK.md) v1.1 and
[updates/METHOD.md](METHOD.md). The packet is not edited; this file sits beside it.
First end-to-end run of the drift pipeline in [docs/landscape-rigor.md](../docs/landscape-rigor.md).

**Tier legend (Rulebook §1).** [Verified] Tier 1: the analyst inspected it directly. Flavors:
[Git-observed] git metadata and diffs in the analyst's clone, [Code-verified] source read.
[CI-observed] Tier 2. [Maintainer claim] Tier 3: asserted in the repository or release notes,
not re-derived. [External] Tier 4: GitHub, crates.io, and npm APIs. [Inference] Tier 5.

**Method.** The daily census (`watch/census/2026-10-03.tsv`, written by `watch/watch.mjs`
from the GitHub API) flagged this repo: `material_since_pin = yes: release v0.5.0
(2026-10-02, cc5196d)` — the only flag; license unchanged, workflow set unchanged.
`python3 scripts/packet-receipts.py verify` confirmed the pinned packet still regenerates
byte-identically from its pinned inputs before any live-repo claim was read. Blobless clone
of the public repository into scratch outside this tree; read the full 135-commit range
from the packet pin to the re-check pin (messages and author counts), the `v0.5.0`
CHANGELOG section, `Cargo.toml` at both pins, and diffed `LICENSE`, `.github/workflows/`,
and the CommonMark conformance floor across the range. Release metadata and asset list
from the GitHub Releases API; crate version and totals from the crates.io API; star/fork
counts from the GitHub repo API. Scratch clone deleted after the check.
**Not done:** nothing was compiled or executed; no test, conformance, determinism, or
claim-discipline gate was run; no release binary was downloaded or hashed; the npm
registry state was read from the README at the re-check pin, not queried directly.

## What changed, in one paragraph

Ten days after the pin, the maintainer shipped `v0.5.0` (2026-10-02 23:00:51 UTC), a
large feature release: 135 commits, 443 files changed, 72,140 insertions and 8,195
deletions [Git-observed, High]. It adds multi-chapter books (PDF, EPUB, offline HTML
sites), transclusion, and a native-WASM workspace; it makes breaking public-API changes;
and it fixes a real security bug present since 0.4.4 — highlighted code in the default
safe HTML output could contain live markup [Maintainer claim, High — changelog, not
reproduced]. The release carries 30 assets: five platform archives with `.sha256`
sidecars, a `SHA256SUMS` file, a manifest JSON, and the npm tarball [External, High].
crates.io serves 0.5.0 as the max version [External, High]. None of this moves a matrix
cell: the packet already credited a shipping, release-bearing project at TRL 7, and the
things that hold the ring at Explore — no independent benchmark, no external adoption
evidence, npm still lagging, bus factor 1 — are all exactly where the pin left them.

## Matrix cells: pin versus re-check

| Cell | At the pin (2026-09-22, `88a6a99`) | At the re-check (`cc5196d`) | Tier and evidence |
|---|---|---|---|
| TRL | 7 | **7, unchanged** | [Inference, Medium]. A feature release with breaking API changes is consistent with a released, iterating product; TRL 8 would need production use by someone else, and none is evidenced. The 0.5.0 security fix (live markup in "safe" HTML, present since 0.4.4) cuts the other way: the pin's "safe by default" reading of the renderer was more generous than the code deserved [Maintainer claim, High]. Net: unchanged. |
| NODUS ring | Explore | **Explore, unchanged** | [Inference, Medium]. Pilot requires a bounded, real workload fit demonstrated to someone besides the maintainer. Stars moved 104 → 105 and crates.io downloads 151 → 176 [External, High]; no independent benchmark, review, or deployment appeared. When in doubt, ring down. |
| License | MIT + OpenAI/Anthropic rider | **Same, unchanged** | [Verified, High]: `git diff --quiet 88a6a99 cc5196d -- LICENSE` exits 0; first line still "MIT License (with OpenAI/Anthropic Rider)"; census license flag `no`. The rider's benchmarking/analysis exclusion still applies to the two AI labs. |
| Bus factor | 1 | **1, unchanged** | [Git-observed, High]: all 135 commits in range authored by Jeff Emanuel (as "Jeff Emanuel", "Dicklesworthstone", or "Jeffrey Emanuel" — one person, three author strings); no co-author trailers observed in author counts. |
| CI class | C5 | **C5, unchanged** | [Verified, High]: `.github/workflows/` holds the same single file (`release-wasm.yml`, the explicitly DISABLED one) at both pins; census workflow flag `no`. Enforcement still runs through the maintainer's private DSR on his own hosts, unobservable externally — the packet's claim-8 finding stands verbatim. |
| Release class | R3 | **R3, unchanged** | [External + Git-observed, High]: `v0.5.0` is a GitHub Release published 2026-10-02T23:00:51Z whose target is the re-check pin itself; 30 assets including five platform archives with `.sha256` sidecars, `SHA256SUMS`, and `franken_markdown-v0.5.0-manifest.json`. Unlike the pin's 0.4.5 (release targeting an earlier state of the branch), this release sits exactly on HEAD. Still R3, now with zero commits between release and HEAD. |
| No-contribution policy | yes | **yes, unchanged** | [Verified, High]: no change to the contribution stance recorded in the range; single-author history throughout. |
| Independent validation | none | **none, unchanged** | [Verified absence + External, High]: nothing in the 135-commit range or the release records an outside benchmark, review, or deployment. The packet's "ultra-fast" claim (claim 3, *aspirational*) remains unmeasured against pulldown-cmark/comrak [Maintainer claim for internal numbers only]. |
| Analyst behavioral reproduction | no | **no, unchanged** | Nothing was compiled, run, or rendered in this re-check. |

**What the pinned suite counts would become under a re-pin at `cc5196d`** (not applied; the
published counts stay as of 2026-09-22): nothing. Every cell is unchanged, so the release
posture (R3 15), TRL spread, ring counts, license, CI, and bus-factor tallies all stand.
This is the census gate working as designed: a release flag triggered a reading, and the
reading's finding is that the pin's verdict survives the release.

## Claim-level drift worth the packet reader's attention

- **Version and surface.** `Cargo.toml` at the re-check pin: `version = "0.5.0"`,
  `fmd-font 0.3.3`, `fmd-math 0.1.2` (pin: 0.4.5 / 0.3.2 / 0.1.1); workspace still the
  same 3 crates [Code-verified, High]. `src/` Rust files: 192 at the re-check pin
  (packet counted 152 at the pin) [Git-observed, High]. The packet's scale claims are
  stale in the safe direction — the tree grew ~26% in files in ten days.
- **Security.** The 0.5.0 changelog discloses that highlighted code in default safe HTML
  could contain live markup since 0.4.4, and that the MCP server now bounds untrusted
  requests. The packet's claim 9 (MCP server demonstrated) and its safe-rendering
  framing predate the disclosure. Readers pinning 0.4.x for untrusted input should
  upgrade [Maintainer claim, High].
- **CommonMark floor.** `tests/fixtures/commonmark/conformance-floor.txt` reads `578`
  at both pins [Code-verified, High] — the ratchet did not move despite the feature
  release; claim 4's status is unchanged.
- **npm lag (packet revisit trigger).** The README at `cc5196d` still reads "npm remains
  at **0.4.4** pending publishing authentication" [Code-verified, High]. The trigger —
  npm shipping in sync with GitHub/crates.io — is **not** met; the release-pipeline
  weakness the packet named stands.
- **What did not happen.** No benchmark table vs pulldown-cmark/comrak, no second
  maintainer, no license-rider change, no iOS surface — every other revisit trigger
  in packet §4.11 remains open.

## Re-check receipt

- Census: `watch/census/2026-10-03.tsv`, row `franken_markdown` (flag: release v0.5.0).
- Receipt gate: `python3 scripts/packet-receipts.py verify` green before drafting.
- Commit range: `88a6a99..cc5196d`, 135 commits, 443 files, +72,140/−8,195.
- Release: `gh api repos/Dicklesworthstone/franken_markdown/releases/tags/v0.5.0` —
  published 2026-10-02T23:00:51Z, 30 assets.
- Registries: crates.io max 0.5.0, 176 total downloads; GitHub 105 stars / 9 forks.
- Scratch clone under `/tmp` deleted after evidence capture; nothing downloaded.
