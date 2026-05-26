import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultSections, normalizeConfig } from '../src/config.js';

test('normalizeConfig trims empty list entries and keeps custom sections', () => {
  const config = normalizeConfig({
    ignoredTypes: [' style ', '', 'docs'],
    riskKeywords: [' tenant ', ''],
    sections: [
      { title: ' Product ', types: [' feat ', 'fix', ''] }
    ]
  });

  assert.deepEqual(config.ignoredTypes, ['style', 'docs']);
  assert.deepEqual(config.riskKeywords, ['tenant']);
  assert.deepEqual(config.sections, [
    { title: 'Product', types: ['feat', 'fix'] }
  ]);
});

test('normalizeConfig uses default sections when sections are omitted', () => {
  const config = normalizeConfig({});

  assert.deepEqual(config.sections, defaultSections);
});

test('normalizeConfig rejects invalid section shapes with useful messages', () => {
  assert.throws(
    () => normalizeConfig({ sections: [{ title: 'Broken', types: 'feat' }] }),
    /sections\[0\]\.types must be an array of strings/
  );
});
