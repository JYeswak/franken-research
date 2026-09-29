# Bounded alphaXiv full-text acquisition trial — before execution

2026-09-29 UTC. Decision: can an existing OpenResearch capability provide immediately useful research input without installing another orchestrator?

Primary user metric remains accepted useful outcomes per total human hour. Baseline and total human review time are unknown; this trial cannot establish a speedup.

Operational screen: request the version-pinned full-text endpoint exposed by OpenResearch for two papers already relevant to FR (AgentRxiv 2503.18102v1; GEPA 2507.19457v2), and a deliberately nonexistent id 0000.00000v1. Record status, transferred bytes, content type, SHA-256 and elapsed request time; stop after 30 seconds per request. Accept acquisition only if the returned document contains the intended title and substantive sections, not an HTML error or a generated overview. Compare at least one decision-critical passage with the primary arXiv source. Invalid id must fail rather than silently supplying unrelated content. No semantic entailment or model-quality conclusion follows from transport success.

If successful, combine only the existing URL retrieval procedure with current agent + FR; do not install OpenResearch. If unsuccessful, record actual access limitation and retain current web/paper retrieval. Do not fetch arbitrary alternative tools to rescue the screen.

## Offline source-execution screen, declared before execution

The literature requests all failed with HTTP 403; attribution to alphaXiv versus environment is unresolved. Test the experiment mechanism next without installing dependencies. Extract the actual `snapshot_script` shell template at the pinned commit and execute it on a temporary repository: (1) committed simple research evaluator succeeds and ignores an uncommitted worktree edit; (2) same recorded revision archived after a local `$GIT_DIR/info/attributes` export-ignore change omits its required committed input and fails. Record actual outputs and archive digests. This tests its underlying git/tar/shell execution recipe, not compiled Rust `orx`, SQLite, supervision or providers. Failure to reproduce an ordinary evaluator is a rejection; success plus attribute counterexample limits the promise to the recorded archive, not commit SHA alone. Use no provider and no production files.
