import test from 'node:test';
import assert from 'node:assert/strict';

import { formatMarkdown } from '../src/formatter.js';
import { createReleaseModel, inferVersionBump } from '../src/index.js';

const commits = [
  {
    hash: 'aaaaaaaa',
    shortHash: 'aaaaaaa',
    authorName: 'Grace Hopper',
    authorEmail: 'grace@example.com',
    date: '2026-05-26',
    subject: 'feat(cli): add markdown output',
    body: ''
  },
  {
    hash: 'bbbbbbbb',
    shortHash: 'bbbbbbb',
    authorName: 'Grace Hopper',
    authorEmail: 'grace@example.com',
    date: '2026-05-26',
    subject: 'fix(parser): handle GH issue references',
    body: ''
  }
];

test('inferVersionBump suggests minor when features are present', () => {
  const model = createReleaseModel(commits, { range: 'v0.1.0..HEAD' });
  assert.equal(inferVersionBump(model.sections.flatMap((section) => section.commits)), 'minor');
  assert.equal(model.summary.suggestedBump, 'minor');
});

test('formatMarkdown includes highlights and contributors', () => {
  const markdown = formatMarkdown(createReleaseModel(commits, { range: 'v0.1.0..HEAD' }));

  assert.match(markdown, /## Highlights/);
  assert.match(markdown, /Add markdown output/);
  assert.match(markdown, /Grace Hopper/);
});
