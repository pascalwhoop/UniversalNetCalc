# GitHub Actions Workflows

Three lean workflows for CI/CD and versioning.

## Workflows

### `pr.yml` - PR Validation
**Triggers:** All pull requests
**Duration:** 3-5 minutes
**Steps:**
- Lint (non-blocking)
- TypeScript check (non-blocking)
- Run tests
- Build app
- Check manifest is up-to-date

### `deploy.yml` - Deploy
**Triggers:**
- Auto: Push to `main` (deploys to preview)
- Manual: Workflow dispatch (choose preview or production)

**Environments:**
- `preview` - https://universal-net-calc-preview.reconnct.workers.dev
- `production` - Requires approval

### `version-bump.yml` - Auto Version Bump
**Triggers:** Push to `main` (except docs/workflows changes)
**Duration:** ~30 seconds
**What it does:**
- Automatically increments patch version in package.json
- Commits with `[skip ci]` to avoid triggering other workflows
- Skips if commit already contains `[skip ci]` or is a version bump commit

**Note:** Version bumps happen after merging to main, not on every commit during PR review.

## Local Testing

```bash
# Run all checks before pushing
npm run lint
npm run test:run
npm run test:configs
make build

# Test Cloudflare build
make build-cloudflare

# Deploy
make deploy-preview
make deploy-prod
```

## Setup

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

**Environment:** Create "production" environment in GitHub with required reviewers.

For complete details, see `docs/ci-cd.md`
