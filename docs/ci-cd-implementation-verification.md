# CI/CD Implementation Verification Guide

This guide walks you through verifying that the CI/CD system is working correctly after implementation.

## Phase 1 Verification: Core CI (Priority 1)

### Prerequisite: Create a Test Branch
```bash
git checkout -b test/ci-verification
```

### Step 1: Verify Config Validation Workflow
**Goal:** Ensure `config-validation.yml` runs on config-only PRs in ~30 seconds

1. Create a test config file:
   ```bash
   mkdir -p configs/test/2025/tests
   cat > configs/test/2025/base.yaml << 'EOF'
   meta:
     country: test
     year: 2025
     label: "Test Config"

   inputs:
     - id: gross_annual
       type: number

   parameters: {}

   calculations:
     - id: net
       type: identity
       value: "@gross_annual"

   outputs:
     net: "$net"
   EOF

   cat > configs/test/2025/tests/test-vector.json << 'EOF'
   {
     "name": "Test vector",
     "inputs": { "gross_annual": 50000 },
     "expected": { "net": 50000 },
     "tolerance": 0
   }
   EOF
   ```

2. Create a PR:
   ```bash
   git add configs/test
   git commit -m "test: add test config for CI verification"
   git push origin test/ci-verification
   ```

3. Open a pull request on GitHub

4. **Verify in Actions tab:**
   - `config-validation.yml` runs (not `pr.yml`)
   - Completes in <30 seconds
   - "config-only" label is auto-added to PR
   - Tests pass

5. **Clean up:**
   - Close PR without merging
   - Delete test config: `git rm -r configs/test`

### Step 2: Verify PR Validation Workflow
**Goal:** Ensure `pr.yml` runs on code changes with all jobs

1. Make a small code change:
   ```bash
   # Edit any file - just make a small comment change
   echo "// Test change" >> src/app/api/calc/route.ts
   git add src/app/api/calc/route.ts
   git commit -m "test: verify pr.yml workflow"
   git push origin test/ci-verification
   ```

2. Create a PR

3. **Verify in Actions tab:**
   - `pr.yml` runs (not just `config-validation.yml`)
   - All jobs run: `code-quality`, `unit-tests`, `build-validation`
   - Jobs run in parallel (they should start ~same time)
   - Completes in 3-7 minutes
   - If UI files changed, `e2e-tests` runs

4. **Check logs:**
   - `code-quality`: Should show ESLint passing, TypeScript type check passing
   - `unit-tests`: Should show Vitest tests passing
   - `build-validation`: Should show build succeeds, manifest is up to date

5. **Verify PR is mergeable:**
   - All required checks show green ✅
   - Try to merge - should be allowed (no approval yet)

6. **Test branch protection:**
   - Undo the test change: `git checkout src/app/api/calc/route.ts`
   - Force push to update PR: `git push -f origin test/ci-verification`
   - PR should update with new commit
   - Verify the change we made is reverted

7. **Clean up:**
   - Close PR without merging
   - Delete branch: `git branch -D test/ci-verification && git push origin :test/ci-verification`

### Step 3: Configure Branch Protection
**Goal:** Enable branch protection rules in GitHub UI

1. Go to **Settings → Branches**

2. Click **Add rule**

3. Follow `docs/github-branch-protection-setup.md`

4. **Configuration:**
   - Branch name pattern: `main`
   - Require 1 approval
   - Require status checks: `code-quality`, `unit-tests`, `build-validation`
   - Do NOT require branches up to date
   - Include administrators: YES

5. **Test it works:**
   - Try to merge a PR without approval → blocked
   - Add approval → can now merge
   - Try to push directly to main → blocked

## Phase 2 Verification: Quality Gates & Coverage

### Step 1: Verify Build Size Check
**Goal:** Ensure build size checks work and don't block normal builds

1. Check current build size:
   ```bash
   npm run build
   du -sm .next
   ```

2. Should be under 50MB (likely 20-40MB)

3. Verify workflow passes build-validation

### Step 2: Verify Manifest Validation
**Goal:** Ensure stale manifest is caught

1. Create test scenario:
   ```bash
   git checkout -b test/stale-manifest

   # Add a dummy config without regenerating manifest
   mkdir -p configs/dummy/2025
   cat > configs/dummy/2025/base.yaml << 'EOF'
   meta:
     country: dummy
     year: 2025
   EOF

   git add configs/dummy
   git commit -m "test: add config without manifest"
   git push origin test/stale-manifest
   ```

2. Create PR

3. **Verify:**
   - `build-validation` job FAILS
   - Error message: "configs-manifest.json is out of sync"
   - Clear instructions: "Run 'npm run generate:manifest'"

4. **Fix it:**
   ```bash
   npm run generate:manifest
   git add configs-manifest.json
   git commit -m "test: regenerate manifest"
   git push origin test/stale-manifest
   ```

5. **Verify:**
   - PR updates with new commit
   - `build-validation` now PASSES

6. **Clean up:**
   - Close PR
   - Delete config: `git rm -r configs/dummy`
   - Delete branch

## Phase 3 Verification: Deployment

