// watch/freshness/yaml.mjs: a small YAML parser for GitHub Actions workflow files (FR-C.7).
//
// Node has no YAML parser and the watch takes no dependencies, so this reads the subset workflow
// files use: block mappings and sequences by indentation, `- key: value` items, flow sequences and
// mappings (`[a, b]`, `{a: b}`, possibly over several lines), single and double quoted scalars,
// block scalars (`|`, `>`, with chomping and indent indicators), comments, and one leading `---`.
// Scalars stay strings (`true`, `1` and `null` are not converted); only structure matters here.
// It throws where GitHub's loader would reject the file: a tab in indentation, a line in a mapping
// with no `key:`, bad indentation, an unclosed flow collection or quote, a second document.
//
// Node 22 built-ins only.

class YamlError extends Error {}
const fail = (line, msg) => { throw new YamlError(`line ${line}: ${msg}`); };

// Strip a trailing comment: a `#` at the start or after whitespace, outside quotes.
function stripComment(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q && !(q === '"' && s[i - 1] === '\\')) q = null; continue; }
    if (c === '"' || c === "'") { if (i === 0 || /[\s[{,:-]/.test(s[i - 1])) q = c; continue; }
    if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i).trimEnd();
  }
  return s.trimEnd();
}

function lex(text) {
  const raw = String(text).replace(/^\uFEFF/, '').split(/\r?\n/);
  const lines = [];
  let docs = 0;
  let seenContent = false;
  for (let n = 0; n < raw.length; n++) {
    const src = raw[n];
    const lead = src.match(/^[ \t]*/)[0];
    const body = src.slice(lead.length);
    // A `#` line is a comment to the block structure, but inside a block scalar it is content
    // (blockScalar reads `comment`, `indent` and `text`).
    if (body === '') { lines.push({ n: n + 1, blank: true, src }); continue; }
    if (body.startsWith('#')) { lines.push({ n: n + 1, blank: true, comment: true, indent: lead.length, text: body, src }); continue; }
    if (/^(---|\.\.\.)(\s|$)/.test(src)) {
      if (src.startsWith('---')) { docs++; if (docs > 1 || seenContent) fail(n + 1, 'expected a single document'); }
      else if (raw.slice(n + 1).some((l) => l.trim() && !l.trim().startsWith('#'))) fail(n + 1, 'expected a single document');
      lines.push({ n: n + 1, blank: true, src });
      continue;
    }
    if (lead.includes('\t')) fail(n + 1, 'tab in indentation');
    seenContent = true;
    lines.push({ n: n + 1, indent: lead.length, text: body, src });
  }
  return lines;
}

