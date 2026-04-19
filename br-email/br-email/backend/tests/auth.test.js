import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256 } from '../src/utils/tokens.js';

test('sha256 gera hash determinístico', () => {
  const a = sha256('abc');
  const b = sha256('abc');
  assert.equal(a, b);
  assert.equal(a.length, 64);
});
