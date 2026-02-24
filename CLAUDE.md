# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ALWAYS consider using one of the skills. They are there for a reason. If I ask you to do stuff that obviously matches a skill, use it!

## Project Overview

This is a **Universal Gross-to-Net Salary Calculator** that provides accurate after-tax income calculations for multiple countries. The system is driven by YAML configuration files that define country-specific tax rules, calculations, and parameters.

**Key characteristics:**
- Next.js application deployed to Cloudflare Workers via OpenNext
- Config-driven tax calculations using a calculation graph (DAG) system
- Community-maintainable YAML configs per country/year with test vectors
- Pure TypeScript calculation engine with no framework dependencies

See PRD.md for complete product requirements and architecture decisions.

## Development Commands

```bash
# Development
npm run dev                    # Start Next.js dev server (http://localhost:3000)

# Testing
npm run test                   # Run all tests with Vitest
npm run test:ui                # Run tests with UI
npm run test:run               # Run tests once (CI mode)
npm run test:configs           # Run only config test vectors (validates all country configs)

# Building
npm run build                  # Build Next.js application

# Deployment (Cloudflare)
npm run preview                # Preview on Cloudflare runtime locally
npm run deploy                 # Build and deploy to Cloudflare
npm run upload                 # Build and upload to Cloudflare (no deploy)

# Release Management
make release                   # Interactive release creation (version bump, tag, push)

# Other
npm run lint                   # Run ESLint
npm run cf-typegen             # Generate Cloudflare environment types
```

**Important:** Always run `npm run test:configs` after creating or modifying tax configurations to ensure all test vectors pass.

### Release Workflow

To create a production release:
```bash
make release  # Interactive process:
              # - Validates you're on main branch
              # - Pulls latest changes
              # - Runs all tests
              # - Prompts for version bump (patch/minor/major)
              # - Updates CHANGELOG.md
              # - Creates git tag
              # - Pushes to remote
              # → GitHub Actions automatically deploys to production
```

PR preview deployments happen automatically when a pull request is opened or updated.
The preview URL is posted as a comment on the PR.

**Note:** The developer often runs the server on port 3000 already. When 3000 is occupied assume the server is already running and use the existing service instead of trying to spin up your own

## Architecture

### Monorepo Structure

The project uses a lightweight monorepo structure:

```
/packages/engine/           Pure TypeScript calculation engine
  /src/engine.ts           Main CalculationEngine class
  /src/evaluators.ts       Node type evaluators (bracket_tax, percent_of, etc.)
  /src/functions.ts        Registered functions for function nodes
  /src/config-loader.ts    Loads and merges YAML configs
  /__tests__/              Engine tests and config validation

/packages/schema/           TypeScript types for configs
  /src/config-types.ts     Complete type definitions for YAML configs

/configs/<country>/<year>/  Tax configuration files
  base.yaml                Base config for country/year
  variants/*.yaml          Variant configs (expat regimes, etc.)
  tests/*.json             Test vectors with expected outputs

/src/app/                  Next.js application
  /api/calc/route.ts       Main calculation API endpoint
  /components/calculator/  Calculator UI components
```

### Calculation Engine

The calculation engine is a **directed acyclic graph (DAG) evaluator** that processes tax rules:

1. **Config Loading:** `ConfigLoader` loads YAML configs and merges variants with base configs
2. **Context Initialization:** Creates context with inputs, parameters, and empty nodes object
3. **Node Evaluation:** Evaluates each calculation node in order, storing results in context
4. **Output Resolution:** Resolves output definitions (gross, net, effective_rate, breakdown)

**Key concepts:**

- **References:**
  - `@input_name` - References user inputs (e.g., `@gross_annual`)
  - `$node_id` - References calculated nodes or parameters (e.g., `$taxable_income`)

- **Node Types:**
  - Arithmetic: `sum`, `sub`, `mul`, `div`, `min`, `max`, `clamp`
  - Tax: `bracket_tax`, `percent_of`
  - Deductions/Credits: `deduction`, `credit` (with phaseouts)
  - Control: `switch`, `lookup`, `conditional`
  - Utilities: `round`, `function` (escape hatch)

