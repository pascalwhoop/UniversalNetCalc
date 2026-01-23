# GitHub Configuration

This directory contains GitHub-specific configuration files.

## Contents

- **`workflows/`** - GitHub Actions CI/CD workflows
- **`PULL_REQUEST_TEMPLATE.md`** - Default PR template
- **`PULL_REQUEST_TEMPLATE/config.md`** - Config-specific PR variant
- **`dependabot.yml`** - Automated dependency updates configuration

## Documentation

All CI/CD documentation has been moved to the `docs/` folder:

- **`docs/ci-cd-implementation.md`** - Overview of the CI/CD system
- **`docs/github-branch-protection-setup.md`** - How to configure GitHub branch protection
- **`docs/ci-cd-implementation-verification.md`** - Verification checklist
- **`docs/github-workflows.md`** - Detailed workflow reference

Start with `docs/ci-cd-implementation.md` for setup instructions.

## GitHub-Specific Files

### PR Templates

The PR templates help guide contributors:
- **`PULL_REQUEST_TEMPLATE.md`** - Shows when opening a new PR
- **`PULL_REQUEST_TEMPLATE/config.md`** - Alternative template for config contributions

### Workflows

All workflow files are in `.github/workflows/`:
- `pr.yml` - Main PR validation
- `config-validation.yml` - Fast validation for config changes
- `deploy-preview.yml` - Preview deployment
- `deploy-production.yml` - Production deployment
- `welcome.yml` - Welcome new contributors
- `stale-configs.yml` - Detect outdated configs

See `workflows/README.md` for details.

### Dependabot

`dependabot.yml` configures automated dependency updates:
- Weekly checks for npm updates
- Auto-creates PRs for updates
- Labeled with "dependencies" and "npm"

## For Contributors

When opening a PR:
1. Follow the template provided
2. For config PRs, use the config-specific variant
3. All checks must pass before merging
4. See `docs/github-workflows.md` for CI/CD details

## For Maintainers

To set up CI/CD:
1. Read `docs/ci-cd-implementation.md`
2. Follow `docs/github-branch-protection-setup.md`
3. Run verification steps in `docs/ci-cd-implementation-verification.md`

See `docs/github-workflows.md` for ongoing reference.
