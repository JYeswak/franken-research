<!-- Review record, published as written. Review of updates/franken_code_browser-2026-09-24.md (author SincePin) by control-plane pane 2. Scratch paths refer to the reviewer's machine. -->

# Review of updates/franken_code_browser-2026-09-24.md

Checker: control-plane pane 2. Author of the addendum: SincePin. Not the same person.
Checked 2026-09-24, after the addendum's window (02:40–03:00 UTC). Read-only. The app was not launched or installed.

**1 finding.** The signing claims, the matrix cells at the re-check pin, and the eight census rows I re-queried hold. The public page's "HEAD is five commits later" does not, because two commits landed after the window.

## Finding

1. `site/updates/index.html:516` says "HEAD is five commits later." That was true of the named re-check HEAD. It is not true of GitHub HEAD now.

   `gh api repos/Dicklesworthstone/franken_code_browser/compare/cc8330d18b8da7b4ebd3571458fd51ef5d9d0a3e...HEAD` returned `ahead_by: 35` (the addendum's 33, plus 2). `compare/623340b4fa301e796988fc157ff9cfbb9fbf7a36...HEAD` returned `ahead_by: 2`: `c2e703dcd` at 2026-09-24T03:03:22Z and `00d843de7` at 2026-09-24T03:08:12Z. Both are authored by Jeff Emanuel. `.github` at live HEAD is still only `ISSUE_TEMPLATE`, so CI class is unchanged. The new commits are App Store packaging repairs. `00d843de7` also says build 4 processed for internal beta and build 3 remains queued for App Review. That is a newer maintainer claim than claim 9.

   The addendum's own lines 8–9 name `623340b` as "HEAD at re-check, not assessed as a pin" and remain true. The page drops the SHA, so a reader who opens the repository will count seven commits after `v0.1.0`, not five.

   Fix: on the page, write "HEAD at re-check (`623340b`) was five commits later," or read the two commits and say seven. Do not move R3 off `c7c5310` because of them.

## Signing, re-run

Download dir: `~/.local/state/zeststream/scratch/control-plane/franken-lead/verify-fcb/`. Image detached (`"disk9" ejected.`). Both downloaded files deleted. The app was not run.

```
shasum -a 256 -c FrankenCodeBrowser-macos-arm64.dmg.sha256
FrankenCodeBrowser-macos-arm64.dmg: OK
shasum -a 256 FrankenCodeBrowser-macos-arm64.dmg
698293fc864d984fda3deea37769abd84adcc7fd44a9dbffd6bd9bc214244b76  FrankenCodeBrowser-macos-arm64.dmg

codesign -dv --verbose=4 FrankenCodeBrowser-macos-arm64.dmg
FrankenCodeBrowser-macos-arm64.dmg: code object is not signed at all
codesign_dmg_rc=1

xcrun stapler validate FrankenCodeBrowser-macos-arm64.dmg
The validate action worked!
stapler_dmg_rc=0

spctl -a -vv -t open --context context:primary-signature FrankenCodeBrowser-macos-arm64.dmg
FrankenCodeBrowser-macos-arm64.dmg: rejected
source=no usable signature
spctl_dmg_rc=3

hdiutil verify FrankenCodeBrowser-macos-arm64.dmg
hdiutil: verify: checksum of "FrankenCodeBrowser-macos-arm64.dmg" is VALID
hdiutil_rc=0
```

Attached read-only at `verify-fcb/mnt`. App: `FrankenCodeBrowser.app`.

```
codesign -dv --verbose=4 FrankenCodeBrowser.app
Identifier=dev.frankencode.browser
Format=app bundle with Mach-O thin (arm64)
CodeDirectory v=20500 size=52003 flags=0x10000(runtime) hashes=1618+3 location=embedded
Authority=Developer ID Application: Jeffrey Emanuel (AU8V2Z6NKY)
Authority=Developer ID Certification Authority
Authority=Apple Root CA
Timestamp=Sep 23, 2026 at 4:03:08 PM
TeamIdentifier=AU8V2Z6NKY
codesign_app_rc=0

codesign --verify --deep --strict --verbose=2 FrankenCodeBrowser.app
FrankenCodeBrowser.app: valid on disk
FrankenCodeBrowser.app: satisfies its Designated Requirement

spctl -a -vv FrankenCodeBrowser.app
FrankenCodeBrowser.app: accepted
source=Notarized Developer ID
origin=Developer ID Application: Jeffrey Emanuel (AU8V2Z6NKY)
spctl_app_rc=0

xcrun stapler validate FrankenCodeBrowser.app
FrankenCodeBrowser.app does not have a ticket stapled to it.
stapler_app_rc=65

codesign -d --entitlements -
(no entitlement plist; only the Executable line)
CFBundleShortVersionString 0.1.0
CFBundleVersion 2
CFBundleIdentifier dev.frankencode.browser
LSMinimumSystemVersion 14.0
file: Mach-O 64-bit executable arm64
du: 27M
```

Release API now: not draft, not prerelease, published `2026-09-23T22:05:12Z`, `target_commitish` `c7c531061e250d81afc58da7cb35ec0b4e7129cb`, DMG 11,688,200 bytes, digest `sha256:698293fc864d984fda3deea37769abd84adcc7fd44a9dbffd6bd9bc214244b76`. Download count was 6 when I read it. The addendum's 5 was "when read." Not a defect.

`scripts/package_macos_dmg.sh` at `c7c5310`: line 68 signs the staged app, line 71 creates the image, line 92 staples `$output`. Matches the addendum.

## Is "DMG not signed" a user problem?

Wording inaccuracy, not a broken download, on the path I could check.

The release note "The DMG is signed with Jeffrey Emanuel's Developer ID" is false for the container. `codesign` on the DMG says it is not signed at all. The app inside is signed with that Developer ID, Gatekeeper accepts it as notarized, and the notarization ticket is stapled to the image. That is what the packaging script does. A user who opens the image and launches the app gets a notarized, Gatekeeper-accepted app, not an unsigned binary.

The residual the addendum already states is the real one: the ticket is not stapled to the app, and neither of us tested a quarantined open on a clean Mac, online or offline. An offline Gatekeeper check can fail an unstapled app even when the image carries the ticket. That is an untested edge, not evidence that the ordinary open fails. Calling it a wording slip, at Inference Medium, is fair. The page's callout says the same thing and does not overstate it.

## Matrix cells

| Cell | Verdict on the claim |
|---|---|
| TRL 2–3 to 4–5, Inference Medium | Holds. The verified part is a hashed, signed, notarized, Gatekeeper-accepted build. They did not launch it, and they do not call the launch records verified. A single "5" would have been too high. The range, with 5 conditional, is the careful reading. |
| Ring unchanged, Inference Medium | Holds. A release artifact is not a demonstrated workload. |
| License unchanged, Verified | Holds. `compare pin...623340b` lists no `LICENSE` change. |
| Bus factor 1, Git-observed | Holds inside the window. All 33 commits from the pin to `623340b` are Jeff Emanuel. `Co-authored-by` count in that range is 0. The two later commits are also his, so the cell does not move. The count 33 is the window, not live HEAD. |
| CI C4 unchanged, Verified | Holds at `c7c5310`, at `623340b`, and at live HEAD. `.github` is only `ISSUE_TEMPLATE`. Actions runs for `623340b`: `total_count` 0. |
| Release R3 at `c7c5310` | Holds. Tag and Release both point at that commit. Pin to tag is `ahead_by` 28. Tag to `623340b` is `ahead_by` 5. `compare 4286f92...c7c5310` is one commit, `scripts/install.sh` only, 8 insertions, 4 deletions. |
| R2 if re-pinned at HEAD | Holds as a description of their named HEAD, and still holds at live HEAD: the release still targets `c7c5310`, which is not HEAD. |

Repo created `2026-09-12T19:29:20Z`. Release published `2026-09-23T22:05:12Z`. Eleven days is the right interval. `repos/Dicklesworthstone/franken_macos` returned 404.

## Census spot-check

Seed `random.Random(20260924)`, eight rows. `commits_ahead` matched `compare pin...recorded-head` on all eight. No email address in the TSV: regex found none, and the file contains zero `@`.

| repo | TSV ahead | API ahead | releases after the pin |
|---|---|---|---|
| asupersync | 44 | 44 | none; newest Release is v0.5.0 on 2026-09-12, before the pin |
| frankentui | 31 | 31 | none; newest is v0.8.0 on 2026-09-14 |
| frankensearch | 104 | 104 | none; newest is v1.10.0 on 2026-09-08 |
| frankenterm | 141 | 141 | the three listed items are tags, not Releases. v0.15.12 targets `2a2907a`, tagged 2026-09-22T16:55:45Z. v0.15.11 targets `755ecd3`. v0.15.9 targets `062e292`. v0.15.8 is the pin. No later `v0.15.*` tag was missing from the cell. |
| franken_manim | 63 | 63 | none; newest is prerelease v0.4.0 on 2026-08-18 |
| frankensim | 90 | 90 | no Releases |
| frankensim_website | 0 | 0, identical | no Releases |
| franken_agent_detection | 0 | 0, identical | none after the pin; newest is v0.3.0 on 2026-09-16 |

## Fairness

The eleven-day notarized ship is the first sentence of the addendum and the heading of the public card. It is credited as a real event and as the packet's first revisit trigger. The private-import sentence is a fact (75-file import, `franken_macos` 404), and the addendum says the packet had already named that absence. I did not find a sneer or an overstated cell. The brief's "signed developer preview" is loose about the container, and acceptable, because the next clause says the brief is still the pin and points at this re-check.

## Not a finding

The page links to `blob/main/updates/franken_code_browser-2026-09-24.md`. That path is not on `origin/main` yet (`git cat-file -e` failed). The link is the right post-push URL. Push the file with the page or the published link 404s. I did not re-query Apple's lookup, and I did not re-read `Cargo.lock` or `rust-toolchain.toml`.
