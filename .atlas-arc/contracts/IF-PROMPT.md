# IF-PROMPT: "tell your agent" templates and the quote policy (S06)

Owner: S06. Inputs: IF-ENTRY.md fields, IF-HONESTY.md rules. Resolves UNK-005 (proposed DEC-P10).

## 1. How prompts are made

- Built once, at index time, by the generator from fields we wrote (charter Constraints: "Snippets we generate … come from our own MIT-licensed content"). No model writes or rewrites a prompt at build or query time (charter non-goal).
- Each template has an id `<kind>/<variant>@<n>` stored in `prompt.template`. Changing a template's wording bumps `n`; gate Q2's regeneration then shows every changed prompt in the diff.
- Slot values are our fields only: `what_to_copy`, gate definitions, technique concepts and falsification experiments, fh rule and mechanism text, rigor-atlas apply/expected-result text, verdict ring and TRL, license sentences (§3). Verbatim upstream text never enters a prompt (HON-12); a quote is shown beside the prompt, never inside it.
- Links in prompts are absolute: the on-site page as `https://fr.zeststream.ai<urlPath>` (the `urlPath()` rule of `site/scripts/shell.mjs:76-80`), and upstream code as the pinned GitHub URL.
- No counts of the form "N of 44" in prompts: gate B forbids bare `N of 44` literals in visible copy (site/BUILD-GATES.md:75-101), and a static fallback list would render prompts.
- Every prompt ends with a proof request (a file and line, a planted failure, a test run), because a prompt that asks for no evidence invites the agent to claim the change without showing it.
- Length 40–1,600 characters (schema).

## 2. Templates (one per kind; posture variants for the software kinds)

`{license_sentence}` is §3. `{site}` is the absolute on-site URL. `{pin}` is the first 7 hex of the commit and its date.

