---
name: add-new-country
description: |
  Create YAML tax configurations for new countries in the universal salary calculator.
  Use when: (1) Adding a new country to the calculator, (2) Adding a new tax year for existing country,
  (3) Creating variant configs (expat regimes, special tax rules), (4) Writing test vectors for configs.
  Triggers: "add country", "create config for", "new tax year", "add variant", "30% ruling config", etc.

  IMPORTANT: This skill includes automated test validation. All configs MUST pass `npm run test:configs`
  before completion. The skill guides you through research, implementation, test creation, validation,
  and debugging until all tests pass.
---

# Add New Country Configuration

## Workflow

1. **Research** - Gather official tax rates, brackets, contributions, credits. See references/country-tax-research.md for guidance.
2. **Plan** - Identify complexity level and required nodes
3. **Implement** - Create base.yaml with all calculations
4. **Write Tests** - Create test vectors with expected values
5. **Validate** - Run test suite, debug failures until all tests pass
6. **Document** - Add sources and notices
7. **Add research to guides** - Add the research to the guides/countries/<country>.md file.

## Quick Reference

File structure:
```
configs/<country>/<year>/
  base.yaml
  variants/<name>.yaml
  tests/<name>.json
```

Reference syntax:
- `@input_name` - User inputs (e.g., `@gross_annual`, `@filing_status`)
- `$node_or_param` - Parameters or calculated nodes

Essential node types:
- `bracket_tax` - Progressive tax brackets
- `percent_of` - Flat percentage
- `credit` - Tax credits (with optional `phaseout`)
- `sum`, `sub`, `min`, `max` - Arithmetic
- `switch`, `lookup` - Conditionals
- `function` - Escape hatch for complex logic (DE, FR, US)

## Process

### Step 1: Research

Gather from official government sources:
- Income tax brackets and rates
- Social security / national insurance rates and caps
- Standard deductions and credits
- Filing status options
- Regional variations (if any)

Record all source URLs with retrieval dates.

#### Deductions Research (always required)

For every country, research user-claimable tax deductions — these are expenses the taxpayer optionally declares that reduce their tax burden. This is separate from statutory deductions (standard allowances built into the tax system automatically).

For each potential deduction, gather:
1. **What it is** — describe the expense category (e.g. mortgage interest, pension contributions, charitable donations, home office, healthcare, childcare, alimony)
2. **How it works** — does it reduce taxable income (Box 1 style) or produce a direct tax credit?
3. **Eligibility** — who qualifies? Primary residence only? Employer vs self-employed?
4. **Cap / maximum** — is there an annual maximum amount deductible?
5. **Threshold** — is there an income-dependent floor the expense must exceed before deduction applies? (e.g. NL healthcare: fixed €132 + 1.65% of income above €8,625)
6. **Rate limit** — is the tax benefit capped at a specific rate even if the taxpayer's marginal rate is higher? (e.g. NL mortgage interest: benefit capped at 37.48% even for top-bracket 49.5% earners)
7. **Time limit** — is there a maximum duration? (e.g. NL mortgage: 30-year limit)
8. **Required secondary inputs** — does implementing this deduction require more than one user input? (e.g. NL mortgage needs both `mortgage_interest_paid` and `mortgage_start_year` for the 30-year check)
9. **Interaction with other deductions** — do multiple deductions share a pool or cap?

Common deduction categories to research for every country:
- Mortgage / home loan interest
- Pension / retirement savings contributions
- Healthcare / medical expenses
- Charitable donations
- Home office / remote work expenses
- Educational expenses / student loan interest
- Alimony / maintenance payments
- Union dues / professional membership fees
- Business expenses (for employees in some countries)
- Childcare costs

Official sources to check:
- National tax authority website (e.g. belastingdienst.nl, gov.uk/income-tax, irs.gov)
- Look for "deductions", "allowances", "reliefs", or "abzüge" / "déductions" in the local language
- Check if there is an official online tax calculator — use it to verify expected values

If the country already has a year in it, consider searching for the same / similar sources to update for the new year requested. Chances are not much changed.


### Step 2: Assess Complexity

| Level    | Characteristics                                       | Approach                 |
| -------- | ----------------------------------------------------- | ------------------------ |
| Simple   | No income tax or flat tax (UAE, SG, HK)               | Pure YAML, minimal nodes |
| Moderate | Progressive brackets + contributions (NL, AU, IE, UK) | Pure YAML                |
| High     | Multi-level regions or special calculations (CH, US)  | YAML + lookups           |
| Complex  | Income splitting, family quotient (DE, FR)            | Use `function` node      |

