# GitHub Actions Workflows

Two lean workflows. That's it.

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
