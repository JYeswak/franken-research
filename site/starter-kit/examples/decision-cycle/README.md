# Run a local decision lifecycle

Requires Python 3.9+ and the shell utilities used by the kit installer. No network,
API key, paid model, Git repository or original FR checkout is required. From an
unpacked starter kit (choose a destination that does not exist):

```sh
python3 examples/decision-cycle/run.py /tmp/fr-decision-example
```

The runner installs the kit into the new directory with `KIT_NO_GIT=1`, executes
`python3 probe.py` against a local version-1 JSON file, and saves its actual
command, timestamps, exit status and output in `probe-receipt.json`. It constructs
a decision scoped only to that result and checks it with the installed tools.
It then changes the JSON to version 2, executes the failing probe, verifies stale
support is rejected, and runs `--refresh` to demote the claim to `review_required`.
`cycle-results.json` contains the actual outcomes of each lifecycle command.

Finally it exports public evidence, changed settings, the probe, and both installed
Python tools to `public-transfer/`. Move that directory to another location and run:

```sh
cd /path/to/public-transfer
python3 scripts/check-decisions.py decisions.json --root .
python3 scripts/review-decisions.py decisions.json --root . --json
```

Both exit zero: identities and labels are consistent **while review remains
outstanding**. The unchanged historical receipt refers to the old input hash;
the changed settings remain an explicit review cause. The authored `adopt`
disposition is historical and does not authorize continued use. Running
`python3 probe.py` in the transfer still fails with the version-2 settings.
Nothing silently updates the receipt or promotes the claim.

An existing destination is rejected, including an empty directory or symlink.
On a mid-run failure the new partial directory remains for inspection; retry with
a different destination. This runner only demonstrates the decision mechanics on
a deliberately simple local fixture. It is not a real research finding, a learning
benchmark, evidence of daily research execution, or a claim of multiplied value.
The checker validates declared hashes and structure; it cannot establish receipt
authenticity or semantic truth. Export is neither a privacy nor a license review;
all example content is deliberately authored for public transfer.
