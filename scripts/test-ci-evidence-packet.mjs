import test from 'node:test';
import assert from 'node:assert/strict';
import { loadReference } from '../watch/freshness/facts.mjs';
import { buildCiPacket, renderMarkdown } from './ci-evidence-packet.mjs';
const reference = loadReference();
const options = { repo: 'frankengit', point: 'recheck' };
const altered = (change) => { const copy = structuredClone(reference); change(copy); return copy; };
test('real historical source reproduces independently reviewed frankengit CI finding', () => {
  const p = buildCiPacket(reference, options);
  assert.equal(p.baseline.classification.value, 'C3');
  assert.equal(p.target.classification.value, 'C5');
  assert.equal(p.target.classification.rule, 'FR-C.2/C5-no-push-trigger');
  assert.equal(p.baseline.workflow_count, 78);
  assert.equal(p.target.workflow_count, 8);
  assert.equal(p.target.sha, 'dfa5bb861e1f08802c72d33e96796a1aad9d5d06');
  assert.notEqual(p.target.sha, p.source.recorded_head);
  assert.equal(p.target.workflows.filter(w => w.summary.kind === 'test').length, 7);
  assert.equal(p.target.workflows.filter(w => w.triggers_default_from_source).length, 0);
  assert.equal(p.baseline.runs.total, 18);
  assert.equal(p.target.runs.total, 0);
  assert.equal(Object.keys(p.sources).length, 86);
  assert.match(renderMarkdown(p), /not a complete re-check/);
});
test('missing or tampered source is rejected before any finding', () => {
  const oid = reference.records.frankengit.points.recheck.workflows[0].blob;
  assert.throws(() => buildCiPacket(altered(r => delete r.texts[oid]), options), /Missing source blob/);
  assert.throws(() => buildCiPacket(altered(r => r.texts[oid] += '\n'), options), /hash mismatch/);
});
test('missing point and incomplete recorded runs are rejected', () => {
  assert.throws(() => buildCiPacket(reference, { ...options, point: 'absent' }), /Missing or invalid point/);
  assert.throws(() => buildCiPacket(altered(r => r.records.frankengit.points.recheck.runs.complete = false), options), /Incomplete run evidence/);
  assert.throws(() => buildCiPacket(altered(r => r.records.frankengit.points.pin.runs.list.pop()), options), /Incomplete run evidence/);
  assert.throws(() => buildCiPacket(altered(r => delete r.records.frankengit.points.pin.runs.list[0].status), options), /Malformed run evidence/);
});
test('HEAD and later state cannot silently replace historical evidence', () => {
  assert.throws(() => buildCiPacket(reference, { ...options, point: 'now' }), /explicitly recorded historical point/);
  assert.throws(() => buildCiPacket(altered(r => r.records.frankengit.pin = '0'.repeat(40)), options), /does not match/);
  assert.throws(() => buildCiPacket(altered(r => r.records.frankengit.workflow_states = { x: { state: 'disabled_manually', since: '2099-01-01' } }), options), /newer than historical target/);
});
