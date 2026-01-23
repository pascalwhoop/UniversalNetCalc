# GitHub Branch Protection Setup Guide

This document outlines the manual GitHub settings needed to complete the CI/CD setup. Branch protection rules must be configured in the GitHub web UI as they cannot be automated via repository files.

## Setup Instructions

1. Go to **Settings → Branches** in your GitHub repository
2. Click **Add rule** under "Branch protection rules"
3. Configure the rule with the following settings:

### Rule Settings

**Branch name pattern:** `main`

### Protect matching branches

#### Code review and approvals
- ☑️ **Require a pull request before merging**
  - Require 1 approval (adjust if needed)
  - Dismiss stale pull request approvals when new commits are pushed
  - Require review from code owners (if CODEOWNERS file exists)

#### Require status checks to pass
- ☑️ **Require branches to be up to date before merging** → **UNCHECK**
  - (Reduces friction for multiple concurrent PRs)

- ☑️ **Require status checks to pass before merging**
  - Require the following status checks to pass:
    - `code-quality` (from `.github/workflows/pr.yml`)
    - `unit-tests` (from `.github/workflows/pr.yml`)
    - `build-validation` (from `.github/workflows/pr.yml`)

#### Additional settings
- ☑️ **Require conversation resolution before merging**
- ☑️ **Include administrators** (so rules apply to maintainers too)
- ☑️ **Restrict who can push to matching branches** (optional - enable if you want to prevent even maintainers from direct pushes)
- ☐ Do NOT check "Allow force pushes"
- ☐ Do NOT check "Allow deletions"

### Optional: Require approvals from specific teams
If you have a team of maintainers, you can require approvals from that team:
- Create a `CODEOWNERS` file in the repository root
- Then enable "Require review from code owners" above

Example `.github/CODEOWNERS`:
```
# All files require review from maintainers
* @your-org/maintainers

# Config-specific: make it easier for community to contribute configs
/configs/ @your-org/config-maintainers
```

## Status Checks Explanation

### Required Checks
These MUST pass for a PR to be mergeable:
- **code-quality** - ESLint and TypeScript type checking
- **unit-tests** - Vitest unit tests + config test vectors
- **build-validation** - Ensures manifest is up to date, bundles build correctly

### Informational Checks (not blocking)
These run but don't block merging:
- **e2e-tests** - Only runs if UI/API changed; doesn't block if unchanged
- **config-tests** - Runs on config-only PRs; separate fast track

## Why These Choices?

- **1 approval minimum** - Balances code quality with contributor velocity
- **Branch up to date: NO** - Allows community PRs to merge without force-fetching main constantly
- **Required checks** - Prevent known-broken code from reaching main
- **Conversation resolution** - Ensures all comments are addressed before merge
- **Include administrators** - Rules apply equally to everyone

## Enforcement Timeline

### Day 1 (Soft enforcement)
Configure branch protection with **NOT** requiring status checks. Let the workflows run and stabilize.

### Day 2-3 (Audit)
Monitor failing checks, fix any configuration issues, ensure workflows run correctly.

### Day 4+ (Hard enforcement)
Enable "Require status checks to pass before merging" to fully enforce the rules.

## Troubleshooting

### "Status check has not reported yet"
The workflow hasn't run yet. Wait for the workflow to complete, or push a new commit to trigger it.

### "Required status check 'code-quality' did not come back"
The workflow failed or was skipped. Check the workflow run logs in the Actions tab.

### "Cannot merge - required status check failed"
Fix the failing check:
- **code-quality** - Run `npm run lint && npx tsc --noEmit` locally
- **unit-tests** - Run `npm run test:run && npm run test:configs` locally
- **build-validation** - Run `npm run build` locally and check manifest with `npm run generate:manifest`

## Reverting Protection Rules

If you need to temporarily disable protections:
1. Go to Settings → Branches
2. Edit the rule or delete it
3. Make your changes
4. Re-enable the rule

(Branches are never permanently deleted, just the protection rules)

## Next Steps

After configuring branch protection, verify it works:
1. Create a test PR with intentional failures (failing test, linting error, etc.)
2. Verify the PR is blocked with the appropriate check failing
3. Fix the issue and verify the PR can now be merged
4. Test that merging requires an approval

See the [verification plan in the implementation guide](../docs/ci-cd-implementation-verification.md) for more details.
