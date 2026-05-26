# commit-docket

I built `commit-docket` to turn a git commit range into release notes that are useful before a tag is cut. It reads local git history, recognizes Conventional Commit metadata, groups changes, suggests a SemVer bump, and calls out risky change signals such as breaking changes, migrations, auth changes, removals, and configuration edits.

## Why I made this

Release notes often get written late, after the context behind a set of commits has already gone cold. I wanted a small CLI that gives maintainers a clean first pass from the repository itself without sending commit data to an external service.

## Install

```bash
npm install -g commit-docket
```

For local development:

```bash
npm install
npm link
```

## Usage

```bash
commit-docket v0.1.0..HEAD
commit-docket --from v0.1.0 --to main --output RELEASE_NOTES.md
commit-docket --format json
commit-docket --fail-on-breaking
```

When no range is supplied, I use the latest git tag as the start point and `HEAD` as the end point. If the repository has no tags yet, I analyze all commits reachable from `HEAD`.

## Output

The default Markdown output includes:

- highlights from feature, fix, performance, and breaking commits
- grouped changes by commit type
- a suggested SemVer bump
- risk notes with the matching signal
- contributor names from the analyzed commits

JSON output contains the same model for CI systems or release scripts.

## Configuration

I keep configuration optional. Add `.commit-docket.json` when a repository needs custom sections, ignored commit types, or extra risk keywords.

```json
{
  "ignoredTypes": ["style"],
  "riskKeywords": ["tenant", "billing"],
  "sections": [
    { "title": "Product changes", "types": ["feat", "fix"] },
    { "title": "Operations", "types": ["build", "ci", "chore"] }
  ]
}
```

## Development

```bash
npm run lint
npm test
npm run ci
```

I intentionally kept the first release dependency-free so it is easy to audit and quick to run in CI.
