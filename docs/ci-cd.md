# CI/CD System

Automated workflows for testing and releases. Cloudflare handles deployments natively.

## How it works

```
push to main  →  Cloudflare deploys automatically (continuous)
push a tag    →  GitHub Actions creates a GitHub release
/release skill →  generates changelog, bumps version, commits, tags, pushes
```

## Quick Start

**For Contributors:**
```bash
# Before pushing
npm run lint && npm run test:run && npm run test:configs
```

**For Creating a Release (use Claude Code):**
```
/release
```
The skill will:
1. Analyse what changed since the last tag
2. Suggest a version bump (patch/minor/major) with reasoning
3. Generate the changelog entry
4. Bump `package.json`, commit, tag, and push
5. GitHub Actions creates the GitHub release automatically

## Workflows

### PR Validation (`pr.yml`)
**Triggers:** All pull requests
**Jobs:** ESLint, TypeScript check, Vitest unit tests, config tests, build validation

### Release (`release.yml`)
**Triggers:** Tag push matching `v*.*.*`
**Jobs:** Create GitHub release with formatted notes from `src/data/changelog/<version>.json`

Note: The release.yml no longer runs tests or bumps versions — both are handled before the tag is pushed (tests by `pr.yml` on the PR, versioning by the `/release` skill).

### Agent Workflows
- `claude.yml` — Claude Code GitHub integration (PR comments, issue automation)
- `claude-code-review.yml` — Automated code review on PRs
- `agent-product-manager.yml` — Scheduled PM agent
- `agent-architect.yml` — Scheduled architect/refactor agent

## Workflow Files

| File | Purpose | Trigger |
|------|---------|---------|
| `pr.yml` | PR validation (lint, tests, build) | All pull requests |
| `release.yml` | GitHub release creation | Tag push (`v*.*.*`) |
| `claude.yml` | Claude Code GitHub integration | PR/issue events |
| `claude-code-review.yml` | Automated code review | PR events |

## Changelog

The user-facing changelog lives at `/changelog` in the app and is driven by static JSON files:

```
src/data/changelog/
  index.ts          ← imports all versions in order
  0.2.11.json       ← one file per release
  0.2.10.json
  ...
```

The `/release` skill generates the JSON entry automatically. To manually add or edit a changelog entry without releasing, use `/changelog-entry`.

**Schema:** `src/types/changelog.ts`

## Troubleshooting

**Tag push triggers no GitHub release**
- Confirm the tag matches `v*.*.*` (e.g. `v0.2.12`)
- Check the Actions tab for the `Release` workflow run
- Verify `GITHUB_TOKEN` permissions (contents: write is set in `release.yml`)

**Release notes show "See commit history for changes"**
- The `src/data/changelog/<version>.json` file is missing for that version
- Add it manually or run `/changelog-entry` to generate it

**Cloudflare not deploying**
- Cloudflare native CI watches `main` — check the Cloudflare dashboard for build logs
- No GitHub secrets or Actions setup needed for Cloudflare deployments

**Tests fail locally but pass in CI**
```bash
npm ci --force      # clear cache
npm run test:run    # same command as CI
```

## Local Commands

```bash
npm run dev           # Dev server (http://localhost:3000)
npm run lint          # ESLint
npm run test:run      # Unit + config tests (CI mode)
npm run test:configs  # Config tests only
npm run build         # Build Next.js
npm run preview       # Local Cloudflare preview
```
