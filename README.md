# Franken Research

An independent, evidence-tiered assessment of 44 repositories from Jeffrey Emanuel's FrankenSuite, published as a static site you can read online or offline.

**Live site: https://fr.zeststream.ai**

[![verify](https://github.com/JYeswak/franken-research/actions/workflows/verify.yml/badge.svg)](https://github.com/JYeswak/franken-research/actions/workflows/verify.yml)

![The Franken Research map: 44 FrankenSuite repositories placed by assessment ring](site/og-image.png)

Each repository was cloned at a single commit (the "pin"), read against one written protocol ([RULEBOOK.md](RULEBOOK.md)), and written up as a packet in which every substantive claim carries an evidence tier (Verified, CI-observed, Maintainer claim, External, Inference) and a confidence grade. The packets were then synthesized into suite-wide counts, and the site turns both into a map, one brief per repository, and a handful of practitioner pages.

## What we found

All numbers below are counted from the packets and stated in [synthesis/00-overview.md](synthesis/00-overview.md) (assessment date 2026-09-22).

1. **The pin is usually unverifiable or red.** Only 2 of 44 projects show public CI green at the assessed commit (`frankenscipy`, `franken_threed`). 11 are red at the pin, 6 have CI with no verdict for the pin, 11 have no test CI, 8 had CI disabled or deleted, and 6 verify only on the maintainer's private infrastructure. "Green suite" claims mostly rest on local or historical evidence. [CI-observed, High]
2. **Mechanism existence runs ahead of execution.** The suite's real strength is an unusually developed honesty apparatus: negative-evidence ledgers, claim registries, conformance harnesses, differential oracles, fail-closed gates. The same packets document that apparatus often not running where it matters, for example a safety census passing inside a red gate, or quality workflows with zero runs. [CI-observed, High]
3. **The license rider is the structural ceiling.** 38 of 44 repositories carry an MIT license plus a rider that withholds all rights, including benchmarking and testing, from OpenAI, Anthropic, and anyone acting for them. It blocks the two labs best placed to validate the work independently, and it sits in tension with the agent co-authorship the program relies on. [Verified, High]

Around those three: bus factor 1 in all 44 [Verified, High], no release or tag in 23 [External, High], and no independent third-party validation found for any of them, within the recall limits of the searches [External, High]. Only one verdict (`franken_threed`, 61 of 61 tests) rests on tests the analyst re-ran [Verified, High].

These are findings about evidence at a pin, not about the maintainer's ability. The briefs credit what is strong, and the honesty apparatus above is the reason many of these findings could be checked at all.

## Explore

| Page | What it is for | Who it helps |
|---|---|---|
| [The map](https://fr.zeststream.ai/) | All 44 repositories placed by assessment ring, with a table view and one-click access to every brief. | Anyone deciding where to look first. |
| [Briefs](https://fr.zeststream.ai/) | One page per repository: verdict, what it teaches, what would change the verdict, and a link to its full packet. | Evaluators and the projects' own users. |
| [Method](https://fr.zeststream.ai/method/) | How claims are governed: the 12-section packet, the five evidence tiers, and machine-checked citations into the packets. | Readers who want to know how far to trust a verdict. |
| [Techniques](https://fr.zeststream.ai/techniques/) | Claim-governance and measurement techniques observed in the suite, each with a falsification experiment. | Engineers who want to borrow what works. |
| [Failure modes](https://fr.zeststream.ai/failure-modes/) | Patterns that recurred across the suite, with exact counts and named instances. | Teams building with coding agents who want to avoid the same drift. |
| [Reproduce a verdict](https://fr.zeststream.ai/reproduce/) | The procedure for re-deriving a verdict at its pin, with a worked example. | Skeptics and independent reviewers. |
| [Starter kit](https://fr.zeststream.ai/starter-kit/) | Templates, checklists, and scripts for running the same method on your own project. | Anyone starting an agent-built project. |

## Graded by our own method

A repository that reports these findings should pass the same checks. [The self-assessment page](https://fr.zeststream.ai/self/) scores Franken Research on the master matrix columns: TRL, ring, license (MIT, no rider), bus factor (1: one maintainer, and help is welcome), contribution policy (open), CI at the pin (the badge above, not a claim), release posture (a v1.0.0 tag is planned at publication and does not exist yet), and independent validation (none yet). It also lists what we got wrong or cannot prove.

## Reproduce

Requirements: git, [Bun](https://bun.sh), python3, node, and Google Chrome or Chromium. The render gate looks in the usual install locations; set `CHROME_PATH` if your browser lives elsewhere.

```bash
git clone https://github.com/JYeswak/franken-research.git
cd franken-research
bun install --frozen-lockfile
bun run verify
```

`bun run verify` runs `site/scripts/verify-site.sh`, the same command CI runs. It prints PASS or FAIL for eleven gates and exits nonzero if any fails:

| Gate | Proves |
|---|---|
| A | Every packet and the Rulebook under `site/` is byte-identical to the canonical copy at the repo root. |
| A2 | Every method-page citation resolves to a real claim-table line in a shipped packet and quotes it correctly. |
| B | Every suite number on the site is computed from `site/assets/data.js`, its no-JS fallback matches, and no bare count is typed into copy. |
| C | NODUS, TRL, CI, the rider, the pin, and bus factor are defined before first use on every page. |
| D | Every brief pairs with exactly one packet, and the data file names the same 44. |
| E | Every internal link and anchor resolves offline. |
| F | Every file a page references ships. |
| G | Pages stay keyboard-operable, with no-JS, no-WebGL, and reduced-motion fallbacks. |
| H | Copy passes a slop scan (em-dash density, filler words, unsupported superlatives). |
| I | Five representative pages render in headless Chrome from `file://` at desktop and phone widths with zero console errors and zero horizontal overflow. |
| J | No page references removed scaffolding. |

CI also runs `bun run build:map` and fails if the committed `site/assets/app.bundle.js` differs from what its source builds, and scans the tree and history for secrets with gitleaks. [site/BUILD-GATES.md](site/BUILD-GATES.md) explains why each gate exists.

What the gates prove is that the site says what the packets say, consistently and reachably. They do not prove the packets are right; for that, follow [Reproduce a verdict](https://fr.zeststream.ai/reproduce/) against a real repository.

## Repository layout

| Path | Contents |
|---|---|
| `packets/` | The 44 assessment packets, one per repository, each pinned to a commit. The primary evidence. |
| `synthesis/` | Suite-wide synthesis: aggregate counts and master matrix (`00-overview.md`), CI requirements, failure patterns, cross-pollination, uniqueness, external validation, and per-repo cross-suite briefs. |
| `RULEBOOK.md` | The assessment protocol: evidence tiers, source hierarchy, packet template, ring rules. |
| `starter-kit/` | The method packaged for reuse: templates, checklists, scripts. |
| `ecosystem/` | Design notes on how the pieces fit, the A-Z playbook, and the project-pickup planning system. |
| `site/` | The static site served at fr.zeststream.ai. Runs from `file://` with no build step; `site/packets/` and `site/RULEBOOK.md` are byte-identical copies checked by gate A. |

## Corrections and right of reply

If you maintain an assessed project, or you find an error, [open an issue](https://github.com/JYeswak/franken-research/issues). Cite the packet file and line, what it gets wrong, and your evidence with its tier. [CONTRIBUTING.md](CONTRIBUTING.md) has the details.

How corrections are handled:

- Packets are the dated record of what was observed at a pin. They are not silently rewritten.
- An accepted correction is recorded in [CHANGELOG.md](CHANGELOG.md) with the date, the issue, and what changed. If it changes a number or a verdict, the data file, the brief, and every page that shows the number change in the same commit, and the gate chain must pass.
- A correction we decline gets a reply on the issue explaining why, with the evidence we relied on.
- Maintainers of assessed projects may post a reply to their brief; we will link it from that brief.

## Data notes

- Maintainer commit email addresses quoted from public git metadata were redacted from the packets, their site copies, and one synthesis brief before publication (commit `bbc1bda`). No other evidence text was changed.
- Everything else is as assessed on 2026-09-22, at each repository's pin. The FrankenSuite moves fast; check the pin date before quoting a verdict.
- The site's data file classifies one repository's CI (`frankenjax`) differently from the synthesis matrix. The difference is disclosed on the method page and changes no headline number.

## License

MIT, no rider. See [LICENSE](LICENSE). Anyone may use, benchmark, test, or index this work.