#### Deduction Complexity Patterns

| Deduction type | YAML pattern |
|----------------|--------------|
| Simple income reduction | `type: deduction`, `amount: "@input"` — reduces taxable income |
| With maximum cap | Add `cap: "$param_or_value"` |
| With income threshold (NL healthcare) | Add `threshold: { amount: "$threshold_node", mode: "above" }` |
| With rate limit for top-bracket earners (NL mortgage) | Requires a surtax correction node — see below |
| Time-limited (NL 30yr mortgage) | Use a `conditional` gate multiplied into the amount |
| Compound (multiple inputs) | Define all inputs as `required: false, default: 0`; use `conditional` or `mul` to combine |

**Important — Rate-Limited Deductions:**
When a deduction's tax benefit is capped at a specific rate (e.g. NL mortgage at 37.48% even for 49.5% earners), the engine's standard `deduction` node is NOT sufficient — it just reduces taxable income at the taxpayer's actual marginal rate. You must add an explicit correction:

```yaml
# For each rate-capped deduction: add a surtax to recover the excess benefit
# for top-bracket earners. Uses gross_annual to determine top-bracket exposure.
- id: gross_above_top_bracket
  type: max
  values:
    - 0
    - type: sub
      values: ["@gross_annual", "$top_bracket_threshold"]

- id: deduction_in_top_bracket
  type: min
  values:
    - "$the_deduction_amount"
    - "$gross_above_top_bracket"

- id: rate_cap_correction
  type: mul
  values:
    - "$deduction_in_top_bracket"
    - 0.1202  # top_rate (49.5%) - cap_rate (37.48%)
  category: surtax
  label: "Deduction Rate Cap Adjustment"
  description: "Limits benefit to capped rate for top-bracket earners"
```
Then add `$rate_cap_correction` to `total_tax_before_credits` and `outputs.breakdown.surtaxes`.

