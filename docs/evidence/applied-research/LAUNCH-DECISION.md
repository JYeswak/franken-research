# Applied decision: repeatable local launch

Both paired BLAKE3 metrics passed 100x, but a fresh agent command refused reuse
because inherited environment settings changed. A benchmark-parent-only gain is
not sufficient operational evidence.

Apply a small shell entry point that executes BOTH full setup and reuse under
the same explicit minimal environment. Do not ignore a mismatched fingerprint.
Refuse this entry point in CI. Retest paired timings under this environment,
then invoke from a different shell command to prove actual reuse works there.
The optimization remains local validation, not improved research truth.

The first stable-environment setup failed W3: the hand-written minimal PATH
omitted the installed Node runtime. Restore the caller's actual tool PATH while
keeping other environment inputs explicit. A missing runtime is a failed setup,
not a performance result. The active Python executable is also bound by bytes.
