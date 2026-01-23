# GitHub Workflows Reference

This directory contains the CI/CD workflows for the Universal Salary Calculator project.

## Workflows Overview

### PR Validation

#### `pr.yml` - Full PR Validation
**Triggers:** All pull requests (on open, synchronize, reopen)
**Duration:** ~3-7 minutes (depending on E2E test changes)
**Jobs:**
- `code-quality` - ESLint + TypeScript type checking
- `unit-tests` - Vitest tests + config test vectors
- `build-validation` - Validates manifest, bundles configs, builds Next.js app
- `detect-changes` - Detects which files changed
- `e2e-tests` - Playwright tests (only runs if UI/API/engine changed)

**Key features:**
- Parallel execution of independent jobs for speed
- Conditional E2E tests (saves 3-4 min on config-only PRs)
- Cancels in-progress runs when new commits are pushed

#### `config-validation.yml` - Fast Config Validation
**Triggers:** PRs that modify `configs/**`
**Duration:** ~30 seconds
**Jobs:**
- `config-tests` - Runs config test vectors
- `auto-label` - Adds "config-only" label for easy filtering

**Purpose:** Lightning-fast feedback for config contributors

### Deployment

#### `deploy-preview.yml` - Preview Deployment
**Triggers:**
- Automatically on push to `main`
- Manual via "deploy-preview" label on PR
**Actions:** Builds and deploys to Cloudflare preview environment

#### `deploy-production.yml` - Production Deployment
**Triggers:**
- Manual via `workflow_dispatch` with reason
- Automatic on git tag push (v*.*.*)
**Environment:** Requires approval from maintainers
**Actions:** Runs safety tests, builds, deploys to production, creates GitHub release

### Developer Experience

#### `welcome.yml` - First-Time Contributor Welcome
**Triggers:** When a PR is opened
**Actions:** Posts welcome message for first-time contributors with relevant guidance

### Maintenance

#### `stale-configs.yml` - Detect Outdated Configs
**Triggers:** Monthly on 1st at 00:00 UTC
**Actions:** Creates issue if any configs are older than 2 years

#### `dependabot.yml` - Automated Dependency Updates
**Triggers:** Weekly check for npm updates
**Actions:** Creates PRs for dependency updates with automated labels

## Status Checks (Branch Protection)

The following status checks are **required** for merging to main:
- ✅ `code-quality` - ESLint + TypeScript
- ✅ `unit-tests` - All unit and config tests
- ✅ `build-validation` - Build succeeds, manifest up to date

Optional/informational checks:
- 🔵 `e2e-tests` - Only runs if UI/API changed
- 🔵 `config-tests` - Separate fast track for config PRs

See `docs/github-branch-protection-setup.md` for GitHub Settings configuration.

## Performance Characteristics

### Typical PR Timings

**Config-only PR** (~30 seconds):
- Config validation in parallel: 20-30s
- Label auto-added

**Code-only PR** (~3-5 minutes):
- Code quality + unit tests in parallel: 2-3min
- Build validation: 1-2min
- E2E not triggered (code-only)

**UI/API Change PR** (~5-7 minutes):
- Code quality + unit tests in parallel: 2-3min
- Build validation: 1-2min
- E2E tests: 2-3min
- E2E detected and runs in parallel with build

### Caching
- npm dependencies: Cached by package-lock.json hash
- Next.js build: Cached by package-lock.json + source files
- Playwright browsers: Cached by package-lock.json
- Expected cache hit rate: 70-90%

## Workflow Files

| File | Purpose | Trigger |
|------|---------|---------|
| `.github/workflows/pr.yml` | Main PR validation | All PRs |
| `.github/workflows/config-validation.yml` | Fast config track | PR + config changes |
| `.github/workflows/deploy-preview.yml` | Preview deployment | Push to main OR label |
| `.github/workflows/deploy-production.yml` | Production release | Manual OR git tag |
| `.github/workflows/welcome.yml` | First-time contributor | PR opened |
| `.github/workflows/stale-configs.yml` | Maintenance check | Monthly schedule |

## Environment Variables

### Required GitHub Secrets
- `CLOUDFLARE_API_TOKEN` - For Wrangler deployments
- `CLOUDFLARE_ACCOUNT_ID` - For Wrangler account access
- `GITHUB_TOKEN` - Provided automatically

### GitHub Environments
- `production` - Requires manual approval before deployment

## Troubleshooting

### "Status check 'code-quality' did not report yet"
The workflow hasn't completed. GitHub workflows can take a moment to initialize. If it's stuck after 2+ minutes, check the Actions tab for errors.

### "Build fails with 'configs-manifest.json out of sync'"
Run `npm run generate:manifest` locally and commit the changes.

### "E2E tests failed but I didn't touch UI"
E2E tests only run if UI, API, or engine files changed. If they ran unexpectedly:
1. Check the file changes in the PR
2. If they shouldn't trigger E2E, add them to paths-filter in `.github/workflows/pr.yml`

### "Deployment stuck waiting for approval"
For production deployments, check GitHub Environments in repo Settings. A maintainer must approve the deployment.

### "Playwright tests timeout"
Increase timeout in `playwright.config.ts` if your tests legitimately need more time. Default is usually 30s per test.

## Local Testing

Before pushing, run locally:

```bash
# All tests
npm run test

# Config tests only
npm run test:configs

# E2E tests
npm run test:e2e

# Linting
npm run lint

# Type check
npx tsc --noEmit

# Full build
npm run build

# Preview deployment
npm run preview

# Production deployment (be careful!)
npm run deploy
```

## Adding New Workflows

When adding new workflows:
1. Create `.github/workflows/name.yml`
2. Use consistent trigger syntax from existing workflows
3. Add Node.js 20 setup + npm cache
4. Use existing reusable patterns (checkout, cache, npm ci)
5. Document in this reference

## Reference

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow syntax reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Available actions](https://github.com/actions)

## Implementation Details

### Caching Strategy
- node_modules cached by package-lock.json hash
- Next.js build cache by package-lock.json + source files
- Playwright browsers by package-lock.json
- Expected cache hit rate: 70-90%

### Cost Optimization
- Single Node.js version (20.x) avoids matrix waste
- Conditional E2E saves 3-4 min per config PR
- Cancel in-progress runs saves CI minutes
- Aggressive caching reduces build times 50-70%

### Future Enhancements
- Visual regression testing with Percy/Chromatic
- Performance benchmarking with Lighthouse CI
- Security scanning with Snyk/Dependabot
- Multi-region deployment for CDN
