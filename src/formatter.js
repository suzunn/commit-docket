export function formatMarkdown(model) {
  const lines = [
    '# Release notes',
    '',
    `Range: \`${model.range}\``,
    `Suggested version bump: \`${model.summary.suggestedBump}\``,
    `Commits analyzed: ${model.summary.totalCommits}`,
    ''
  ];

  if (model.summary.totalCommits === 0) {
    lines.push('No commits were found for this range.');
    return lines.join('\n');
  }

  lines.push('## Highlights', '');
  for (const item of model.highlights) {
    lines.push(`- ${formatCommitTitle(item)}`);
  }

  lines.push('', '## Changes', '');
  for (const section of model.sections) {
    if (section.commits.length === 0) {
      continue;
    }

    lines.push(`### ${section.title}`, '');
    for (const commit of section.commits) {
      lines.push(`- ${formatCommitTitle(commit)}`);
    }
    lines.push('');
  }

  if (model.uncategorized.length > 0) {
    lines.push('### Other changes', '');
    for (const commit of model.uncategorized) {
      lines.push(`- ${formatCommitTitle(commit)}`);
    }
    lines.push('');
  }

  lines.push('## Risk notes', '');
  if (model.risks.length === 0) {
    lines.push('- I did not detect risky change signals in this range.');
  } else {
    for (const risk of model.risks) {
      const signals = risk.risk.signals.join(', ');
      lines.push(`- ${risk.shortHash}: ${risk.description} (${risk.risk.level}; ${signals})`);
    }
  }

  lines.push('', '## Contributors', '');
  for (const contributor of model.contributors) {
    lines.push(`- ${contributor}`);
  }

  return trimTrailingBlank(lines).join('\n');
}

export function formatJson(model) {
  return JSON.stringify(model, null, 2);
}

function formatCommitTitle(commit) {
  const scope = commit.scope ? `**${commit.scope}:** ` : '';
  const breaking = commit.breaking ? ' **BREAKING**' : '';
  const refs = commit.references.length > 0 ? ` ${commit.references.join(' ')}` : '';
  return `${scope}${commit.description}${breaking}${refs} (${commit.shortHash})`;
}

function trimTrailingBlank(lines) {
  const copy = [...lines];
  while (copy.at(-1) === '') {
    copy.pop();
  }

  return copy;
}
