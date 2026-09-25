# The Independent 100: a study

This folder holds our study of the people on the Independent 100 list: one record per person in `people.jsonl`, and longer deep dives in `deep/`. The site pages at https://fr.zeststream.ai/study/independent-100/ are generated from these files by `site/scripts/make-study.mjs`, and gate N checks that they match.

## Credit

The Independent 100 was curated by dan (@irl_danB) and published on 2026-09-24 at https://independent.prose.md/, announced at https://x.com/irl_danB/status/2103083310339735588. The list, its ranks and its section names are his. Number 100 is his open wild-card slot, and nominations go to him, not to us. This study is ours. It is not endorsed by dan or by anyone on the list.

## Method

- **Scope.** The 99 people named on the list, taken with the curator's rank and section as given. We did not add, drop or reorder anyone.
- **First-pass survey, 2026-09-24.** Ten AI agent sessions each profiled about ten people from public sources: personal sites and blogs, GitHub repositories and the GitHub API (licenses, stars, last activity, contributor counts), papers, and a small number of public posts. Each record says what the person publicly does, lists their public work with links and licenses, scores its relevance to our own work, and names what we would study next.
- **Deep dives, 2026-09-24 and 2026-09-25.** For a few people whose work overlaps ours most, a separate agent session read the source code and writing in depth and compared it with how we work. Each deep dive has its own page.
- **Public edition, 2026-09-25.** The records and deep dives were edited for publication under the rules below, every link was checked, and the result was schema-checked before any page was rendered.
- **Nothing was installed, run or benchmarked** for the survey. Where a deep dive ran something, it says so.

## Relevance rubric

Each record carries a score from 0 to 5 for **relevance to our work**: how much the person's public work bears on what we build and study (agent harnesses and orchestration, evals and verification, context and memory, agent security, research and evidence practice, local models, and writing and publishing). It is not a measure of the person, their influence or the quality of their work, and it is not a ranking of people.

- **5:** public, openly licensed work squarely in our lanes that we could study or adopt now.
- **4:** strong overlap, with a caveat such as a missing license, early maturity or a partial fit.
- **3:** a useful method or useful context, less directly adoptable.
- **2:** background for our work, with little to adopt.
- **1:** little connection to our work.
- **0:** no connection (no record uses it).

Each score is one reviewer's judgement: one agent session scored each person, and the ten sessions were not cross-calibrated. Read a 5 as "has something open and in our lanes", nothing more. The lenses on each record (for example `agents`, `evals`, `security`) name the lanes the score refers to.

## Evidence labels

Claims carry the labels used across Franken Research. **[Verified]** means we read the page, file or API response ourselves. **[Reported]** means a source says so and we did not check the underlying thing; a role that comes only from a person's X profile is labelled [Reported: X profile] and paraphrased. **[Inference]** is our own reasoning. Each record also has an overall confidence (High, Medium or Low) and a list of what could not be verified.

## Dates

- List published by the curator: 2026-09-24.
- First-pass survey: 2026-09-24. Stars, licenses and activity dates are as returned by the GitHub API that day.
- Deep dives: 2026-09-24 and 2026-09-25, as dated on each page.
- Public edition and link check: 2026-09-25.

## What the public edition leaves out

- **Public work first.** Each page is about what a person has published: code, writing, papers, talks and products. Biography is limited to a sourced professional role where it explains the work, and nothing here judges anyone's character or states their motives.
- **No raw X data.** We do not republish profile text, pinned posts, locations or follower counts. The survey's raw X API responses are not in this repository.
- **Nothing personal.** No home or work location, contact details, family or relationship details, health, financial or legal information about a person, private communications, images of people, or inferences about sensitive traits.
- **No identity resolution.** Pseudonymous accounts appear under their handle and the name shown on the list, with no gendered pronouns, and we do not link them to any other identity or give clues that would. Where a record linked a pseudonymous account to another account by inference, that link and the work that rested on it were removed.
- **Roles and shared affiliations are sourced.** A person's role, or a statement that two people share a lab or employer, appears only with a primary source (their own site, repository or paper) or their own profile, labelled as such.
- **No private material.** Local file paths, machine names, process ids, internal ticket ids and the names of private repositories were removed or replaced with a short public description. Each record's list of where the person's work appears in our own files was replaced by one public sentence (`in_our_work`) or omitted.
- **Neutral on sensitive topics.** Crypto tokens, politics and persona accounts are mentioned only where they are part of the person's public work, without judgement and without allegations.
- **Pliny the Liberator (#7)** is covered from public metadata and press coverage only, for defensive study. No repository contents were opened, run or summarised.
- **Security behaviour of third-party tools** is stated only as documented behaviour, with a link to the project's own documentation or source, never as a way to reproduce it.
- **Dead links.** A link that returned 404 or 410 on 2026-09-25 was removed together with its claim, or kept and marked "link dead as of 2026-09-25" where the item itself still stands.

## Files

- `people.jsonl`: one JSON object per line, 99 lines, ordered by rank. Keys, in this order: `rank`, `slug`, `handle`, `name`, `section`, `pseudonymous` (true or false), `identity`, `links` (`x`, `github`, `site`, `blog`, `other`), `public_work` (each: `name`, `url`, `kind`, `what`, `license`, `last_activity`, `stars`), `relevance` (`score`, `lenses`, `why`), `in_our_work`, `study_next` (each: `what`, `url`, `why`, `effort`), `adoption_notes`, `confidence`, `evidence`, `could_not_verify`. Every `public_work`, `study_next` and `evidence` URL is https. A pseudonymous record carries no gendered pronoun.
- `deep/<slug>.md`: one deep dive per file. Front matter first (`title`, `covers` as comma-separated ranks, `written` as a date, `summary` as one sentence), then Markdown limited to `##` and `###` headings, paragraphs, `- ` bullets with one nested level, `1. ` lists, pipe tables, `> ` quotes, bold, code spans and https links. The first section is `## Sources` and the last is `## What we could not verify`. A section headed "Internal notes" is not allowed in a public edition.
- To regenerate the pages after editing any of these files: `node site/scripts/make-study.mjs`, then `node site/scripts/make-study.mjs --check`.

## Limits

- This is a survey of public material, read in one or two days. Nothing was installed, run or benchmarked for the survey.
- Every relevance score is one reviewer's judgement, made by one of ten agent sessions that were not cross-calibrated. The scores say how much a person's public work bears on our own work; they do not rank people.
- Coverage of each person is uneven. Some people publish mostly code, some mostly writing, and some mostly on X, which we read only lightly.
- Stars, licenses and activity dates are as of 2026-09-24 and will drift. Licenses are as GitHub reports them unless a record says otherwise; check the license file before reusing anything.
- Roles and affiliations can change quickly. A role labelled [Reported: X profile] was taken from the person's own profile and not checked elsewhere.
- The agents that wrote the records and deep dives are AI coding agents. Their work was checked by other agent sessions and by the build gates, not by the people described.

## Corrections

If anything about you or your work is wrong or out of date, or you would rather not be covered here, open a correction with the "Independent 100 study" option: https://github.com/JYeswak/franken-research/issues/new?template=correction.yml. Every page also has a correction link that fills in its address. Accepted corrections are recorded in the repository changelog with the date. A request to remove a record is honoured without argument.