// ---------------------------------------------------------------- scalars and flow collections
function unquote(s, line) {
  if (s.startsWith('"')) {
    if (!/"$/.test(s) || s.length < 2) fail(line, 'unclosed double quote');
    return JSON.parse(s.replace(/\\'/g, "'").replace(/\t/g, '\\t'));
  }
  if (s.startsWith("'")) {
    if (!s.endsWith("'") || s.length < 2) fail(line, 'unclosed single quote');
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}

function parseFlow(s, line) {
  let i = 0;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const scalar = (stops) => {
    ws();
    if (s[i] === '"' || s[i] === "'") {
      const q = s[i];
      let j = i + 1;
      for (; j < s.length; j++) {
        if (q === '"' && s[j] === '\\') { j++; continue; }
        if (s[j] === q) { if (q === "'" && s[j + 1] === "'") { j++; continue; } break; }
      }
      if (j >= s.length) fail(line, 'unclosed quote in flow collection');
      const out = unquote(s.slice(i, j + 1), line);
      i = j + 1;
      return out;
    }
    let j = i;
    while (j < s.length && !stops.includes(s[j]) && !(s[j] === ':' && /\s/.test(s[j + 1] ?? ' ') && stops.includes(','))) j++;
    const out = s.slice(i, j).trim();
    i = j;
    return out;
  };
  const value = () => {
    ws();
    if (s[i] === '[') {
      i++;
      const arr = [];
      for (;;) {
        ws();
        if (s[i] === ']') { i++; return arr; }
        arr.push(value());
        ws();
        if (s[i] === ',') { i++; continue; }
        if (s[i] === ']') { i++; return arr; }
        fail(line, 'unclosed flow sequence');
      }
    }
    if (s[i] === '{') {
      i++;
      const obj = {};
      for (;;) {
        ws();
        if (s[i] === '}') { i++; return obj; }
        const k = scalar([',', '}', ':']);
        ws();
        let v = null;
        if (s[i] === ':') { i++; v = value(); }
        obj[k] = v === '' ? null : v;
        ws();
        if (s[i] === ',') { i++; continue; }
        if (s[i] === '}') { i++; return obj; }
        fail(line, 'unclosed flow mapping');
      }
    }
    return scalar([',', ']', '}']);
  };
  const v = value();
  ws();
  if (i < s.length) fail(line, `unexpected text after flow collection: ${s.slice(i, i + 20)}`);
  return v;
}

const balanced = (s) => {
  let depth = 0;
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\' && q === '"') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
  }
  return depth <= 0 && !q;
};

// Split `key: rest` at the first `:` followed by a space or the end, outside quotes and brackets.
function splitKey(text) {
  let q = null;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === q) q = null; continue; }
    if ((c === '"' || c === "'") && i === 0) { q = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    else if (c === ':' && depth === 0 && (i + 1 === text.length || /\s/.test(text[i + 1]))) return [text.slice(0, i).trim(), text.slice(i + 1).trim()];
  }
  return null;
}

// ---------------------------------------------------------------- block structure
class Parser {
  constructor(lines) { this.lines = lines; this.i = 0; }
  skipBlank() { while (this.i < this.lines.length && this.lines[this.i].blank) this.i++; }
  peek() { this.skipBlank(); return this.lines[this.i] ?? null; }

  node(minIndent) {
    const l = this.peek();
    if (!l || l.indent < minIndent) return null;
    return isItem(l.text) ? this.seq(l.indent) : this.map(l.indent);
  }

  seq(ind) {
    const out = [];
    for (let l = this.peek(); l && l.indent === ind && isItem(l.text); l = this.peek()) {
      const rest = l.text === '-' ? '' : l.text.slice(2);
      const content = rest.trimStart();
      if (content === '') { this.i++; out.push(this.node(ind + 1)); continue; }
      // `- key: value` opens a mapping whose indentation is the column of `key`.
      const col = ind + (l.text.length - content.length);
      if (!isItem(content) && splitKey(stripComment(content)) && !/^["'[{]/.test(content)) {
        this.lines[this.i] = { ...l, indent: col, text: content };
        out.push(this.map(col));
      } else if (isItem(content)) {
        this.lines[this.i] = { ...l, indent: col, text: content };
        out.push(this.seq(col));
      } else {
        this.i++;
        out.push(this.scalar(stripComment(content), ind, l.n));
      }
    }
    const l = this.peek();
    if (l && l.indent > ind) fail(l.n, 'bad indentation of a sequence entry');
    return out;
  }

  map(ind) {
    const out = {};
    for (let l = this.peek(); l && l.indent === ind; l = this.peek()) {
      if (isItem(l.text)) fail(l.n, 'a sequence entry where a mapping key was expected');
      const kv = splitKey(stripComment(l.text));
      if (!kv) fail(l.n, 'while scanning a simple key: could not find expected \':\'');
      const key = unquote(kv[0], l.n);
      this.i++;
      out[key] = this.value(kv[1], ind, l.n);
    }
    const l = this.peek();
    if (l && l.indent > ind) fail(l.n, 'bad indentation of a mapping entry');
    return out;
  }

  value(rest, ind, n) {
    if (rest === '') {
      const next = this.peek();
      if (next && (next.indent > ind || (next.indent === ind && isItem(next.text)))) return this.node(next.indent === ind ? ind : ind + 1);
      return null;
    }
    const block = rest.match(/^([|>])([+-]?)(\d?)([+-]?)\s*(?:#.*)?$/);
    if (block) return this.blockScalar(block[1], block[2] || block[4], ind);
    return this.scalar(rest, ind, n);
  }

  scalar(rest, ind, n) {
    let s = stripComment(rest).replace(/^&\S+\s*/, '');
    if (/^[[{]/.test(s)) {
      while (!balanced(s)) {
        const next = this.lines[this.i];
        if (!next) fail(n, 'unclosed flow collection');
        this.i++;
        if (!next.blank) s += ' ' + stripComment(next.text);
      }
      return parseFlow(s, n);
    }
    if (s.startsWith('"') && (!s.endsWith('"') || s.length === 1 || /[^\\]\\"$/.test(s))) {
      while (this.lines[this.i] && !/(?<!\\)"$/.test(s)) { const next = this.lines[this.i++]; s += ' ' + (next.blank ? '' : next.text.trim()); }
    }
    // A plain scalar may continue on more-indented lines (folded with spaces).
    if (!/^["']/.test(s)) {
      for (let next = this.peek(); next && next.indent > ind && !splitKey(stripComment(next.text)); next = this.peek()) { s += ' ' + stripComment(next.text); this.i++; }
    }
    return unquote(s, n);
  }

  blockScalar(style, chomp, ind) {
    const body = [];
    let bodyIndent = null;
    while (this.i < this.lines.length) {
      const l = this.lines[this.i];
      if (l.blank && !(l.comment && l.indent > ind && l.indent >= (bodyIndent ?? 0))) { body.push(''); this.i++; continue; }
      if (l.indent <= ind) break;
      bodyIndent ??= l.indent;
      if (l.indent < bodyIndent) break;
      body.push(' '.repeat(l.indent - bodyIndent) + l.src.slice(l.src.length - l.text.length));
      this.i++;
    }
    while (body.length && body.at(-1) === '') body.pop();
    const text = style === '|' ? body.join('\n') : body.join(' ').replace(/ {2,}/g, ' ');
    return chomp === '-' ? text : text + '\n';
  }
}
const isItem = (t) => t === '-' || t.startsWith('- ');

export function parseYaml(text) {
  const p = new Parser(lex(text));
  const top = p.peek();
  if (!top) return null;
  if (top.indent !== 0) fail(top.n, 'the document does not start at column 0');
  const doc = p.node(0);
  const left = p.peek();
  if (left) fail(left.n, 'unexpected content after the document');
  return doc;
}
