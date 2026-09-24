# franken_code_browser: re-check after v0.1.0 (addendum, 2026-09-24)

**Repository:** `Dicklesworthstone/franken_code_browser` ·
**Packet pin (unchanged):** `cc8330d18b8da7b4ebd3571458fd51ef5d9d0a3e` (2026-09-22 14:39:48 UTC),
assessed in [`packets/franken_code_browser-assessment.md`](../packets/franken_code_browser-assessment.md) ·
**Re-check pin:** `c7c531061e250d81afc58da7cb35ec0b4e7129cb` (2026-09-23 22:02:31 UTC), the commit
the `v0.1.0` tag and GitHub Release point at, 28 commits after the packet pin ·
**HEAD at re-check, not assessed as a pin:** `623340b4fa301e796988fc157ff9cfbb9fbf7a36`
(2026-09-24 01:52:49 UTC), 5 commits after the re-check pin, 33 after the packet pin ·
**Re-check date:** 2026-09-24, 02:40 to 03:00 UTC (2026-09-23 local) · **Rules:**
[RULEBOOK.md](../RULEBOOK.md) v1.1 and [updates/METHOD.md](METHOD.md). The packet is not edited;
this file sits beside it.

**Tier legend (Rulebook §1).** [Verified] Tier 1: the analyst inspected it directly. Flavors:
[Git-observed] git metadata, [Code-verified] source read, [Signature-verified] `codesign` /
`spctl` / `stapler` / `shasum` output on the downloaded release artifact, [Verified absence] a
search of the tree that found nothing. All four map to Tier 1. [CI-observed] Tier 2.
[Maintainer claim] Tier 3: asserted in the repository or release notes, not re-derived.
[External] Tier 4: GitHub and Apple APIs. [Inference] Tier 5: analyst judgment.

**Method.** Blobless clone of the public repository into a scratch directory outside this tree;
read all 33 commit messages from the packet pin to HEAD and the files behind the new claims
(`DISTRIBUTION.md`, `CHANGELOG.md`, `README.md`, `scripts/install.sh`,
`scripts/package_macos_dmg.sh`, `scripts/package_macos_app_store.sh`,
`native/macos/swiftui/AppStore.entitlements`, `APP_STORE_LISTING.md`, `rust-toolchain.toml`,
`Cargo.lock`, `LICENSE`, `.github/`). Release metadata from the GitHub Releases and refs APIs.
Downloaded the release DMG and its `.sha256` sidecar, checked the hash, and checked signing and
notarization of the DMG and of the app inside it with the image attached read-only; then detached
and deleted the download. Queried Apple's public lookup API for the App Store record.
**Not done:** the app was not launched, installed, or run; nothing was compiled; no test suite
was run; no quarantined clean-machine install; the App Store build and upload package were not
seen (they are not public); App Store Connect state was not observed.

## What changed, in one paragraph

Eleven days after the repository was created (2026-09-12 19:29 UTC) and one day after the pin, the
maintainer published a first GitHub Release, `v0.1.0` "Developer Preview" (2026-09-23 22:05 UTC):
an Apple Silicon DMG whose app is signed with a Developer ID, notarized by Apple, and accepted by
Gatekeeper on this machine, plus a checksum-verifying shell installer and a Homebrew cask. That is
a real event, and it is the first item on the packet's revisit list. The packet's "no product a
third party can run" is no longer true at the re-check pin [Signature-verified, High]. What made it
possible in a day is on the record: the SwiftUI/Metal app was not written after the pin; commit
`915d596` imported it (75 files, 22,347 lines) from "the preserved local franken_macos history at
`8ffd16f`", a history that was never public (`repos/Dicklesworthstone/franken_macos` returns 404)
[Git-observed + External, High]. The packet read that absence correctly at the pin (its revisit
trigger 3: "a `franken_macos` remote appearing with the native renderer auditable"). A sandboxed Mac
App Store edition was built and, per the maintainer, submitted for review; that remains a
maintainer claim.

## Matrix cells: pin versus re-check

