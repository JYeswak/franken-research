# Packet regeneration report — 2026-10-03

Bead fr-1pq (acceptance: regenerating 3 sampled packets from pins reproduces
identical hashes or produces an explained diff report; receipts committed
alongside packets; regeneration command documented in
`docs/packet-receipts.md`).

Sample chosen to cover all three header generations in the corpus: the
Rulebook-header style (asupersync), the brief style with a `Pinned revision`
table (frankenfs), and the `Pin:` style (frankensim).

Commands run (repo root, worktree at origin/main):

```bash
python3 scripts/packet-receipts.py emit
python3 scripts/packet-receipts.py emit        # second run: receipts unchanged
python3 scripts/packet-receipts.py verify --only asupersync --only frankenfs --only frankensim
python3 scripts/packet-receipts.py verify      # full corpus
python3 scripts/test_packet_receipts.py
```

Results:

- `emit` twice over all 44 packets: sha256 of every receipt identical across
  runs (`shasum -a 256 packets/*.receipt.json` diffed empty) — regeneration
  from the same pins is byte-for-byte deterministic.
- Sample verify: 3/3 IDENTICAL (table below).
- Full-corpus verify: 44/44 IDENTICAL, 0 drifted/missing. Every packet's pin,
  assessment date, and claim set extracted non-null.
- Tamper demo (one character edited in frankensim's hook, then restored):
  verify exited 1 with DRIFT and an explained diff naming the changed
  `packet_sha256` and the single changed line vs the committed baseline.
- Unit tests: 6/6 pass (`scripts/test_packet_receipts.py`), covering all three
  header styles, claim-set whitespace stability, deterministic rendering,
  tamper detection, and missing-receipt failure.

| Packet | Pinned commit | Packet sha256 | Claims | Verdict |
|---|---|---|---|---|
| asupersync-assessment.md | `768595203e194573bb713158b5963f55861dfe2d` | `c49b51a333d89b5ea778e21e46a85d1c0b0cd64354e584db7a3f0ad0c0bc56cd` | 24 | IDENTICAL |
| frankenfs-assessment.md | `49acf5d5a9b7d48d7d459e28bb5a32e8546900b6` | `018ef6d99a383de053d916390a495cb4f5de55e6618683bfe8621213d173dad7` | 14 | IDENTICAL |
| frankensim-assessment.md | `4b004dcd3efa502ef5de84cf2ed118ccdeafde02` | `b97b6bf20832e3099e0871e4f8a44e4bcbdb72dcc3b549608e230ff99de5df38` | 16 | IDENTICAL |
