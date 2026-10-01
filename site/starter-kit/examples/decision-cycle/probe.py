#!/usr/bin/env python3
"""A deliberately narrow local experiment, not a product benchmark."""
import json
from pathlib import Path
import sys

settings = json.loads(Path("settings.json").read_text())
if settings.get("format_version") != 1:
    print("Unsupported format_version; this probe requires version 1.", file=sys.stderr)
    sys.exit(1)
print("Accepted this local settings file with format_version 1.")