| Template id | Kind | Allowed postures | Text |
|---|---|---|---|
| `practice/adopt@1` | practice | practice | In this repository: {what_to_copy} This is practice {RP-id} from Franken Research ({site}), seen in {evidenced_in}. When you are done, show me the file and line where it lives and one run that proves it works. |
| `readiness-gate/adopt@1` | readiness-gate | practice | Add this gate to this repository: {definition}. Franken Research describes it, with examples from Jeffrey Emanuel's repositories, at {source_url}; one example is {example_path} in {example_repo}. Prove the gate trips: plant one known-bad input, show me it fails, then show it passing on the real tree. |
| `checklist-item/adopt@1` | checklist-item | practice | Apply starter-kit item {kit-id}, "{title}", from Franken Research to this repository ({site}). {item_summary} {provisional_note} Show me the check that enforces it and a run where it fails on a planted violation. |
| `technique/study@1` | technique (`fr:tech`) | practice | Consider the technique "{title}" from Franken Research ({site}): {concept} If it fits this project, tell me where it would go, and run its falsification experiment before building it: {falsification_experiment} |
| `technique/apply@1` | technique (`fh:techniques`) | practice | Look at how Jeffrey Emanuel's {repo} uses {technique_name} at {exemplar_url} ({pin}): {mechanism} If a hot path here would benefit, measure it first, then apply the same mechanism in our own code and show me the benchmark before and after. {license_sentence} |
| `failure-mode/avoid@1` | failure-mode | practice | Check this repository for failure mode {Pn}, "{title}", as Franken Research describes it ({site}): {summary} Tell me whether it applies here, what evidence you found, and one change that would catch it. |
| `lesson/study@1` | lesson | practice | Franken Research's lesson from {repo} on {topic}: {lesson_text} Tell me whether this project has the same gap and the smallest change that would close it. Source: {brief_site}. |
| `repo-verdict/pilot@1` | repo-verdict | use, use-wrapped, pilot | Read Franken Research's assessment of Jeffrey Emanuel's {repo} ({brief_site}): ring {ring}, TRL {trl}, assessed at {pin}. If we use it, keep it to one bounded workload behind a wrapper we own, so it can be removed. {license_sentence} Tell me which workload and how we would back it out. |
| `repo-verdict/study@1` | repo-verdict | patterns-only, do-not-depend, watch | Read Franken Research's assessment of Jeffrey Emanuel's {repo} ({brief_site}): ring {ring}, TRL {trl}. {posture_sentence} Do not add {repo} as a dependency. Tell me which of its practices we could copy into our own code, with the file and line each comes from. {license_sentence} |
| `repo-verdict/reference@1` | repo-verdict | reference-only | Franken Research rates Jeffrey Emanuel's {repo} Monitor ({brief_site}): a website, retired artifact or plan-stage work. Use it as a reference only; do not depend on it. Tell me what, if anything, in it is relevant here. |
| `stack-verdict/adopt@1` | stack-verdict | use, use-wrapped | For {area}, Franken Research's verdict is {stack_verdict} ({site}): {bottom_line} Tell me which of the tools it names fits this project, and what our wrapper must hide so we can swap it later. |
| `stack-verdict/watch@1` | stack-verdict | watch | For {area}, Franken Research's verdict is Watch ({site}): {bottom_line} Do not adopt a tool here yet. Tell me what would have to change, per its "Revisit when" list, before we should. |
| `rigor-layer/adopt@1` | rigor-layer | practice | Add rigor layer {L}, "{layer_name}", to this repository: {rule} Examples in Jeffrey Emanuel's code: {exemplars}. Show me the file that implements it here and a run where it fails on a planted defect. {license_sentence_if_copied} |
| `oracle/adopt@1` | oracle | practice | Use {oracle_name} as an external reference for our {domain} code, the way Jeffrey Emanuel's {repo} does ({exemplar_url}, {pin}). Write a test that runs our implementation and the reference on the same inputs and fails on any difference, and show me it catching one planted difference. |
| `runbook-step/adopt@1` | runbook-step | practice | {title}. This is step {step_id} of the {topic} runbook in franken-harvest (rigor layer {layer}); an example is {exemplar_path} in Jeffrey Emanuel's {repo} ({exemplar_url}). Do it in this repository and show me the result. |
| `capability/pilot@1` | capability | use, use-wrapped, pilot | Try {function_name} from the {crate} crate in Jeffrey Emanuel's {repo} ({source_url}, {pin}) in place of our {capability_name} code, behind a wrapper we own. {license_sentence} Show me its tests passing at that version and our call sites before and after. |
| `capability/evaluate@1` | capability | patterns-only, do-not-depend, watch, reference-only, unassessed | Evaluate {function_name} in the {crate} crate from Jeffrey Emanuel's {repo} ({source_url}, {pin}) as a model for our {capability_name} code. {posture_sentence} Do not add it as a dependency yet. {license_sentence} Tell me its API and whether we should write our own. |
| `prescription/study@1` | prescription | practice | Where this project needs {result_needs}, consider this pattern from the rigor atlas: {apply_summary} Expected result: {expected_result} Exemplars in Jeffrey Emanuel's code: {exemplars}. Write the test that would show the expected result holds before you change any code. |
| `crate-kind/study@1` | crate-kind | practice | Check this project against the rigor atlas kind "{kind}": {definition} If it fits, list which of its invariants apply here and which claims we must not make: {do_not_claim} |
| `repo-profile/study@1` | repo-profile | every posture | Read the rigor atlas profile of Jeffrey Emanuel's {repo} (kind {kind}, as of {pin}): {summary} Its main invariant, as the atlas states it: {invariant} Tell me whether we need a similar invariant and how we would test it. {posture_sentence} {license_sentence} |
| `applied-technique/study@1` | applied-technique | practice | Read how Jeffrey Emanuel's {repo} {technique_summary}: {first_target_url} ({pin}). If this project has the same problem, write our own version and a test that checks: {guarantee} {license_sentence} Keep that notice with anything you copy. |
| `crate/pilot@1` | crate | use, use-wrapped, pilot | Pilot the Rust crate {crate} {version} ({crates_io}) in one bounded part of this project, behind a thin wrapper we own, so it can be removed without touching the rest. {verdict_sentence} {license_sentence} Before you finish, run its tests at that version and tell me which of our workloads the pilot covers and how we would back it out. |
| `crate/evaluate@1` | crate | watch, unassessed | Evaluate the Rust crate {crate} {version} from Jeffrey Emanuel's {repo} at {pin} ({source_url}) for this project. Do not add it as a dependency yet. {verdict_sentence_or_unassessed} {license_sentence} Report its public API, whether `cargo test -p {crate}` passes in a clone at that commit, and whether its license fits this project. |
| `crate/study@1` | crate | patterns-only, do-not-depend, reference-only | Study how the {crate} crate in Jeffrey Emanuel's {repo} ({source_url}, {pin}) does what we need. Do not add it as a dependency: {posture_sentence} ({brief_site}). Write our own version of the idea and tell me what you took from it. {license_sentence} |

Posture sentences (fixed text, chosen by posture): `patterns-only` → "Its verdict is to adopt the patterns, not the package."; `do-not-depend` → "Its verdict is not to depend on the software."; `watch` → "Its verdict is that the work is substantive but unproven."; `reference-only` → "It is rated Monitor, not something to depend on."; `unassessed` → "Franken Research has not assessed its repository.". Each is backed by the cited line in `search/verdict-posture.tsv` (HON-05). Stack verdicts map by their front-matter `verdict`: Adopt → `use`, Adopt and wrap → `use-wrapped`, Watch → `watch`. Build clean-room has no template in v1 (no stack verdict uses it today: 20 are Adopt and wrap and 1 is Watch, intake-IntakeFR2 §1.2); the generator fails if one appears, so a template is written before such a verdict ships.

