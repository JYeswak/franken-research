// The citation check of TIER-MAP.md §4.1 (and IF-SOURCES.md §4.2 step 4, §4.3 step 4): classify one cited
// quote against the text of its file at the pinned commit, and normalize the raw state onto the TIER-MAP
// rules. Node standard library only. Ported from the scratch checker used for reviews 5 to 5c; this module
// is now the one copy, used by search/tools/quote-check.mjs.
//
// Raw states: CURRENT (quote, whitespace-collapsed, inside the cited line range), RELOCATED (elsewhere in the
// file; `occurrences` counts the places and `foundAt` lists their line ranges), STALE (not in the file),
// NO_REVISION (revision or path not readable), EMPTY_QUOTE (empty or whitespace-only quote; decided before any
// substring test, because '' is a substring of every text).

export const RAW_STATES = ['CURRENT', 'RELOCATED', 'STALE', 'NO_REVISION', 'EMPTY_QUOTE'];
const FH_STATES = ['PINNED_UNVERIFIED', 'CANNOT_DETERMINE']; // fh's own verifier vocabulary (N6, N9)
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const count = (hay, needle) => hay.split(needle).length - 1; // non-overlapping, as Python's str.count

/** -> {raw, occurrences, foundAt}; text is null when the file could not be read at the revision. */
export function classify(text, lineStart, lineEnd, quote) {
  const q = norm(quote ?? '');
  if (!q) return { raw: 'EMPTY_QUOTE', occurrences: 0, foundAt: [] };
  if (text == null) return { raw: 'NO_REVISION', occurrences: 0, foundAt: [] };
  const lines = text.split('\n');
  if (norm(lines.slice(lineStart - 1, lineEnd).join(' ')).includes(q)) return { raw: 'CURRENT', occurrences: 1, foundAt: [`${lineStart}-${lineEnd}`] };
  const occurrences = count(norm(text), q);
  if (!occurrences) return { raw: 'STALE', occurrences: 0, foundAt: [] };
  const span = Math.max(1, lineEnd - lineStart + 1) + 4;
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    for (let n = 1; n <= span && i + n <= lines.length; n++) {
      if (norm(lines.slice(i, i + n).join(' ')).includes(q)) {
        // tight: the window without its first line no longer holds the quote
        if (n === 1 || !norm(lines.slice(i + 1, i + n).join(' ')).includes(q)) found.push([i + 1, i + n]);
        break;
      }
    }
  }
  const tight = [];
  for (const [a, b] of found) if (!tight.some(([ta, tb]) => ta >= a && tb <= b)) tight.push([a, b]);
  return { raw: 'RELOCATED', occurrences: Math.max(occurrences, tight.length), foundAt: tight.map(([a, b]) => `${a}-${b}`) };
}

/** TIER-MAP.md §4.1, first match wins -> {normalized, rule}. An unknown raw state throws (principle 4). */
export function normalize(raw, { occurrences = null, quoteEmpty = false, lineRelocated = false } = {}) {
  if (!RAW_STATES.includes(raw) && !FH_STATES.includes(raw)) {
    throw new Error(`FAIL Q3.HON-11.FH_STATE_UNMAPPED detector=tm_unmapped_label raw=${JSON.stringify(raw)}`);
  }
  if (quoteEmpty || raw === 'EMPTY_QUOTE') return { normalized: 'PINNED_UNVERIFIED', rule: 'TM-FH-3' }; // N1
  if (raw === 'CURRENT') return lineRelocated ? { normalized: 'CURRENT+line_relocated', rule: 'TM-FH-2' } : { normalized: 'CURRENT', rule: 'TM-FH-1' }; // N3, N2
  if (raw === 'RELOCATED') return occurrences === 1 ? { normalized: 'CURRENT+line_relocated', rule: 'TM-FH-2' } : { normalized: 'CANNOT_DETERMINE', rule: 'TM-FH-5' }; // N4, N5
  if (raw === 'PINNED_UNVERIFIED') return { normalized: 'PINNED_UNVERIFIED', rule: 'TM-FH-3' }; // N6
  if (raw === 'STALE') return { normalized: 'STALE', rule: 'TM-FH-4' }; // N7
  return { normalized: 'CANNOT_DETERMINE', rule: 'TM-FH-5' }; // N8 NO_REVISION, N9 CANNOT_DETERMINE
}

/** Normalized states that establish "the cited text is at the pin" (TM-FH-1/2, and TM-RA-1). */
export const PRESENT = new Set(['CURRENT', 'CURRENT+line_relocated']);
