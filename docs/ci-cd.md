# CI/CD System

Automated workflows for testing, validation, and deployment.

## Quick Start

**For Contributors:**
```bash
# Before pushing
npm run lint && npm run test:run && npm run test:configs
```

**For Testing PR Preview:**
1. Create a pull request
2. Comment `/release-preview` on the PR
3. Wait for deployment (2-3 minutes)
4. Click the preview link in the bot comment
5. Test your changes in the preview environment

**For Creating a Release:**
```bash
make release  # Automated release process:
              # - Validates git status
              # - Pulls latest
              # - Runs tests
              # - Prompts for version (patch/minor/major)
              # - Updates CHANGELOG
              # - Creates tag and pushes
              # → GitHub Actions deploys to production
```

**For Maintainers:**
1. Configure GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
2. Set up branch protection (Settings → Branches → Add rule for `main`)
3. Create "production" environment with required reviewers (optional)

## Workflows

### PR Validation (`pr.yml`)
**Triggers:** All pull requests
**Duration:** 3-7 minutes
**Jobs:**
- `validate` - ESLint, TypeScript, Vitest, config tests, build check

**Features:**
- Runs on every PR to ensure code quality
- Validates configurations and test vectors
- Cancels stale runs on new commits

### PR Preview Deployment (`pr-preview.yml`)
**Triggers:** Comment with `/release-preview` on a pull request
**Duration:** 2-3 minutes
**Requirements:**
- User must have write access to the repository
- Comment must be on a pull request (not an issue)

**Actions:**
1. Checks permission (only collaborators/members can trigger)
2. Checks out PR branch
3. Builds for Cloudflare
4. Deploys to PR-specific preview: `https://universal-net-calc-pr-{PR_NUMBER}.reconnct.workers.dev`
5. Comments back with preview link
6. Available until PR is closed

**Usage:**
```
Comment on PR:  /release-preview
```

### Production Release Deployment (`release.yml`)
**Triggers:** Push of a git tag matching `v*` (e.g., `v1.0.0`)
**Duration:** 3-5 minutes
**Requirements:**
- All tests must pass
- Tag must exist in `production` environment (with optional required reviewers)

**Actions:**
1. Validates all tests pass
2. Builds for Cloudflare
3. Deploys to production: `https://universal-net-calc.reconnct.workers.dev`
4. Generates changelog from commits since last tag
5. Creates GitHub release with auto-generated notes
6. Release is immutable and tied to git tag

**Creating a release:**
```bash
make release  # Interactive process handles everything
```

### Maintenance
- `welcome.yml` - Welcome first-time contributors
- `stale-configs.yml` - Monthly check for outdated configs (>2 years)

## Workflow Files

| File | Purpose | Trigger | Environment |
|------|---------|---------|-------------|
| `.github/workflows/pr.yml` | PR validation | All pull requests | None |
| `.github/workflows/pr-preview.yml` | PR preview deploy | Comment `/release-preview` | preview |
| `.github/workflows/release.yml` | Production release | Tag push (`v*`) | production |
| `.github/workflows/deploy.yml` | Reusable deploy | Called by other workflows | preview or production |

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

| Workflow | Duration | Notes |
|----------|----------|-------|
| PR Validation | 3-7 min | Runs on every PR, code quality + tests + build |
| PR Preview | 2-3 min | On-demand via `/release-preview` comment |
| Production Release | 3-5 min | Tag-triggered, includes tests + build + deploy |

**Cache hit rate:** 70-90% (based on package-lock.json hash)

**Optimization tips:**
- Use conventional commits (feat:, fix:, etc.) for better changelog generation
- PR previews are opt-in to save resources
- Production deploys use the same build as PR validation

## Troubleshooting

### Release Process

**`make release` fails with "working directory has uncommitted changes"**
- Commit or stash all changes before releasing
- Run `git status` to see what's uncommitted

**`make release` fails with "Not on main branch"**
- Switch to main: `git checkout main`
- Ensure you're on the correct branch

**Tag push failed**
- Check that you have push permission to the repository
- Verify git is configured: `git config user.email` and `git config user.name`
- If tag already exists, delete locally and on remote: `git tag -d v1.0.0 && git push origin :v1.0.0`

**Production deployment stuck**
- Check GitHub Actions tab for workflow errors
- Verify `production` environment exists (Settings → Environments)
- If using required reviewers, ensure someone approves the deployment

### PR Preview

**`/release-preview` comment doesn't trigger workflow**
- Only collaborators/members can trigger previews
- Check that you have write access to the repository
- Make sure the comment text is exactly `/release-preview`

**PR preview deployment failed**
- Check GitHub Actions tab for the `PR Preview` workflow
- Look for build errors or Cloudflare deployment issues
- Verify `preview` environment exists and has valid secrets

**Preview URL doesn't work**
- Wait a few seconds after deployment completes
- Check that the URL follows pattern: `https://universal-net-calc-pr-{PR_NUMBER}.reconnct.workers.dev`
- Verify Cloudflare account has workers enabled

### General

**Build fails with "manifest out of sync"**
```bash
npm run generate:manifest
git add configs-manifest.json
git commit -m "chore: regenerate manifest"
```

**Tests fail locally but pass in CI**
- Clear cache: `npm ci --force`
- Clear node_modules: `rm -rf node_modules && npm ci`
- Run same test command as CI: `npm run test:run`

**Deployment stuck waiting for approval**
- Check Settings → Environments
- Verify reviewer has permission
- Check that environment has valid secrets

## Local Testing & Release

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

# Preview deployment (local Cloudflare)
npm run preview

# Create production release (interactive)
make release
  # - Validates clean git state
  # - Runs all tests
  # - Prompts for version (patch/minor/major)
  # - Updates CHANGELOG
  # - Creates tag
  # - Pushes to remote → triggers GitHub Actions deployment
```

## Release Checklist

Before running `make release`:

- [ ] All changes are committed and pushed to `main`
- [ ] Latest changes are pulled: `git pull origin main`
- [ ] All tests pass locally: `npm run test:run && npm run test:configs`
- [ ] CHANGELOG is up to date (the script will update it automatically)
- [ ] Version bump type is decided (patch/minor/major)
- [ ] Ready to deploy to production (the change will go live after push)

## Cost Optimization

- Single Node.js version (no matrix builds)
- Conditional E2E tests
- Cancel in-progress runs
- Aggressive caching (50-70% faster builds)

## References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/)