- **Categories:** Nodes are categorized as `income_tax`, `contribution`, `credit`, `deduction`, or `surtax` for breakdown display

See `packages/schema/src/config-types.ts` for complete type definitions.

### Config System

**File structure:**
```
configs/nl/2025/
  base.yaml              # Base configuration
  variants/
    30-ruling.yaml       # Variant that overlays/patches base
  tests/
    single-median.json   # Test vectors
```

**Variant merging rules:**
- `meta`, `parameters`: Merged/replaced by key
- `calculations`: Nodes with matching `id` are replaced; use `$delete: true` to remove base nodes
- `notices`: Appended to base notices

**Test vectors:**
Test vectors are JSON files that specify inputs and expected outputs. The test runner (`packages/engine/__tests__/config-tests.test.ts`) automatically discovers and runs all test vectors.

Format:
```json
{
  "name": "Test case name",
  "inputs": { "gross_annual": 50000, "filing_status": "single" },
  "expected": {
    "net": 38746,
    "effective_rate": 0.22508,
    "breakdown": { "income_tax": 12345, "general_credit": -3068 }
  },
  "tolerance": 10,
  "tolerance_percent": 0.005
}
```

### API Endpoints

**POST /api/calc** - Calculate net salary
```json
{
  "country": "nl",
  "year": 2025,
  "gross_annual": 60000,
  "filing_status": "single",
  "variant": "30-ruling",       // Optional
  "region_level_1": "canton",   // Optional (for CH, US, etc.)
  "region_level_2": "municipality" // Optional
}
```

**GET /api/calc?action=countries** - List available countries

**GET /api/calc?action=years&country=nl** - List years for country

**GET /api/calc?action=variants&country=nl&year=2025** - List variants

**GET /api/calc?action=inputs&country=nl&year=2025&variant=30-ruling** - Get input schema

## Working with Configs

### Adding a New Country

Use the `/add-new-country` skill which provides guided workflow for:
1. Researching tax rules and finding official sources
2. Creating YAML configuration with all required sections
3. Writing comprehensive test vectors
4. Validating configs pass `npm run test:configs`
5. Debugging any test failures

**Manual steps:**
1. Create directory structure: `configs/<country>/<year>/`
2. Create `base.yaml` with meta, inputs, parameters, calculations, outputs
3. Add test vectors in `tests/` directory (at least low, median, high income)
4. Run `npm run test:configs` to validate
5. Reference official sources in `meta.sources`

### Creating Variants

Variants overlay/patch base configs for special tax regimes (expat programs, filing types, etc.):

1. Create `configs/<country>/<year>/variants/<variant-name>.yaml`
2. Include `meta.variant`, `meta.label`, `meta.description`, `meta.base`
3. Only include sections that differ from base
4. To remove base calculations, use `$delete: true` on node
5. Add test vectors that test the variant-specific behavior

Example:
```yaml
meta:
  variant: "30-ruling"
  label: "30% Ruling"
  description: "Dutch expat tax regime with 30% tax-free allowance"
  base: "base.yaml"

parameters:
  ruling_percentage: 0.30

calculations:
  - id: taxable_income
    type: mul
    values: ["@gross_annual", 0.70]  # Replace base taxable_income calculation
```

### Understanding Calculation Flow

To understand how a config calculates taxes:

1. Read `configs/<country>/<year>/base.yaml` - Start with `calculations` section
2. Trace node dependencies using `$` references (e.g., if node uses `$taxable_income`, find the node with `id: taxable_income`)
3. Check `outputs` section to see which nodes contribute to final result
4. Look at test vectors in `tests/` to see concrete examples
5. Trace through evaluators in `packages/engine/src/evaluators.ts` for node behavior

**Example flow for Netherlands:**
- Input: `@gross_annual`
- Calculate: `taxable_income` (identity to gross)
- Calculate: `income_tax` (bracket_tax on taxable_income)
- Calculate: `general_credit` (credit with phaseout)
- Calculate: `labour_credit` (credit with complex brackets)
- Calculate: `total_credits` (sum of credits)
- Calculate: `net` (gross - income_tax + total_credits)

## Common Tasks

### Debugging Config Test Failures

When `npm run test:configs` fails:

