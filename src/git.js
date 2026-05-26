import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const fieldSeparator = '\x1f';
const recordSeparator = '\x1e';

export async function getLatestTag(cwd) {
  try {
    const { stdout } = await runGit(['describe', '--tags', '--abbrev=0'], cwd);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function readCommits(range, cwd) {
  const pretty = `%x1e%H%x1f%h%x1f%an%x1f%ae%x1f%ad%x1f%s%x1f%b`;
  const args = ['log', '--date=short', `--format=${pretty}`];

  if (range) {
    args.push(range);
  }

  const { stdout } = await runGit(args, cwd);
  return parseGitLog(stdout);
}

export function parseGitLog(output) {
  return output
    .split(recordSeparator)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, shortHash, authorName, authorEmail, date, subject, ...bodyParts] = record.split(fieldSeparator);
      return {
        hash,
        shortHash,
        authorName,
        authorEmail,
        date,
        subject,
        body: bodyParts.join(fieldSeparator).trim()
      };
    });
}

async function runGit(args, cwd) {
  return execFileAsync('git', args, {
    cwd,
    maxBuffer: 1024 * 1024 * 20
  });
}
