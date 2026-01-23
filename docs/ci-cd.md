# CI/CD System

Automated workflows for testing, validation, and deployment.

## Quick Start

**For Contributors:**
```bash
# Before pushing
npm run lint && npm run test:run && npm run test:configs
```

**For Maintainers:**
1. Configure GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
2. Set up branch protection (Settings → Branches → Add rule for `main`)
3. Create "production" environment with required reviewers

## Workflows

### PR Validation (`pr.yml`)
**Triggers:** All pull requests
**Duration:** 3-7 minutes
**Jobs:**
- `code-quality` - ESLint + TypeScript
- `unit-tests` - Vitest + config tests
- `build-validation` - Next.js build + manifest check
- `e2e-tests` - Playwright (conditional, only if UI/API/engine changed)

**Features:**
- Parallel execution for speed
- Cancels stale runs on new commits
- Smart E2E detection (saves 3-4 min on config-only PRs)

### Config Fast Track (`config-validation.yml`)
**Triggers:** PRs modifying `configs/**`
**Duration:** ~30 seconds
**Jobs:**
- Config test vectors validation
- Auto-labels PR with "config-only"

**Purpose:** Lightning-fast feedback for config contributors.

### Preview Deployment (`deploy-preview.yml`)
**Triggers:**
- Auto: Push to `main`
- Manual: Add "deploy-preview" label to PR

**Actions:** Deploy to Cloudflare preview environment, post URL in PR.

### Production Deployment (`deploy-production.yml`)
**Triggers:**
- Manual: workflow_dispatch with reason
- Auto: Git tag push (v*.*.*)

**Actions:** Run safety checks, deploy with manual approval, create GitHub release.

### Maintenance
- `welcome.yml` - Welcome first-time contributors
- `stale-configs.yml` - Monthly check for outdated configs (>2 years)

## Workflow Files

| File | Purpose | When it runs |
|------|---------|--------------|
| `.github/workflows/pr.yml` | Full PR validation | All PRs |
| `.github/workflows/config-validation.yml` | Fast config track | PR with config changes |
| `.github/workflows/deploy-preview.yml` | Preview deploy | Push to main or label |
| `.github/workflows/deploy-production.yml` | Production release | Manual or git tag |
| `.github/workflows/welcome.yml` | First-timer welcome | PR opened |
| `.github/workflows/stale-configs.yml` | Maintenance | 1st of month |

## Branch Protection Setup

**Required settings for `main` branch:**

1. Go to Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1
   - ✅ Require status checks to pass: `code-quality`, `unit-tests`, `build-validation`
   - ✅ Require branches to be up to date: No (allows parallel PRs)
   - ✅ Include administrators
4. Save

**GitHub Secrets (for deployment):**
- Settings → Secrets → Actions → New repository secret
- Add: `CLOUDFLARE_API_TOKEN` (from Cloudflare dashboard)
- Add: `CLOUDFLARE_ACCOUNT_ID` (from Cloudflare dashboard)

**GitHub Environment (for production):**
- Settings → Environments → New environment: "production"
- Add required reviewers (your team)
- Save

## Performance

| Scenario | Duration | Caching |
|----------|----------|---------|
| Config-only PR | ~30s | npm dependencies |
| Code PR (no UI) | 3-5 min | npm + Next.js build |
| UI change PR | 5-7 min | npm + Next.js + Playwright |

**Cache hit rate:** 70-90% (based on package-lock.json hash)

## Troubleshooting

**Build fails with "manifest out of sync"**
```bash
npm run generate:manifest
git add configs-manifest.json
git commit -m "chore: regenerate manifest"
```

**E2E tests timeout**
- Check `playwright.config.ts` timeout settings
- May need increase for slower environments

**Deployment stuck waiting for approval**
- Check Settings → Environments
- Verify reviewer has permission

**Status check didn't report**
- Check Actions tab for errors
- Workflow may take 1-2 min to start

## Local Testing

```bash
# Linting
npm run lint

# Unit tests
npm run test

# Config tests only
npm run test:configs

# E2E tests
npm run test:e2e

# Type check
npx tsc --noEmit

# Full build
npm run build

# Preview deployment
npm run preview

# Deploy to production
npm run deploy
```

## Cost Optimization

- Single Node.js version (no matrix builds)
- Conditional E2E tests
- Cancel in-progress runs
- Aggressive caching (50-70% faster builds)

## References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/)
