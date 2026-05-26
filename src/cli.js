import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { loadConfig } from './config.js';
import { formatJson, formatMarkdown } from './formatter.js';
import { getLatestTag, readCommits } from './git.js';
import { createReleaseModel } from './index.js';

const VERSION = '0.1.0';

export async function runCli(argv, io) {
  const args = parseArgs(argv);

  if (args.help) {
    io.stdout.write(helpText());
    return 0;
  }

  if (args.version) {
    io.stdout.write(`${VERSION}\n`);
    return 0;
  }

  if (args.errors.length > 0) {
    for (const error of args.errors) {
      io.stderr.write(`Error: ${error}\n`);
    }
    io.stderr.write('\n');
    io.stderr.write(helpText());
    return 2;
  }

  const config = await loadConfig(io.cwd, args.configPath);
  const range = await resolveRange(io.cwd, args);
  const commits = await readCommits(range, io.cwd);
  const model = createReleaseModel(commits, {
    range: range || 'all reachable commits',
    config
  });

  const output = args.format === 'json'
    ? `${formatJson(model)}\n`
    : `${formatMarkdown(model)}\n`;

  if (args.outputPath) {
    const destination = path.resolve(io.cwd, args.outputPath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, output, 'utf8');
  } else {
    io.stdout.write(output);
  }

  if (args.failOnBreaking && model.summary.breakingChanges > 0) {
    io.stderr.write('Breaking changes were detected.\n');
    return 1;
  }

  return 0;
}

export function parseArgs(argv) {
  const parsed = {
    range: null,
    from: null,
    to: 'HEAD',
    format: 'markdown',
    outputPath: null,
    configPath: null,
    failOnBreaking: false,
    help: false,
    version: false,
    errors: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--help' || value === '-h') {
      parsed.help = true;
      continue;
    }

    if (value === '--version' || value === '-v') {
      parsed.version = true;
      continue;
    }

    if (value === '--fail-on-breaking') {
      parsed.failOnBreaking = true;
      continue;
    }

    if (value === '--from') {
      parsed.from = takeValue(argv, index, '--from', parsed.errors);
      index += 1;
      continue;
    }

    if (value === '--to') {
      parsed.to = takeValue(argv, index, '--to', parsed.errors);
      index += 1;
      continue;
    }

    if (value === '--format') {
      parsed.format = takeValue(argv, index, '--format', parsed.errors);
      index += 1;
      if (!['markdown', 'json'].includes(parsed.format)) {
        parsed.errors.push('--format must be either markdown or json');
      }
      continue;
    }

    if (value === '--output' || value === '-o') {
      parsed.outputPath = takeValue(argv, index, value, parsed.errors);
      index += 1;
      continue;
    }

    if (value === '--config') {
      parsed.configPath = takeValue(argv, index, '--config', parsed.errors);
      index += 1;
      continue;
    }

    if (value.startsWith('-')) {
      parsed.errors.push(`Unknown option ${value}`);
      continue;
    }

    if (parsed.range) {
      parsed.errors.push(`Unexpected positional argument ${value}`);
      continue;
    }

    parsed.range = value;
  }

  return parsed;
}

async function resolveRange(cwd, args) {
  if (args.range) {
    return args.range;
  }

  if (args.from) {
    return `${args.from}..${args.to}`;
  }

  const latestTag = await getLatestTag(cwd);
  return latestTag ? `${latestTag}..${args.to}` : args.to;
}

function takeValue(argv, index, optionName, errors) {
  const value = argv[index + 1];
  if (!value || value.startsWith('-')) {
    errors.push(`${optionName} requires a value`);
    return null;
  }

  return value;
}

function helpText() {
  return `commit-docket ${VERSION}

I generate release notes from a git commit range.

Usage:
  commit-docket [range] [options]

Examples:
  commit-docket v0.1.0..HEAD
  commit-docket --from v0.1.0 --to main --output RELEASE_NOTES.md
  commit-docket --format json

Options:
  --from <ref>             Start ref when no positional range is supplied
  --to <ref>               End ref, defaults to HEAD
  --format <markdown|json> Output format, defaults to markdown
  -o, --output <file>      Write output to a file
  --config <file>          Read a JSON config file
  --fail-on-breaking       Exit 1 when breaking changes are detected
  -v, --version            Print the version
  -h, --help               Print this help text
`;
}
