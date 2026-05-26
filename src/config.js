import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const defaultSections = [
  { title: 'Features', types: ['feat'] },
  { title: 'Fixes', types: ['fix'] },
  { title: 'Performance', types: ['perf'] },
  { title: 'Refactoring', types: ['refactor'] },
  { title: 'Documentation', types: ['docs'] },
  { title: 'Tests', types: ['test'] },
  { title: 'Build and CI', types: ['build', 'ci'] },
  { title: 'Maintenance', types: ['chore', 'deps', 'revert'] }
];

export async function loadConfig(cwd, configPath) {
  const candidates = configPath
    ? [path.resolve(cwd, configPath)]
    : [path.join(cwd, '.commit-docket.json')];

  for (const candidate of candidates) {
    const contents = await readJsonIfPresent(candidate);
    if (!contents) {
      continue;
    }

    return normalizeConfig(contents, candidate);
  }

  return normalizeConfig({}, null);
}

export function normalizeConfig(config, sourcePath = null) {
  if (config === null || Array.isArray(config) || typeof config !== 'object') {
    throw new Error(`Invalid config${sourcePath ? ` in ${sourcePath}` : ''}: expected an object`);
  }

  return {
    ignoredTypes: normalizeStringList(config.ignoredTypes, 'ignoredTypes'),
    riskKeywords: normalizeStringList(config.riskKeywords, 'riskKeywords'),
    sections: normalizeSections(config.sections)
  };
}

async function readJsonIfPresent(filePath) {
  try {
    const contents = await readFile(filePath, 'utf8');
    return JSON.parse(contents);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
    }

    throw error;
  }
}

function normalizeSections(sections) {
  if (sections === undefined) {
    return defaultSections;
  }

  if (!Array.isArray(sections)) {
    throw new Error('Invalid config: sections must be an array');
  }

  return sections.map((section, index) => {
    if (!section || typeof section !== 'object') {
      throw new Error(`Invalid config: sections[${index}] must be an object`);
    }

    if (typeof section.title !== 'string' || section.title.trim() === '') {
      throw new Error(`Invalid config: sections[${index}].title must be a non-empty string`);
    }

    return {
      title: section.title.trim(),
      types: normalizeStringList(section.types, `sections[${index}].types`)
    };
  });
}

function normalizeStringList(value, label) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Invalid config: ${label} must be an array of strings`);
  }

  return value.map((item) => item.trim()).filter(Boolean);
}
