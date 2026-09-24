## What this changes

<!-- One or two sentences. Link the issue if there is one: "Fixes #12". -->

## Checklist

- [ ] Evidence files are untouched: `packets/`, `synthesis/`, `RULEBOOK.md`, and their copies under `site/`. Changes to them go through a correction issue first (see CONTRIBUTING.md).
- [ ] The commit subject ends with its verification level: `[test]`, `[selftest]`, `[mutation]`, `[live]`, or `[pending]`.
- [ ] `bun run verify` output is pasted below, and every gate passes. No gate was weakened, skipped, or narrowed.
- [ ] If this changes a verdict, a number, or a matrix cell: say who reviewed it independently (a separate agent session or a person who did not write the change) and link their review.

## `bun run verify` output

```
paste here
```
