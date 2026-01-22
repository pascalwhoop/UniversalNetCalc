---
name: add-new-country
description: |
  Create YAML tax configurations for new countries in the universal salary calculator.
  Use when: (1) Adding a new country to the calculator, (2) Adding a new tax year for existing country,
  (3) Creating variant configs (expat regimes, special tax rules), (4) Writing test vectors for configs.
  Triggers: "add country", "create config for", "new tax year", "add variant", "30% ruling config", etc.
---

# Add New Country Configuration

## Workflow

1. **Research** - Gather official tax rates, brackets, contributions, credits
2. **Plan** - Identify complexity level and required nodes
3. **Implement** - Create base.yaml with all calculations
4. **Test** - Write test vectors and validate against official calculators
5. **Document** - Add sources and notices

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

### Step 2: Assess Complexity

| Level | Characteristics | Approach |
|-------|-----------------|----------|
| Simple | No income tax or flat tax (UAE, SG, HK) | Pure YAML, minimal nodes |
| Moderate | Progressive brackets + contributions (NL, AU, IE, UK) | Pure YAML |
| High | Multi-level regions or special calculations (CH, US) | YAML + lookups |
| Complex | Income splitting, family quotient (DE, FR) | Use `function` node |

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

```json
{
  "name": "Single at median income",
  "inputs": {
    "gross_annual": 60000,
    "filing_status": "single"
  },
  "expected": {
    "net": 45000,
    "effective_rate": 0.25
  },
  "tolerance": 50,
  "sources": [{
    "description": "Verified against official calculator",
    "url": "https://...",
    "date": "2024-01-01"
  }]
}
```

### Step 5: Validate

- [ ] All `@` and `$` references resolve
- [ ] Every breakdown node has `category` and `label`
- [ ] Sources documented with URLs and dates
- [ ] Test vectors pass within tolerance
- [ ] Notices guide users on country-specific input conventions

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

## Detailed Specification

See [references/DATA_SPEC.md](references/DATA_SPEC.md) for:
- Complete node type reference
- All input types and options
- Bracket table formats
- Overlay merge rules
- Validation requirements