**All deduction inputs must be optional:**
```yaml
my_deduction_input:
  type: number
  required: false
  min: 0
  default: 0
  label: "..."
  description: "..."
```
This ensures existing test vectors (which don't supply deduction inputs) still pass without modification.

### Step 3: Create base.yaml

Minimal template:
```yaml
meta:
  country: "xx"
  year: 2024
  currency: "XXX"
  version: "1.0.0"
  sources:
    - url: "https://..."
      description: "Official tax rates"
      retrieved_at: "2024-01-01"
  updated_at: "2024-01-01"

notices:
  - id: "salary_input"
    title: "Annual Gross"
    body: "Enter total annual salary before deductions."
    severity: "info"

inputs:
  gross_annual:
    type: number
    required: true
  filing_status:
    type: enum
    required: true
    default: "single"
    options:
      single:
        label: "Single"
        description: "Unmarried individual"

parameters:
  tax_brackets:
    - { threshold: 0, rate: 0.20 }
    - { threshold: 50000, rate: 0.40 }

calculations:
  - id: income_tax
    type: bracket_tax
    base: "@gross_annual"
    brackets: "$tax_brackets"
    category: income_tax
    label: "Income Tax"

  - id: net_annual
    type: sub
    values: ["@gross_annual", "$income_tax"]

outputs:
  gross: "@gross_annual"
  net: "$net_annual"
  effective_rate:
    type: div
    values:
      - type: sub
        values: ["@gross_annual", "$net_annual"]
      - "@gross_annual"
  breakdown:
    taxes:
      - "$income_tax"
```

### Step 4: Write Test Vectors

Create `tests/<name>.json` covering:
- Low income (below first bracket)
- Median income (~50-80k)
- High income (top bracket)
- Each filing status
- Regional variations if applicable

**IMPORTANT**: Use official government calculators or tax tables to get accurate expected values. Don't estimate!

Test vector format:
```json
{
  "name": "Single at median income",
  "description": "Verified against official calculator at ...",
  "inputs": {
    "gross_annual": 60000,
    "filing_status": "single"
  },
  "expected": {
    "net": 45000,
    "effective_rate": 0.25,
    "breakdown": {
      "income_tax": 12000,
      "social_security": 3000
    }
  },
  "tolerance": 50,
  "sources": [{
    "description": "Official tax calculator result",
    "url": "https://...",
    "retrieved_at": "2024-01-01"
  }]
}
```

**Tips**:
- Include `breakdown` expectations for major tax items to catch calculation errors early
- Set reasonable `tolerance` (e.g., 50 for rounding differences, 0.0001 for rates)
- Document source URLs so test vectors can be verified independently

**Deduction test vectors must include:**
- A **baseline test** (all deduction inputs = 0 or omitted) that matches the no-deduction result exactly — this verifies optional inputs don't break the base case
- One test **per deduction type** at a realistic amount, with expected values verified against the official tax calculator
- A **rate cap test**: for deductions with a benefit rate limit, include a test where the taxpayer is in the top bracket. The net saving must equal `deduction_amount × cap_rate`, NOT `deduction_amount × top_marginal_rate`. If the config uses a surtax correction node, this test will catch if it's missing.
- **Edge case tests**: amount at cap, amount below threshold (should produce zero deduction), past time limit (30-year check should zero out)

### Step 5: Run Test Suite & Debug

**CRITICAL**: All tests MUST pass before the config is considered complete.

Run the test suite:
```bash
# Run all config tests
npm run test:configs

# Or run tests for specific country
npx vitest run packages/engine/__tests__/config-tests.test.ts -t "xx/2024"
```

#### Common Test Failures & Fixes

**Reference Errors** (`Reference not found: xyz`):
- Check that all `@` inputs are defined in `inputs:` section
- Check that all `$` references point to valid `parameters:` or `calculations:` nodes
- Ensure node IDs match exactly (case-sensitive)

**Calculation Mismatches** (Expected X, got Y):
- Verify bracket thresholds and rates from official sources
- Check for off-by-one errors in bracket calculations
- Ensure correct order of operations in compound calculations
- Validate phaseout calculations (start, end, rate)
- Check rounding modes and precision

**Type Errors** (`is not a number`):
- Ensure switch cases return the correct type for downstream nodes
- Check that conditionals return numeric values when used in arithmetic
- Verify lookup tables have numeric values where expected

**Breakdown Errors** (`Breakdown item not found`):
- Ensure all breakdown nodes have `category` and `label`
- Check that output section references match node IDs

#### Debugging Process

1. **Read the error message** - identifies which test and what failed
2. **Check test vector** - verify expected values are correct
3. **Trace calculation** - follow the node DAG from inputs to outputs
4. **Fix config** - adjust brackets, rates, or logic
5. **Re-run tests** - repeat until all pass

#### Validation Checklist

Once tests pass, verify:
- [ ] All `@` and `$` references resolve
- [ ] Every breakdown node has `category` and `label`
- [ ] Sources documented with URLs and dates
- [ ] Test vectors verified against official calculators
- [ ] Notices guide users on country-specific conventions
- [ ] **All tests pass: `npm run test:configs` shows 100% passing**

### Step 6: Document

Final touches:
- Add helpful notices explaining country-specific conventions
- Document any assumptions or limitations
- Add `description` to all enum options
- Review all source URLs are accessible and dated

## Creating Variants

For special regimes (expat rules, alternative tax treatments):

```yaml
meta:
  variant: "special-regime"
  label: "Special Regime Name"
  description: "Who qualifies and what it does"
  base: "../base.yaml"

parameters:
  # Override or add parameters

calculations:
  # Override nodes by matching id
  - id: taxable_income
    type: mul
    values: ["@gross_annual", 0.70]
```

**Don't forget**: Variants need their own test vectors too! Run `npm run test:configs` to ensure variant tests pass.

## Formal Schema

The canonical, machine-verified spec is `packages/schema/src/config-types.ts`.
Every exported Zod schema is the source of truth for that section of the config:

| Section | Schema |
|---|---|
| `meta` | `ConfigMetaSchema` |
| `meta.sources[]` | `ConfigSourceSchema` |
| `notices[]` | `NoticeSchema` |
| `inputs` | `InputDefinitionsSchema` / `InputSchema` |
| `parameters` | `ParametersSchema` (flexible, any values) |
| `calculations[]` | `CalculationNodeSchema` (discriminated union on `type`) |
| `outputs` | `OutputDefinitionSchema` |
| Full base config | `TaxConfigSchema` |
| Variant config | `VariantConfigSchema` |

When in doubt about field names, types, or required vs optional — read the schema directly.
The schema validates every config on every `npm run test:configs` run.
