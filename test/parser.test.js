import test from 'node:test';
import assert from 'node:assert/strict';

import { extractReferences, parseCommit } from '../src/parser.js';

test('parseCommit reads Conventional Commit metadata', () => {
  const commit = parseCommit({
    hash: '123456789',
    shortHash: '1234567',
    authorName: 'Ada Lovelace',
    authorEmail: 'ada@example.com',
    date: '2026-05-26',
    subject: 'feat(cli)!: add release risk summary #42',
    body: 'BREAKING CHANGE: output now includes a risk block.'
  });

  assert.equal(commit.type, 'feat');
  assert.equal(commit.scope, 'cli');
  assert.equal(commit.breaking, true);
  assert.deepEqual(commit.references, ['#42']);
  assert.equal(commit.risk.level, 'high');
});

test('extractReferences deduplicates supported issue references', () => {
  assert.deepEqual(
    extractReferences('Fixes #12, GH-12 and openai/example#99.'),
    ['#12', 'openai/example#99']
  );
});
