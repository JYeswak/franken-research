# Security

## Scope

This policy covers two things this repository runs:

- The static site at https://fr.zeststream.ai, built from `site/`. It has no server code, no accounts, and no forms; it is HTML, CSS, and JavaScript served as files.
- The GitHub Actions workflows in `.github/workflows/`. `watch.yml` runs daily with a `GITHUB_TOKEN` that can write repository contents and issues: it reads the GitHub API, opens or comments on `[watch]` issues, and commits `watch/`. `verify.yml` runs the gate chain on pushes and pull requests.

Examples of what to report: script injection or a malicious-content path in the site, a way to make the watch workflow write outside `watch/`, open issues with attacker-controlled content, leak its token, or commit something the gate chain did not check.

Out of scope: vulnerabilities in the 44 assessed repositories. Report those to their maintainers. A packet that describes a security property wrongly is a correction; use the Correction issue form.

## How to report

Report privately through GitHub: https://github.com/JYeswak/franken-research/security/advisories/new

Please do not open a public issue for a security problem. Include the file or page, what an attacker could do, and steps to reproduce. You will get a reply on the advisory. If the report is accepted, the fix and a credit (unless you ask not to be named) go in [CHANGELOG.md](CHANGELOG.md).

## Supported versions

Only the current `main` branch and the live site are supported.
