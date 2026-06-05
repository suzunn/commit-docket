import { defaultSections } from './config.js';
import { parseCommit } from './parser.js';

/**
 * Build the release-note data model from raw git commits.
 *
 * The model keeps the original commit metadata, adds Conventional Commit
 * parsing, groups commits into configured sections, and summarizes the
 * release risk signals used by the Markdown and JSON formatters.
 *
 * @param {Array<object>} commits Raw commit objects returned by the git reader.
 * @param {object} [options] Optional range and normalized config values.
 * @returns {object} Release summary, sections, risks, highlights, and contributors.
 */
export function createReleaseModel(commits, options = {}) {
  const config = options.config ?? {};
  const ignoredTypes = new Set(config.ignoredTypes ?? []);
  const sectionsConfig = config.sections?.length > 0 ? config.sections : defaultSections;
  const parsed = commits
    .map((commit) => parseCommit(commit, { riskKeywords: config.riskKeywords ?? [] }))
    .filter((commit) => !ignoredTypes.has(commit.type));

  const sections = buildSections(parsed, sectionsConfig);
  const categorizedHashes = new Set(
    sections.flatMap((section) => section.commits.map((commit) => commit.hash))
  );

  const uncategorized = parsed.filter((commit) => !categorizedHashes.has(commit.hash));

  return {
    range: options.range ?? 'unspecified',
    summary: {
      totalCommits: parsed.length,
      breakingChanges: parsed.filter((commit) => commit.breaking).length,
      suggestedBump: inferVersionBump(parsed)
    },
    highlights: pickHighlights(parsed),
    sections,
    uncategorized,
    risks: parsed.filter((commit) => commit.risk.level !== 'low'),
    contributors: uniqueContributors(parsed)
  };
}

/**
 * Infer the smallest SemVer bump that covers the parsed commit list.
 *
 * Breaking changes take precedence over feature and patch-level commits.
 *
 * @param {Array<object>} commits Parsed commit objects.
 * @returns {'major'|'minor'|'patch'|'none'} Suggested version bump.
 */
export function inferVersionBump(commits) {
  if (commits.some((commit) => commit.breaking)) {
    return 'major';
  }

  if (commits.some((commit) => commit.type === 'feat')) {
    return 'minor';
  }

  if (commits.some((commit) => ['fix', 'perf'].includes(commit.type))) {
    return 'patch';
  }

  return 'none';
}

function buildSections(commits, sectionsConfig) {
  return sectionsConfig.map((section) => {
    const types = new Set(section.types);
    return {
      title: section.title,
      types: section.types,
      commits: commits.filter((commit) => types.has(commit.type))
    };
  });
}

function pickHighlights(commits) {
  const preferred = commits.filter((commit) => commit.breaking || ['feat', 'fix', 'perf'].includes(commit.type));
  const source = preferred.length > 0 ? preferred : commits;
  return source.slice(0, 5);
}

function uniqueContributors(commits) {
  const names = new Set();
  for (const commit of commits) {
    const name = commit.authorName || commit.authorEmail || 'Unknown contributor';
    names.add(name);
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}
