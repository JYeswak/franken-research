# checklist2beads.awk — convert CHECKLIST.md items into beads JSONL.
# Usage: awk -v stamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)" -f checklist2beads.awk docs/CHECKLIST.md
# Each '### A1 — Title' item becomes one open bead: the Done criteria become
# acceptance_criteria, the rest becomes description. Labels encode the
# checklist class (day-1-mechanical / day-1-procedural / maturity / provisional).
# Field names follow the kit's bead schema (templates/bead-schema.md).

function jesc(s,   t) {
  t = s
  gsub(/\\/, "\\\\", t)
  gsub(/"/, "\\\"", t)
  return t
}

function emit(   desc, acc, pri, labs) {
  if (id == "") return
  desc = "What: " what "\\nWhy: " why "\\nOrigin: " origin
  acc = donec " Verified by: " verified
  if (class_ ~ /DAY-1/) pri = 2; else pri = 3
  if (class_ ~ /MECHANICAL/) labs = "\"checklist\",\"day-1\",\"mechanical\""
  else if (class_ ~ /PROCEDURAL/) labs = "\"checklist\",\"day-1\",\"procedural\""
  else if (class_ ~ /MATURITY/) labs = "\"checklist\",\"maturity\""
  else labs = "\"checklist\",\"provisional\""
  printf "{\"id\":\"%s\",\"title\":\"%s\",\"description\":\"%s\",\"acceptance_criteria\":\"%s\",\"status\":\"open\",\"priority\":%d,\"issue_type\":\"task\",\"labels\":[%s],\"dependencies\":[],\"created_by\":\"starter-kit\",\"created_at\":\"%s\",\"closed_at\":\"\",\"close_reason\":\"\",\"source_repo\":\"\"}\n", \
    "kit-" tolower(id), jesc(title), jesc(desc), jesc(acc), pri, labs, stamp
}

function fieldval(   v) {
  v = $0
  sub(/^- \*\*[^*]+:\*\*[ \t]*/, "", v)
  return v
}

/^### [AB][0-9]+ — / {
  emit()
  id = $2
  title = substr($0, index($0, "—") + 4)
  what = why = donec = verified = origin = class_ = ""
  next
}

/^## / {
  emit()
  id = ""
  if ($0 ~ /Phase B/) seenB = 1
  else if (seenB) exit
  next
}

/^- \*\*What:\*\*/          { what = fieldval(); next }
/^- \*\*Why:\*\*/           { why = fieldval(); next }
/^- \*\*Done criteria:\*\*/ { donec = fieldval(); next }
/^- \*\*Verified by:\*\*/   { verified = fieldval(); next }
/^- \*\*Origin:\*\*/        { origin = fieldval(); next }
/^- \*\*Class:\*\*/         { class_ = fieldval(); next }

END { emit() }
