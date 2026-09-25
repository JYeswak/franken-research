# Charter: the Franken Research search (v1)

Status: **LOCKED 2026-09-25 by the maintainer** ("Lock, but allow quotes"). The hash is in `manifest.json`; any change goes through the amendment protocol and invalidates the lock until re-approved.

## Mission

Anyone building software with coding agents can type what they want to build and, in under a second, get the evidence-graded practice, gate, technique, or crate from Jeffrey Emanuel's public ecosystem worth copying, with a paste-ready instruction for their agent, the source, the license, and how far to trust it.

## Users and jobs

- **REQ-U1** A developer starting a project with an agent: "I want to build a Rust CLI with a SQLite store; what should I copy and what should I tell my agent?"
- **REQ-U2** A team hardening its process: "How do I stop my agents claiming tests passed when they did not?"
- **REQ-U3** An evaluator: "Is there a Rust crate for X in this ecosystem, and can I use it?"

## Measurable outcomes (v1)

- **REQ-O1** Relevance: on a golden set of at least 40 real queries, a correct item appears in the top 3 for at least 80%, judged by an agent session that did not build the index and confirmed by a human.
- **REQ-O3** Honesty: every result shows its evidence tier or verdict, its license, and a source link. No result tells a reader to use a repository whose verdict says not to.
- **REQ-O4** Freshness: the index rebuilds from public sources on every deploy, and the daily watch's deploys keep it current without a human.
- **REQ-O2** Speed, as hard budgets measured on two reference profiles: desktop (Apple M-series, no throttle) and phone (headless Chrome, 4x CPU throttle, Fast 4G). Every figure is a p95 over at least 1,000 real queries after a warm-up, reported with p50, p99 and p99.9:
  - **Keystroke to results painted:** desktop 8 ms, phone 16 ms (one frame). p99 at most twice p95.
  - **Search usable after page load:** the box accepts queries and answers from the core shard within 300 ms (desktop) and 1,000 ms (phone) of `DOMContentLoaded`.
  - **Payload:** core shard (curated layers and published crates) at most 150 KB brotli; the full index at most 1.5 MB brotli, fetched lazily, never blocking typing.
  - **Main thread:** no single task over 50 ms while typing (Long Tasks API).
  - **Golden-set identity:** optimisation may not change which items the golden-set queries rank in the top 3.
- **REQ-O5** Usability: a fresh visitor completes each of three scripted tasks (one per user above) in under two minutes.

## Non-goals (v1)

- Rehosting Jeffrey's source code or builds of it. Results link to his repositories at a pinned commit. Short verbatim quotes are allowed (see Constraints).
- Generating answers with a model at query time (no server, no API cost, no hallucinated advice).
- Indexing full docs, ADRs, proofs, or code bodies (planned for v2, gated separately).
- Private or paid material, including jeffreys-skills.md content.
- New verdicts. The search surfaces existing, reviewed judgments; new assessments go through the cohort lane.
- A backend service. The site stays static.

## Constraints

- Ecosystem data comes from public GitHub. The crate directory and our own layers build in GitHub Actions (native remote). Derived catalogs that cannot be rebuilt in Actions (fh catalogs, rigor-atlas tables) are vendored as dated snapshots that record their source hash, build date, and a written rebuild procedure; they are never read from a private mirror at build or query time.
- Every indexed item traces to a stable ID (`RP-###`, a packet, a verdict file, a crate manifest at a commit).
- Snippets we generate (agent prompts, commands) come from our own MIT-licensed content. Short verbatim quotes of Jeffrey's code or docs are allowed (maintainer decision, 2026-09-25): each quote is a few lines at most, cites repo/path:line at a pinned commit, and carries the source repository's license, with the MIT notice and a plain flag when that license includes the rider. Jeffrey's repositories are MIT plus a rider that bars OpenAI, Anthropic, their affiliates, those acting for them, and ML training or evaluation use; results show that plainly and never imply the rider bars ordinary users.
- Credit: every result names the maintainer's repository and links it.
- Accessibility and phone use are requirements, not polish.
- Everything passes the existing gate chain; new behaviour gets new gates.

## Trust and authority

- The maintainer (Joshua Nowak) locks the charter, approves releases, and decides anything touching credit or the relationship with Jeffrey Emanuel.
- The lead agent session integrates plans and patches canonical surfaces.
- Authors and reviewers are separate agent sessions; release reviews use a different model lineage where available.

## Release definition (v1)

A tagged release with the search live on fr.zeststream.ai, REQ-O1 to REQ-O5 measured and met, all gates green, and an independent adversarial review with no open P0 or P1 defect.

## Irreversible choices needing the maintainer

- Widening the quote policy beyond short, cited, license-noticed quotes.
- Any change to how the rider is described.
- Adding a server, account system, or analytics.

## Amendment protocol

A new major feature must cite an outcome above or arrive as a written amendment approved by the maintainer. Reviews propose defects, not new scope.
