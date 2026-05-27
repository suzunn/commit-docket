import test from 'node:test';
import assert from 'node:assert/strict';

import { parseArgs, runCli } from '../src/cli.js';

test('parseArgs reads range and output options', () => {
  const args = parseArgs([
    'v0.1.0..HEAD',
    '--format',
    'json',
    '--output',
    'release.json',
    '--config',
    '.commit-docket.json',
    '--fail-on-breaking'
  ]);

  assert.equal(args.range, 'v0.1.0..HEAD');
  assert.equal(args.format, 'json');
  assert.equal(args.outputPath, 'release.json');
  assert.equal(args.configPath, '.commit-docket.json');
  assert.equal(args.failOnBreaking, true);
  assert.deepEqual(args.errors, []);
});

test('parseArgs builds a ref range from --from and --to', () => {
  const args = parseArgs(['--from', 'v0.1.0', '--to', 'main']);

  assert.equal(args.from, 'v0.1.0');
  assert.equal(args.to, 'main');
  assert.deepEqual(args.errors, []);
});

test('parseArgs reports missing values and unsupported options', () => {
  const args = parseArgs(['--unknown', '--format', 'xml', '--output']);

  assert.deepEqual(args.errors, [
    'Unknown option --unknown',
    '--format must be either markdown or json',
    '--output requires a value'
  ]);
});

test('runCli returns usage for argument errors before reading git history', async () => {
  const stdout = createWriter();
  const stderr = createWriter();

  const exitCode = await runCli(['--format', 'yaml'], {
    cwd: process.cwd(),
    stdout,
    stderr
  });

  assert.equal(exitCode, 2);
  assert.equal(stdout.text, '');
  assert.match(stderr.text, /Error: --format must be either markdown or json/);
  assert.match(stderr.text, /Usage:/);
});

test('runCli prints help without requiring a git repository', async () => {
  const stdout = createWriter();
  const stderr = createWriter();

  const exitCode = await runCli(['--help'], {
    cwd: process.cwd(),
    stdout,
    stderr
  });

  assert.equal(exitCode, 0);
  assert.match(stdout.text, /commit-docket 0\.1\.0/);
  assert.match(stdout.text, /--fail-on-breaking/);
  assert.equal(stderr.text, '');
});

function createWriter() {
  return {
    text: '',
    write(value) {
      this.text += value;
    }
  };
}
