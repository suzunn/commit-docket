import test from 'node:test';
import assert from 'node:assert/strict';

import { parseGitLog } from '../src/git.js';

test('parseGitLog converts git records into commit objects', () => {
  const output = [
    '\x1eaaaaaaaa\x1faaaaaaa\x1fAda Lovelace\x1fada@example.com\x1f2026-05-26\x1ffeat(cli): add output\x1fBody line one',
    '\x1ebbbbbbbb\x1fbbbbbbb\x1fGrace Hopper\x1fgrace@example.com\x1f2026-05-27\x1ffix(parser): keep body separators\x1fFirst\x1fSecond'
  ].join('');

  assert.deepEqual(parseGitLog(output), [
    {
      hash: 'aaaaaaaa',
      shortHash: 'aaaaaaa',
      authorName: 'Ada Lovelace',
      authorEmail: 'ada@example.com',
      date: '2026-05-26',
      subject: 'feat(cli): add output',
      body: 'Body line one'
    },
    {
      hash: 'bbbbbbbb',
      shortHash: 'bbbbbbb',
      authorName: 'Grace Hopper',
      authorEmail: 'grace@example.com',
      date: '2026-05-27',
      subject: 'fix(parser): keep body separators',
      body: 'First\x1fSecond'
    }
  ]);
});

test('parseGitLog ignores empty records', () => {
  assert.deepEqual(parseGitLog('\x1e\n\x1e'), []);
});