| Cell | At the pin (2026-09-22, `cc8330d`) | At the re-check (`c7c5310`) | Tier and evidence |
|---|---|---|---|
| TRL | 2–3 | **4–5** (4 on what the analyst verified; 5 if the maintainer's launch records are taken at face value) | [Inference, Medium]. Verified: a signed, notarized, Gatekeeper-accepted build of the whole system exists and matches its published hash. Maintainer claim, not reproduced: launched on physical Macs against real repositories (20,619-file and 19,478-file Asupersync atlases, `DISTRIBUTION.md`). Still open by the maintainer's own account: clean-machine install matrix, continuous-zoom and large-repository performance ("still need performance and scale work", release notes). `ROADMAP.md` is byte-identical to the pin, so its G0–G7 gates carry no new pass record. An outside launch on a clean Mac against a real repository would support 5. |
| NODUS ring | Explore (-with-a-ceiling) | **Explore (-with-a-ceiling), unchanged** | [Inference, Medium]. Pilot needs a release artifact **and** a bounded, real workload fit. The first half is now met. The second is not demonstrated to anyone but the maintainer, whose own checklist leaves the clean-machine matrix unchecked. When in doubt, ring down. |
| License | MIT + OpenAI/Anthropic rider | **Same, unchanged** | [Verified, High]: `LICENSE` is byte-identical from `cc8330d` to `623340b` (`git diff --quiet` exit 0); first line "MIT License (with OpenAI/Anthropic Rider)". GitHub's license API reports `NOASSERTION` [External, High]. Open question [Inference, Low]: a Mac App Store copy would ship under Apple's standard end-user agreement unless a custom one is supplied, and which one was chosen is not visible outside App Store Connect. |
| Bus factor | 1 | **1, unchanged** | [Git-observed, High]: all 33 commits from the pin to HEAD are authored and committed by Jeff Emanuel; zero `Co-authored-by` trailers in the range. The README still carries "I do not accept outside contributions for any of my projects" [Verified, High]. |
| CI class | C4 (no test CI) | **C4, unchanged** | [Verified, High]: `.github/` at `c7c5310` and at `623340b` holds only `ISSUE_TEMPLATE/`; no workflow files; the Actions API returns no runs for the HEAD commit [External, High]. Every signing, notarization, `hdiutil verify`, ShellCheck, and `brew audit` result in the commit messages ran on the maintainer's machine [Maintainer claim, High]. |
| Release class | R1 (no release or tag) | **R3 at the re-check pin**; R2 by the strict legend if re-pinned at HEAD | [External + Verified, High]: `v0.1.0` is a lightweight tag on `c7c531061e25…` and the Release's `target_commitish` is the same commit. HEAD is 5 commits later (App Store edition source and docs), so a HEAD pin would sit in the matrix's "release targets an earlier commit" bucket. The app payload was built from `4286f92`; `git diff --stat 4286f92 c7c5310` touches only `scripts/install.sh` (8 insertions, 4 deletions), matching the release note's "No application source changed between them" [Git-observed, High]. |
| No-contribution policy | yes | **yes, unchanged** | [Verified, High], README "About Contributions" at `623340b`. |
| Independent validation | none | **none, unchanged** | [Inference, High]: Apple notarization is an automated malware and signing check, not a review of function. App Review has not concluded (below). Homebrew acceptance is the maintainer's own tap. |
| Analyst behavioral reproduction | no | **no, unchanged** | The analyst did not launch the app. |

**What the pinned suite counts would become under a re-pin at `c7c5310`** (not applied; the
published counts stay as of 2026-09-22): release posture R1 23 to 22 and R3 15 to 16; TRL spread
loses one 2–3 and gains one 4–5; rings, license, CI, and bus factor counts unchanged.

## Signing and notarization, as observed

Asset list from `gh api repos/Dicklesworthstone/franken_code_browser/releases`: the Release
"FrankenCodeBrowser 0.1.0 — Developer Preview", not draft, not prerelease, published
2026-09-23T22:05:12Z, two assets: `FrankenCodeBrowser-macos-arm64.dmg` (11,688,200 bytes, API
digest `sha256:698293fc…244b76`, 5 downloads when read) and
`FrankenCodeBrowser-macos-arm64.dmg.sha256` (101 bytes) [External, High].

Downloaded with `gh release download v0.1.0 -R Dicklesworthstone/franken_code_browser -p 'FrankenCodeBrowser-macos-arm64.dmg*'`:

```
$ shasum -a 256 -c FrankenCodeBrowser-macos-arm64.dmg.sha256
FrankenCodeBrowser-macos-arm64.dmg: OK
$ shasum -a 256 FrankenCodeBrowser-macos-arm64.dmg
698293fc864d984fda3deea37769abd84adcc7fd44a9dbffd6bd9bc214244b76  FrankenCodeBrowser-macos-arm64.dmg
```

The same hash appears in the API asset digest, the sidecar, `DISTRIBUTION.md`, `CHANGELOG.md`, and
the Homebrew cask (`Dicklesworthstone/homebrew-tap`, `Casks/franken-code-browser.rb`, commit
`2a4540a`) [Signature-verified + External, High].

The disk image container:

```
$ codesign -dv --verbose=4 FrankenCodeBrowser-macos-arm64.dmg
FrankenCodeBrowser-macos-arm64.dmg: code object is not signed at all
$ spctl -a -vv -t open --context context:primary-signature FrankenCodeBrowser-macos-arm64.dmg
FrankenCodeBrowser-macos-arm64.dmg: rejected
source=no usable signature
$ xcrun stapler validate FrankenCodeBrowser-macos-arm64.dmg
The validate action worked!
$ hdiutil verify FrankenCodeBrowser-macos-arm64.dmg
hdiutil: verify: checksum of "FrankenCodeBrowser-macos-arm64.dmg" is VALID
```

The app inside, after `hdiutil attach -readonly -nobrowse -noautoopen -mountpoint <scratch>/mnt`:

```
$ codesign -dv --verbose=4 FrankenCodeBrowser.app
Identifier=dev.frankencode.browser
Format=app bundle with Mach-O thin (arm64)
CodeDirectory v=20500 size=52003 flags=0x10000(runtime) hashes=1618+3 location=embedded
Authority=Developer ID Application: Jeffrey Emanuel (AU8V2Z6NKY)
Authority=Developer ID Certification Authority
Authority=Apple Root CA
Timestamp=Sep 23, 2026 at 4:03:08 PM
TeamIdentifier=AU8V2Z6NKY
$ codesign --verify --deep --strict --verbose=2 FrankenCodeBrowser.app
FrankenCodeBrowser.app: valid on disk
FrankenCodeBrowser.app: satisfies its Designated Requirement
$ spctl -a -vv FrankenCodeBrowser.app
FrankenCodeBrowser.app: accepted
source=Notarized Developer ID
origin=Developer ID Application: Jeffrey Emanuel (AU8V2Z6NKY)
$ xcrun stapler validate FrankenCodeBrowser.app
FrankenCodeBrowser.app does not have a ticket stapled to it.
```

Also observed: the bundle declares no entitlements (`codesign -d --entitlements -` printed none),
`CFBundleShortVersionString` 0.1.0, `CFBundleVersion` 2, `LSMinimumSystemVersion` 14.0, one arm64
executable, 27 MB unpacked [Signature-verified, High]. The image was detached (`"disk9" ejected.`)
and both downloaded files deleted.

**Reading it.** The app is Developer ID-signed with the hardened runtime and a secure timestamp,
and Gatekeeper accepts it as notarized [Signature-verified, High]. The notarization ticket is
stapled to the DMG, not to the app; that is how `scripts/package_macos_dmg.sh` is written (it
signs the staged app at line 68, creates the image at line 71, and staples the image at line 92)
[Code-verified, High]. The DMG container itself carries no code signature, so the release note's
"The DMG is signed with Jeffrey Emanuel's Developer ID" and the README's "A Developer ID-signed,
notarized DMG" are inaccurate about the container; the app inside is what is signed
[Signature-verified, High on the fact; Inference, Medium that it is a wording slip rather than a
missed step, since `DISTRIBUTION.md` says only "signs the staged app"]. Whether an unsigned,
stapled DMG opens without a warning when downloaded with a quarantine flag on a clean Mac was not
tested; the maintainer lists that same matrix as open.

## New claims since the pin

Status uses the Rulebook §4.3 vocabulary.

| # | Claim | Status | Evidence | Tier, Confidence |
|---|---|---|---|---|
| 1 | A public v0.1.0 release ships an Apple Silicon DMG and a SHA-256 sidecar | demonstrated | Releases API; download; `shasum -c` OK | [External + Signature-verified, High] |
| 2 | "notarized by Apple, and stapled" (release notes) | demonstrated | `spctl` "source=Notarized Developer ID" on the app; `stapler validate` passes on the DMG | [Signature-verified, High] |
| 3 | "The DMG is signed with Jeffrey Emanuel's Developer ID" (release notes) | disproven for the container; demonstrated for the app inside | `codesign` on the DMG: "not signed at all"; on the app: Developer ID Application, Team AU8V2Z6NKY | [Signature-verified, High] |
| 4 | The app payload was built from `4286f92`; no application source changed before the tag | demonstrated | `git diff --stat 4286f92 c7c5310` = `scripts/install.sh` only | [Git-observed, High] |
| 5 | The installer checks SHA-256, disk image integrity, bundle ID, Team ID, code signature, and Gatekeeper before copying, and keeps a dated backup on `--force` | partially demonstrated: present as code, not executed by the analyst | `scripts/install.sh` lines 208–270 at `c7c5310`. The sidecar comes from the same release as the DMG, so the hash catches corruption, not a replaced release; the Team ID pin plus Gatekeeper is the authenticity check | [Code-verified, High; Inference, High on the reading] |
| 6 | A Homebrew cask installs the release | partially demonstrated | Cask file exists and pins the same SHA-256; `brew style` / `brew audit --strict` / `brew fetch` results not re-run | [External, High; Maintainer claim for the audits] |
| 7 | Launched on physical Macs against real repositories (20,619 and 19,478 atlas files) | partially demonstrated: the launched artifact is verified, the launches are not reproduced | `DISTRIBUTION.md`, commit `7bf2591` | [Maintainer claim, Medium] |
| 8 | A sandboxed Mac App Store edition exists with read-only user-selected folder access and app-scoped bookmarks | partially demonstrated: source read, binary not seen | `AppStore.entitlements` (3 keys), `FCB_APP_STORE` paths in `App.swift`, `scripts/package_macos_app_store.sh`, all after the re-check pin | [Code-verified, High] |
| 9 | Version 0.1.0 was submitted for App Review, state WAITING_FOR_REVIEW (submission `e1417f93…`) | partially demonstrated: listing copy and screenshot are in the tree; the review state is not observable from outside | `DISTRIBUTION.md`, `CHANGELOG.md`, `APP_STORE_LISTING.md`, commit `623340b`. Apple's public lookup for app id 6815480105 and for bundle `dev.frankencode.browser` returned `resultCount: 0` at 2026-09-24 02:57 UTC, consistent with "not yet public" and silent on review state | [Maintainer claim, Medium; External, High for the empty lookup] |
| 10 | The README's performance objectives (120 Hz, 30 ms p95 warm search, 3 GiB) | aspirational, by the README's own label | "These are **targets, not achieved product SLOs**" and "not a finished 120 Hz claim" (README at `623340b`) | [Verified, High] |
| 11 | A dated toolchain pin is published | demonstrated | `rust-toolchain.toml`: `nightly-2026-09-07`, rustfmt, minimal profile | [Verified, High] |
| 12 | The `franken_markdown` dependency no longer needs a neighboring checkout | demonstrated | `Cargo.lock` source `git+https://github.com/Dicklesworthstone/franken_markdown.git?rev=d6fbd1d5…` (was a local path at the pin) | [Verified, High] |
| 13 | asupersync is the orchestration foundation | aspirational | No `asupersync` package in `Cargo.lock` at `c7c5310` and no mention in any `Cargo.toml`, although the repository's GitHub topics now list `asupersync` | [Verified absence + External, High] |
| 14 | README describes the tree | partially demonstrated | README now says "developer preview" and lists open work, but still links a status file it calls "a dated September 14 snapshot" and repeats the "Developer ID-signed DMG" wording | [Verified, High] |

## What did not change

- Still no CI workflows: `.github/` holds issue templates only, at the re-check pin and at HEAD.
- Still the rider: `LICENSE` is byte-identical to the pin.
- Still one human: 33 of 33 commits by the maintainer; outside contributions still refused.
- Still no independent validation and no analyst execution of anything.
- Still no asupersync edge in the dependency graph.
- Still unmeasured performance: the release notes say continuous zoom and very large repositories
  need work, and the README calls its objectives "targets, not achieved product SLOs".
- `ROADMAP.md` is unchanged since the pin; `IMPLEMENTATION_STATUS.md` is labeled by the README as a
  September 14 snapshot.
- Not re-checked here: the packet's unsafe-code finding (claim 12) and its layering findings.
  `native/macos` adds a C-ABI and Metal boundary whose unsafe surface was not counted.

## The packet's revisit triggers

1. First tagged release or published toolchain pin: **fired, both** (`v0.1.0`; `rust-toolchain.toml`).
2. First CI workflow on a third-party-visible runner: **not fired.**
3. A `franken_macos` remote with the native renderer auditable: **fired in substance.** No separate
   remote exists, but the renderer source is public in-tree under `native/macos/`.
4. A second human committer or an outside host embedding `fcb`: **not fired.**
5. An independent benchmark of any kind: **not fired.**

Next triggers for this addendum: Apple's review outcome made public (an App Store listing that
resolves); a CI workflow that builds the app; an outside clean-machine install and launch
report; a second release whose tag equals HEAD.

## Limitations

The analyst did not run the application, the installer, or any test; did not compile the tree;
did not test a quarantined download on a clean Mac; did not see the App Store binary or App Store
Connect; did not re-audit the packet's code-level findings beyond the lines cited above. Gatekeeper
acceptance was observed on one analyst Mac (macOS 26.5.2, arm64) with network access, so an online
notarization lookup may have contributed. The five DMG downloads counted by the API are not evidence
of use.
