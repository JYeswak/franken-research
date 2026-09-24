#!/usr/bin/env node
// triage-ack.mjs: the acknowledgement comment .github/workflows/triage.yml posts on a new
// reader issue. Pure text in, text out; the workflow does the GitHub calls with `gh`.
//
//   node .github/scripts/triage-ack.mjs --event "$GITHUB_EVENT_PATH"   body for that issue, or nothing
//   node .github/scripts/triage-ack.mjs --render <label>               body for one label
//
// An issue gets a body only if it carries one of the reader labels below and neither `watch`
// nor `discovery` (the daily watch's issues and the weekly discovery rollup are machine-filed
// and carry their own checklist). Blank issues with no label get nothing. When an issue carries
// more than one reader label, the first one in LABELS order decides the text. MARKER is how the
// workflow finds an ack it already posted.
import { readFileSync } from 'node:fs';

export const MARKER = '<!-- triage-ack -->';
const REPO = `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY || 'JYeswak/franken-research'}`;
const blob = (p) => `${REPO}/blob/main/${p}`;
const PIPELINE = `[docs/PIPELINE.md](${blob('docs/PIPELINE.md')})`;
const CHANGELOG = `[CHANGELOG.md](${blob('CHANGELOG.md')})`;
const REVIEW = 'An analyst agent reads it first and the maintainer, a human, decides; any change to a verdict also gets an independent review by a separate agent session before it lands.';

const LABELS = {
  correction: [
    'Thanks for the correction.',
    REVIEW,
    `Verdicts are frozen at the pinned commit, so the outcome is one of: a fix, if the packet misread that commit; a dated re-check beside the packet, if the evidence is from a later commit (see [RULEBOOK.md](${blob('RULEBOOK.md')}) and [updates/METHOD.md](${blob('updates/METHOD.md')})); or a close with the reason written here.`,
    `Accepted corrections are credited to you in ${CHANGELOG}, and the whole loop is in ${PIPELINE}.`,
  ],
  'new-evidence': [
    'Thanks for the new evidence.',
    REVIEW,
    `If it could move a cell in the matrix, the outcome is a dated re-check under [updates/](${blob('updates/METHOD.md')}) pinned to the new commit; if it shows a page is wrong, a fix; if neither, a close with the reason written here.`,
    `Accepted evidence is credited to you in ${CHANGELOG}, and the whole loop is in ${PIPELINE}.`,
  ],
  candidate: [
    'Thanks for suggesting a project.',
    'An analyst agent checks it against the fit the issue form describes and the maintainer, a human, decides; a new assessment is written by one agent session and reviewed by a separate one before it lands.',
    'The outcome is either a new assessment, pinned to one commit and published with its own brief, or a close with the reason written here.',
    `Accepted suggestions are credited to you in ${CHANGELOG}, and the whole loop is in ${PIPELINE}.`,
  ],
  site: [
    'Thanks for the site report.',
    'An analyst agent reproduces it and the maintainer, a human, reviews the fix; a site fix changes no verdict, and if one would, a separate agent session reviews it first.',
    'The outcome is a fix that goes live automatically once the gate chain passes on `main`, or a close with the reason written here.',
    `Accepted reports are credited to you in ${CHANGELOG}, and the whole loop is in ${PIPELINE}.`,
  ],
  idea: [
    'Thanks for the idea.',
    REVIEW,
    'The outcome is a change to the site, method, or starter kit, a dated re-check or new assessment if the idea calls for one, or a close with the reason written here.',
    `Accepted ideas are credited to you in ${CHANGELOG}, and the whole loop is in ${PIPELINE}.`,
  ],
};

export function render(label) {
  const lines = LABELS[label];
  if (!lines) throw new Error(`no acknowledgement for label ${JSON.stringify(label)}`);
  return `${MARKER}\n${lines.join(' ')}\n`;
}

// The label that decides the text, or null when the issue gets no acknowledgement.
export function pick(labelNames) {
  if (labelNames.includes('watch') || labelNames.includes('discovery')) return null;
  return Object.keys(LABELS).find((l) => labelNames.includes(l)) ?? null;
}

const [flag, arg] = process.argv.slice(2);
if (flag === '--render' && arg) {
  process.stdout.write(render(arg));
} else if (flag === '--event' && arg) {
  const ev = JSON.parse(readFileSync(arg, 'utf8'));
  const label = pick((ev.issue?.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name)));
  if (label) process.stdout.write(render(label));
} else {
  console.error('usage: triage-ack.mjs --event <event.json> | --render <label>');
  process.exit(2);
}
