// Artifact JSON: human-readable (indent 1) except the raw per-sample arrays, which are written on
// one line so 23k-sample files stay small in git. Parsing the output gives back the same object.
export function artifactJSON(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || !('raw_ms_by_run' in obj)) return JSON.stringify(obj, null, 1) + '\n';
  const { raw_ms_by_run: raw, ...rest } = obj;
  const head = JSON.stringify(rest, null, 1);
  return head.slice(0, -2) + ',\n "raw_ms_by_run": ' + JSON.stringify(raw) + '\n}\n';
}
