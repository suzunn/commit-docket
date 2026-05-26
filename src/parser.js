const conventionalCommitPattern = /^(?<type>[a-zA-Z][a-zA-Z0-9-]*)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<description>.+)$/;

const defaultRiskPatterns = [
  { label: 'breaking change', pattern: /\bbreaking[ -]change\b/i, level: 'high' },
  { label: 'removal', pattern: /\b(remove|removed|delete|deleted|drop|dropped|deprecate|deprecated)\b/i, level: 'medium' },
  { label: 'data model', pattern: /\b(database|schema|migration|migrate|backfill|index)\b/i, level: 'medium' },
  { label: 'security-sensitive', pattern: /\b(auth|permission|token|secret|password|crypto|credential)\b/i, level: 'medium' },
  { label: 'runtime behavior', pattern: /\b(timeout|retry|race|concurrency|parallel|cache|queue)\b/i, level: 'medium' },
  { label: 'configuration', pattern: /\b(config|configuration|environment|env var|feature flag)\b/i, level: 'medium' }
];

export function parseCommit(commit, options = {}) {
  const match = conventionalCommitPattern.exec(commit.subject);
  const parsed = match?.groups ?? {};
  const type = (parsed.type ?? 'other').toLowerCase();
  const description = sentenceCase((parsed.description ?? commit.subject).trim());
  const breaking = Boolean(parsed.breaking) || /\bBREAKING[ -]CHANGE:/i.test(commit.body);
  const references = extractReferences(`${commit.subject}\n${commit.body}`);
  const risk = detectRisk(`${commit.subject}\n${commit.body}`, {
    breaking,
    customKeywords: options.riskKeywords ?? []
  });

  return {
    ...commit,
    type,
    scope: parsed.scope ?? null,
    description,
    breaking,
    references,
    risk
  };
}

export function extractReferences(text) {
  const references = new Set();
  const patterns = [
    /(?<![\w/-])#(?<id>\d+)\b/g,
    /\bGH-(?<id>\d+)\b/gi,
    /\b(?<owner>[a-z0-9_.-]+)\/(?<repo>[a-z0-9_.-]+)#(?<number>\d+)\b/gi
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match.groups.owner) {
        references.add(`${match.groups.owner}/${match.groups.repo}#${match.groups.number}`);
      } else {
        references.add(`#${match.groups.id}`);
      }
    }
  }

  return [...references];
}

export function detectRisk(text, options = {}) {
  const signals = [];
  let level = options.breaking ? 'high' : 'low';

  for (const item of defaultRiskPatterns) {
    if (!item.pattern.test(text)) {
      continue;
    }

    signals.push(item.label);
    level = elevate(level, item.level);
  }

  for (const keyword of options.customKeywords ?? []) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      signals.push(keyword);
      level = elevate(level, 'medium');
    }
  }

  if (options.breaking && !signals.includes('breaking change')) {
    signals.unshift('breaking change');
  }

  return {
    level,
    signals: [...new Set(signals)]
  };
}

function elevate(current, next) {
  const order = ['low', 'medium', 'high'];
  return order.indexOf(next) > order.indexOf(current) ? next : current;
}

function sentenceCase(value) {
  if (value.length === 0) {
    return value;
  }

  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