### Step 1: Verify Preview Deployment (Optional)
**Goal:** Ensure preview deployments work

**Requires:** Cloudflare account setup with `CLOUDFLARE_API_TOKEN` secret

1. Merge test PR to main (or push to main directly for testing)

2. Check Actions → `deploy-preview` workflow

3. Should see deployment logs

4. If configured: Check Cloudflare dashboard for preview environment

### Step 2: Verify Production Workflow
**Goal:** Ensure production deployment requires approval

1. Go to **Settings → Environments**

2. Create "production" environment (if not auto-created)

3. Add required reviewers (your GitHub user)

4. Try manual deployment:
   ```bash
   # Trigger via GitHub UI: Actions → Deploy Production → Run workflow
   # Input: reason = "Testing production deployment"
   ```

5. **Verify:**
   - Workflow is pending approval
   - Shows environment approval requirement
   - After approval: Deployment proceeds

## Phase 4 Verification: Developer Experience

### Step 1: Verify PR Templates
**Goal:** Ensure PR templates appear when creating new PR

1. Create test PR: click "New pull request"

2. **Verify:**
   - Default template appears with checklist
   - Template offers choice of "config.md" template variant
   - Template helps guide contributor

### Step 2: Verify Welcome Message
**Goal:** Ensure first-time contributors get welcome message

**Requires:** Second GitHub account or contributor

1. Have contributor open first PR

2. **Verify:**
   - GitHub Actions `welcome` workflow runs
   - Comment appears on PR with welcome message
   - Message is relevant to PR type (config vs code)

### Step 3: Verify CI Comments
**Goal:** Ensure helpful comments appear on failures

1. Create PR with intentional failure:
   ```bash
   git checkout -b test/intentional-failure
   # Break a test
   git push origin test/intentional-failure
   ```

2. Create PR

3. **Verify:**
   - `unit-tests` job fails
   - GitHub comment appears with helpful message
   - Comment links to documentation

4. **Clean up:**
   - Fix the failure and push
   - Or close PR

## Phase 5 Verification: Monitoring

### Step 1: Test Stale Config Detection
**Goal:** Ensure scheduled workflow finds old configs

1. Manually trigger workflow:
   - Go to **Actions → Detect Stale Configs**
   - Click "Run workflow"

2. **Verify:**
   - Workflow completes
   - If old configs exist: Issue is created
   - Issue has correct labels and suggestions

### Step 2: Test Dependabot
**Goal:** Ensure dependency updates are detected

1. Wait for weekly Dependabot run (Monday morning)

   OR manually enable:
   - Go to **Insights → Dependency graph → Dependabot**
   - Enable alerts

2. **Verify:**
   - Dependabot creates PRs for new versions
   - PRs have "dependencies" label
   - All CI checks run on Dependabot PRs

## Full Integration Test

After all phases verified, run a complete test:

1. Create feature branch: `git checkout -b feature/test-full-ci`

2. Make a meaningful code change (e.g., fix a comment, add a test)

3. Create PR with good description

4. **Verify full workflow:**
   - All checks pass: ✅ code-quality, ✅ unit-tests, ✅ build-validation, ✅ e2e-tests
   - Takes 3-7 minutes
   - PR is mergeable
   - All jobs are green

5. Get approval from teammate

6. Merge PR

7. Verify `deploy-preview` runs automatically (if configured)

8. **Success!** ✅ CI/CD is working end-to-end

## Rollback Procedure

If something breaks, you can:

### Disable workflows temporarily
1. Go to **Actions** tab
2. Click workflow name
3. Click "..." menu → "Disable workflow"

### Disable branch protection
1. Go to **Settings → Branches**
2. Edit rule → Disable or delete
3. Fix the issue
4. Re-enable

### Force push to main (emergency only)
```bash
# CAUTION: Only in true emergencies
git push --force-with-lease origin main
```

## Support

If you encounter issues:

1. **Check workflow logs:**
   - Go to **Actions** tab
   - Click failing workflow
   - Expand job sections to see full logs

2. **Check Status Checks:**
   - Go to PR
   - Scroll down to "Checks" section
   - Click failing check → "View logs"

3. **Common issues:**
   - See [Troubleshooting](docs/github-workflows.md#troubleshooting)
   - See [Branch Protection Setup](docs/github-branch-protection-setup.md#troubleshooting)

4. **Contact:**
   - Check [GitHub Actions Documentation](https://docs.github.com/en/actions)
   - File issue in repository with "ci" label

## Next Steps

After verification:

1. ✅ Merge any test changes
2. ✅ Delete test branches
3. ✅ Document any custom configuration in team wiki
4. ✅ Monitor workflow runs over first week
5. ✅ Iterate on feedback from contributors

## Success Criteria

You'll know it's working when:

- ✅ Config PRs get feedback in ~30 seconds
- ✅ Code PRs get full validation in 3-7 minutes
- ✅ Branch protection prevents broken code from reaching main
- ✅ Contributors see helpful error messages
- ✅ First-time contributors get welcome message
- ✅ Deployments require manual approval
- ✅ Stale configs are automatically detected
- ✅ Dependencies are automatically updated
