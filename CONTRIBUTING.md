# Contributing to Franken Research

Corrections are the most useful contribution. This repository reports that every FrankenSuite project it assessed has a bus factor of 1; so does this one. Help is welcome, whether that is a one-line correction or co-maintaining.

## Propose a correction

Open a [correction issue](https://github.com/JYeswak/franken-research/issues/new?template=correction.yml). The form asks for:

1. **Where.** The packet file and line, in the form `packets/<name>-assessment.md:LINE`. If the error is on the site, give the page and quote the sentence, and name the packet line it derives from if you can.
2. **What is wrong.** Quote the claim as written and say what it should say.
3. **Your evidence, with its tier.** Use the tiers in [RULEBOOK.md](RULEBOOK.md) §1: Verified (you inspected a clone at the pin, an API response, or a live page), CI-observed (a CI run page, with its URL), Maintainer claim, External (an independent source, with a link), or Inference. Add a confidence grade (High, Medium, Low).
4. **The pin.** Say which commit your evidence applies to. Evidence from a later commit is a staleness report, which is useful, but it does not show the packet was wrong at its pin.

Demotions of a claim need counter-evidence. A newer commit that fixes a reported problem is welcome news and will be noted, but it does not rewrite what was observed at the pin.

## How corrections are handled

- Packets are the dated record of what was observed at a pin and are not silently rewritten. Changes after the pin go into a dated re-check under `updates/` (see [updates/METHOD.md](updates/METHOD.md)).
- A separate agent session, not the one that wrote the packet, checks the evidence in a correction, and a human decides whether to accept it.
- Accepted corrections are recorded in [CHANGELOG.md](CHANGELOG.md) with the date, the issue link, what changed, and credit to the reporter. If a correction changes a number or a verdict, `site/assets/data.js`, the brief, the synthesis, and every page that shows the number change in the same commit.
- Declined corrections get a reply on the issue with the evidence relied on.

## Other issue forms

- [New evidence](https://github.com/JYeswak/franken-research/issues/new?template=new-evidence.yml): a release, CI result, license change, or new repository the daily watch missed, or an event that deserves a re-check.
- [Suggest a project](https://github.com/JYeswak/franken-research/issues/new?template=suggest-project.yml): a public Rust project, or an AI-built project in another language, that should be assessed.
- [Site bug](https://github.com/JYeswak/franken-research/issues/new?template=site-bug.yml): a page on the site is broken or unreadable.
- [Idea](https://github.com/JYeswak/franken-research/issues/new?template=idea.yml): a thought or request about the site, the method, or the starter kit.

Security problems with the site or the workflows go through a private report, not an issue; see [SECURITY.md](SECURITY.md). Everyone taking part agrees to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Right of reply

Maintainers of assessed projects may post a reply to their brief as an issue. We will link it from that brief.

## Run the gates

```bash
bun install --frozen-lockfile
bun run verify
```

Every change to `site/` must leave all eleven gates passing. Never weaken, skip, or narrow a gate to get a green run; fix the page instead. If you think a gate is wrong, say so in the issue or pull request and leave the gate in place. What each gate checks is in [site/BUILD-GATES.md](site/BUILD-GATES.md). The pull request template asks for the `bun run verify` output.

If you edit `site/assets/app.src.js`, rebuild the bundle and commit both files; CI fails when they disagree:

```bash
bun run build:map
```

Files under `packets/`, `site/packets/`, `RULEBOOK.md`, and `site/RULEBOOK.md` are evidence. Changes to them go through the correction process above, and gate A requires the site copies to stay byte-identical to the root copies.

## Commit subjects

Every commit subject ends with the level of verification behind it, in brackets:

| Tag | Meaning |
|---|---|
| `[test]` | You ran the gate chain (or the relevant test) and it passed on this change. |
| `[selftest]` | The change was checked by its own built-in check. |
| `[mutation]` | You planted a known-bad input, showed the check fails on it, then restored it. |
| `[live]` | Verified against the live site or a live external system. |
| `[pending]` | Not yet verified. Say what would verify it in the commit body. |

Example: `Correct frankenredis release count in brief [test]`.

## License

By contributing you agree that your contribution is licensed under the MIT License in [LICENSE](LICENSE).
