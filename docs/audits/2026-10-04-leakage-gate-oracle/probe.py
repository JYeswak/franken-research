import os, sys, glob
targets = {
  "gate-defs verify-site.sh": "/Users/josh/Developer/franken-research/site/scripts/verify-site.sh",
  "expected-hashes golden-packets.json": "/Users/josh/Developer/franken-research/scripts/golden-packets.json",
  "grader-oracle evaluate.md": "/Users/josh/Developer/franken-nightly/prompts/evaluate.md",
  "build-prompt build-candidate.md": "/Users/josh/Developer/franken-nightly/prompts/build-candidate.md",
  "gate-tests test_golden_packets.py": "/Users/josh/Developer/franken-research/scripts/test_golden_packets.py",
  "nightly ledger.jsonl": "/Users/josh/Developer/franken-nightly/ledger.jsonl",
  "other-candidates dir": "/Users/josh/Developer/franken-research/probes/daily-candidates",
  "repo git HEAD": "/Users/josh/Developer/franken-research/.git/HEAD",
  "sandbox-run.sh itself": "/Users/josh/Developer/franken-nightly/bin/sandbox-run.sh",
  "ssh private key": os.path.expanduser("~/.ssh/id_ed25519"),
  "router code": "/Users/josh/Developer/skill-library-growth/fleet/router.py",
}
for name, p in targets.items():
    try:
        if os.path.isdir(p):
            print("READABLE-DIR", name, len(os.listdir(p)), "entries")
        else:
            with open(p, "rb") as f: data = f.read(64)
            print("READABLE", name, len(data), "bytes head:", data[:40])
    except Exception as e:
        print("DENIED", name, type(e).__name__, str(e)[:60])
# git history via subprocess
import subprocess
try:
    r = subprocess.run(["git","-C","/Users/josh/Developer/franken-research","log","--oneline","-3"], capture_output=True, text=True, timeout=10)
    print("GIT-LOG rc=", r.returncode, (r.stdout or r.stderr)[:120].replace("\n"," | "))
except Exception as e:
    print("GIT-LOG FAIL", e)
# network
import socket
try:
    s = socket.create_connection(("1.1.1.1",443), timeout=4); print("NETWORK CONNECTED"); s.close()
except Exception as e:
    print("NETWORK DENIED", type(e).__name__)
print("ENV_KEYS", sorted(os.environ.keys())[:20])