Only the `adopt`, `apply` and `pilot` variants may carry `copy.command`, and only a `pilot` variant may name a package manager command (HON-04).

## 3. License sentences (one constant per class)

| Class | Sentence |
|---|---|
| `MIT+rider` | Its license is MIT with a rider that bars OpenAI, Anthropic, their affiliates, those acting for them, and ML training or evaluation use: {license_url}. |
| `MIT` | Its license is MIT: {license_url}. |
| `Apache-2.0` | Its license is Apache-2.0: {license_url}. |
| `none` | Its repository has no license file, so no rights are granted: read it for ideas only and do not copy its code. |
| `proprietary` | Its license reserves all rights: read it for ideas only and do not copy its code. |
| `other` | Its license is neither MIT nor Apache-2.0; read it before you copy anything: {license_url}. |

The `MIT+rider` sentence uses the charter's own wording (PROJECT_CHARTER.md, Constraints: "a rider that bars OpenAI, Anthropic, their affiliates, those acting for them, and ML training or evaluation use"). It says what the rider bars and nothing about who may use the code otherwise, so it does not imply the rider bars people who use those labs' models. Any change to it needs the maintainer (charter, "Irreversible choices"). `{license_sentence_if_copied}` is the sentence prefixed with "If you copy code from these examples, keep their notice. " and is empty when every exemplar repository is class `MIT`.

## 4. UNK-005 recommendation

UNK-005 ("Per-kind agent-prompt templates or one?") is ASSUME_REVERSIBLY with assumption "one template per result kind". Recommendation: resolve it (proposed DEC-P10) as **one template per kind, with posture variants for the five software kinds** (repo-verdict, stack-verdict, capability, crate; repo-profile folds posture into one sentence), as tabled in §2: 24 templates for 17 kinds.

Why not one template for everything: the kinds ask the agent for different proofs (a planted known-bad for a gate, a benchmark for a performance technique, a falsification experiment for a cross-pollination technique, a back-out plan for a pilot), and one generic template would either drop the proof request or ask for the wrong one. Why variants inside a kind: the posture decides whether an adoption verb is allowed at all (HON-04); keeping that in the template id lets a gate check it without parsing prose.

Falsifier (kept from UNK-005, made measurable): in the S09 golden-set review, the reviewer rates the prompt of each top-3 result "specific and correct", "generic" or "wrong". A template whose sampled prompts are rated generic or wrong at least twice, or in at least 20% of its samples, is rewritten or split, and the template version bumps. Reversal cost: templates are data in the generator; a change regenerates every prompt in one build.

## 5. Quote policy mechanics (DEC-009)

1. **Where quotes may come from.** Only from lines an existing, cited source already points at: an fh catalog exemplar that is `CURRENT` under TIER-MAP TM-FH-1, a crate manifest's `[package]` lines, or a line a packet or stack verdict already cites. No new passages are chosen for quoting. rigor-atlas evidence stays pointer-only in v1 (DEC-003).
2. **Size.** One quote per entry, at most 6 consecutive lines and 480 characters, whole lines, no ellipses and no edits.
3. **Exactness.** The text is the cited lines at the 40-hex commit, byte for byte (trailing newline dropped). The collector or snapshot check stores its sha256; the generator re-hashes the text it emits and fails on a mismatch. A quote whose line changes at a newer pin is dropped, never patched.
4. **Which repositories.** Class `MIT`, `MIT+rider` or `Apache-2.0` only. Never `none`, `proprietary` or `other` (HON-07).
5. **Notice.** `license_notice` = the copyright line from that repository's LICENSE at the commit (for Jeffrey's repositories today, "Copyright (c) 2026 Jeffrey Emanuel"), the license name as its first line gives it, and the LICENSE URL at the commit. For `MIT+rider`, `rider_flag` is true and the card shows the plain flag "MIT with the OpenAI/Anthropic rider" next to the quote, linked to the §3 sentence. This follows the minimum hygiene the intake names: copyright line, link to the exact LICENSE at the pinned commit, and the rider label (intake-IntakeEco2 §5).
6. **Display.** A quote block captioned "{repo}/{path}:{lines} at {commit7}", then the notice. Never inside `prompt.text`, never in the core or deep shard (HON-09).
7. **Crawlers.** The quotes shard ships empty while UNK-008 is `pending` (DEC-P06, HON-15). When the maintainer decides, the shard fills and `robots.txt` follows the decision.
8. **Widening this policy** (longer quotes, quotes in prompts, quotes from unlicensed repositories) is an irreversible choice for the maintainer (charter).
