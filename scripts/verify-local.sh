#!/usr/bin/env bash
# Explicit local validation environment. Both full and reuse execute under it.
# No inherited injected-code variables, credentials, proxy settings or CI flags.
set -euo pipefail
if [[ -n "${CI:-}" ]]; then
  echo 'Local reuse is unavailable in CI; run bun run verify.' >&2
  exit 2
fi
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
: "${CHROME_PATH:?Set CHROME_PATH to the installed browser}"
exec env -i HOME="$HOME" PATH="$PATH" CHROME_PATH="$CHROME_PATH" \
  LANG=C.UTF-8 LC_ALL=C.UTF-8 TZ=UTC \
  "${FR_VERIFY_PYTHON:-python3}" -B "$root/scripts/verify-incremental.py" "$@"
