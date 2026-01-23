# GitHub Actions Workflows

This directory contains the CI/CD workflow files for the Universal Salary Calculator project.

**Documentation has been moved to `docs/`:**
- **`docs/ci-cd-implementation.md`** - Overview of the CI/CD system
- **`docs/github-workflows.md`** - Detailed workflow reference
- **`docs/github-branch-protection-setup.md`** - GitHub configuration guide
- **`docs/ci-cd-implementation-verification.md`** - Verification checklist

## Workflow Files

| File | Purpose |
|------|---------|
| `pr.yml` | Full PR validation (code quality, tests, build) |
| `config-validation.yml` | Fast validation for config-only PRs (~30s) |
| `deploy-preview.yml` | Deploy to preview environment |
| `deploy-production.yml` | Deploy to production (with approval) |
| `welcome.yml` | Welcome message for first-time contributors |
| `stale-configs.yml` | Monthly maintenance: detect old configs |

## Quick Reference

### Status Checks (Required for merge)
- ✅ `code-quality` - ESLint + TypeScript
- ✅ `unit-tests` - Vitest + config tests
- ✅ `build-validation` - Next.js build + manifest check

### Typical Timings
- **Config PR:** ~30 seconds
- **Code PR:** 3-5 minutes
- **UI change PR:** 5-7 minutes (includes E2E tests)

## Documentation

For complete details, setup instructions, and verification steps, see:
- `docs/ci-cd-implementation.md` - Start here
- `docs/github-workflows.md` - Full reference
- `docs/github-branch-protection-setup.md` - GitHub settings
- `docs/ci-cd-implementation-verification.md` - Testing checklist

## Local Testing

Before pushing, run:
```bash
npm run lint
npm run test:run
npm run test:configs
npm run build
```

See `docs/github-workflows.md#local-testing` for more commands.