1. Check the error message for which test vector failed and the actual vs expected values
2. Open the failing test vector JSON file to see inputs and expected outputs
3. Load the config YAML and trace the calculation manually
4. Add `console.log` statements in `packages/engine/src/engine.ts` or evaluators to see intermediate values
5. Check if parameters are correct (e.g., tax brackets, rates, thresholds)
6. Verify references are correct (`@inputs` vs `$nodes`)
7. Check rounding modes if values are close but not exact

### Adding a New Node Type

If you need a calculation primitive not covered by existing node types:

1. Add type definition to `packages/schema/src/config-types.ts`
2. Add evaluator function to `packages/engine/src/evaluators.ts`
3. Add case to switch statement in `evaluateNode()`
4. Add tests in `packages/engine/__tests__/`
5. Update this documentation

### Testing Changes Locally

1. Make changes to configs or code
2. Run `npm run test:configs` to validate configs
3. Run `npm run dev` and test in browser
4. Use `/api/calc` endpoint directly with curl/Postman for debugging
5. Check `src/app/api/calc/route.ts` error handling

### Documenting Gotchas & Project Documentation

**Documentation Convention:**
- All project documentation goes in the `docs/` folder
- This includes guides, setup instructions, implementation notes, and reference material
- The `docs/` folder is the single source of truth for all non-code documentation
- When writing guides or implementation docs, create `.md` files in `docs/`
- See existing files in `docs/` for examples: `README.md`, `prd.md`, `gotchas.md`, etc.

**Gotchas specifically:**
- When you catch a gotcha while developing, write a note in `docs/gotchas.md` explaining the trap and how to solve it
- This helps future devs avoid the same pitfall

## Important Notes

- **No framework dependencies in engine:** The `packages/engine` must remain pure TypeScript with no Next.js/React dependencies so it can run in Workers and be tested easily
- **Config immutability:** Once a config is published for a year, avoid breaking changes. Create new variants instead
- **Tolerance in tests:** Use `tolerance` (absolute) or `tolerance_percent` (relative) in test vectors to account for rounding differences
- **Cloudflare constraints:** Be mindful of Worker bundle size limits and CPU time constraints (see PRD.md section 8.1)
- **Reference format:** Always use `@` for inputs and `$` for nodes/parameters - this is enforced by the engine
- **Test coverage:** Every config must have at least low, median, and high income test vectors; add regional and variant tests as needed

## CI/CD System

Deployments are handled by **Cloudflare Workers Builds** (native CI). GitHub Actions handles testing and versioning only.

### Deployment Workflow

**PR Preview (Cloudflare native):**
- Cloudflare automatically runs `wrangler versions upload` on every PR branch push
- Preview URL is posted in the Cloudflare dashboard and follows the pattern:
  `https://<hash>-universal-net-calc.reconnct.workers.dev`

**Production (Cloudflare native):**
- Cloudflare automatically runs `wrangler deploy` on every push to `main`
- Available at: `https://universal-net-calc.reconnct.workers.dev`

**PR Validation (GitHub Actions):**
- Runs on all pull requests
- Code quality checks (ESLint + TypeScript)
- Unit tests (Vitest) + config tests
- Build validation

**Release tagging (GitHub Actions):**
- On push to `main`: bumps patch version, creates git tag, creates GitHub release

### Documentation

- **Complete guide:** `docs/ci-cd.md` - Workflows, setup, troubleshooting
- **Workflow files:** `.github/workflows/`
  - `pr.yml` - PR validation (lint, tests, build)
  - `release.yml` - Version bump and GitHub release (tag-triggered)

### Release Management

- Version management is manual via `make release`
- Changelog is auto-generated from conventional commits
- Each release creates an immutable git tag and GitHub release
- All releases are stored in `CHANGELOG.md`

For CI/CD details, see `docs/ci-cd.md`.

## UI Components

The application uses:
- **shadcn/ui** for base components (buttons, inputs, cards, etc.)
- **Recharts** for charts and visualizations
- **Tailwind CSS** for styling
- Component location: `src/components/calculator/`

Key components:
- `country-column.tsx` - Calculator form and results for a single country
- `salary-range-chart.tsx` - Visualizations of tax rates across income ranges
