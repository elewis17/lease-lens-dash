import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAgentStatus } from '../src/lib/agent-status.js';

test('returns canonical statuses unchanged', () => {
  assert.strictEqual(normalizeAgentStatus('queued'), 'queued');
  assert.strictEqual(normalizeAgentStatus('in-progress'), 'in-progress');
  assert.strictEqual(normalizeAgentStatus('blocked'), 'blocked');
  assert.strictEqual(normalizeAgentStatus('ready-for-review'), 'ready-for-review');
});

test('normalizes whitespace and case', () => {
  assert.strictEqual(normalizeAgentStatus('  Queued  '), 'queued');
  assert.strictEqual(normalizeAgentStatus(' In-Progress '), 'in-progress');
  assert.strictEqual(normalizeAgentStatus(' BLOCKED '), 'blocked');
  assert.strictEqual(normalizeAgentStatus('  READY-FOR-REVIEW  '), 'ready-for-review');
});

test('replaces spaces and underscores with hyphen', () => {
  assert.strictEqual(normalizeAgentStatus('in progress'), 'in-progress');
  assert.strictEqual(normalizeAgentStatus('in__progress'), 'in-progress');
  assert.strictEqual(normalizeAgentStatus('ready_for_review'), 'ready-for-review');
  assert.strictEqual(normalizeAgentStatus('Ready   For   Review'), 'ready-for-review');
  assert.strictEqual(normalizeAgentStatus(' READY__FOR___REVIEW '), 'ready-for-review');
});

test('invalid strings and empty input return unknown', () => {
  assert.strictEqual(normalizeAgentStatus('done'), 'unknown');
  assert.strictEqual(normalizeAgentStatus('review'), 'unknown');
  assert.strictEqual(normalizeAgentStatus('inprogress'), 'unknown');
  assert.strictEqual(normalizeAgentStatus(''), 'unknown');
  assert.strictEqual(normalizeAgentStatus('   '), 'unknown');
});

test('non-string inputs return unknown and input is not mutated', () => {
  assert.strictEqual(normalizeAgentStatus(null), 'unknown');
  assert.strictEqual(normalizeAgentStatus(undefined), 'unknown');
  assert.strictEqual(normalizeAgentStatus(0), 'unknown');
  assert.strictEqual(normalizeAgentStatus(123), 'unknown');

  const obj = { status: 'queued' };
  const objSnapshot = { status: 'queued' };
  assert.strictEqual(normalizeAgentStatus(obj), 'unknown');
  assert.deepStrictEqual(obj, objSnapshot);

  const arr = ['queued'];
  const arrSnapshot = ['queued'];
  assert.strictEqual(normalizeAgentStatus(arr), 'unknown');
  assert.deepStrictEqual(arr, arrSnapshot);
});
