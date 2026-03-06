# Tax Bracket Discontinuities: Detection and Prevention

## The Problem

Tax discontinuities occur when tax calculations create impossible marginal tax rates (>100% or <0%). The most common cause is applying a **flat tax rate to the entire income based on bracket thresholds**, instead of using **progressive brackets**.

### Real Example: Swiss Cantonal Tax (Before Fix)

```yaml
# WRONG: Flat rate applied to entire income
cantonal_municipal_tax:
  type: mul
  values:
    - "@gross_annual"
    - "$cantonal_rate"  # Switches between 8%, 12%, 15% based on income level
```

**At CHF 150,000 threshold:**
- Income CHF 150,000: 150,000 × 0.12 = CHF 18,000
- Income CHF 150,001: 150,001 × 0.15 = CHF 22,500
- **Marginal rate: (22,500 - 18,000) / 1 = 4,500 = 450,000%** ❌

This creates a cliff where every additional franc in that range is taxed at 450,000%.

### Why Tests Didn't Catch This

The original tests only checked:
1. ✓ Net income matches expected value
2. ✓ Effective rate matches expected value
3. ✓ Breakdown items match expected values

They did NOT check:
- ✗ Marginal rates between income levels
- ✗ Continuity of tax calculation at bracket boundaries

A test vector at exactly CHF 150,000 won't reveal the discontinuity—you need to compare CHF 150,000 vs CHF 150,001 to see the spike.

## The Solution

Use **progressive brackets** where taxes apply only to income within each bracket:

```yaml
# CORRECT: Progressive brackets
cantonal_municipal_tax:
  type: bracket_tax
  base: "@gross_annual"
  brackets:
    - threshold: 0
      rate: 0.08      # 8% on income from 0 to 50k
    - threshold: 50000
      rate: 0.12      # 12% on income from 50k to 150k
    - threshold: 150000
      rate: 0.15      # 15% on income above 150k
```

**At CHF 150,000 threshold:**
- Income CHF 150,000: (50k × 0.08) + (100k × 0.12) = CHF 16,000
- Income CHF 150,001: (50k × 0.08) + (100k × 0.12) + (1 × 0.15) = CHF 16,000.15
- **Marginal rate: (16,000.15 - 16,000) / 1 = 0.15 = 15%** ✓

The transition is smooth.

## Detection: Marginal Rate Validation Test

The test suite includes `Marginal Rate Validation` tests that:

1. Calculate taxes at 5 income levels for each test vector:
   - Base income (from test vector)
   - Base + 1%
   - Base + 5%
   - Base + 10%
   - Base + 20%

2. Compute marginal rates between each pair:
   ```
   marginal_rate = 1 - (net_increase / gross_increase)
   ```

3. Validate that marginal rates are physically possible:
   - 0% ≤ marginal_rate ≤ 100% (with small tolerance for rounding)
   - If > 100%: discontinuous jump detected
   - If < 0%: net income increased more than gross (violation)

### Example Test Output

```
✓ ch/2026 - Marginal rates for Single filer at median income in Zürich (2026)
✗ ch/2024 - Marginal rates for Married filers at high income in Zug (low-tax canton)
  Impossible marginal rate of 220.6% detected between 150000 and 151500 CHF.
  This indicates a discontinuous tax calculation - likely a flat rate applied to
  entire income instead of progressive brackets.
```

## Configuration Patterns to Avoid

### ❌ Anti-Pattern 1: Flat Rate on Entire Income

```yaml
- id: cantonal_tax
  type: mul
  values:
    - "@gross_annual"
    - type: switch
      on: "@filing_status"
      cases:
        single:
          type: conditional
          condition:
            type: gt
            left: "@gross_annual"
            right: 150000
          then: 0.15
          else: 0.12
```

**Problem:** The entire income is multiplied by the rate. At the boundary, the rate switches, creating a discontinuity.

### ❌ Anti-Pattern 2: Multi-Rate Calculation Without Bracketing

```yaml
- id: low_income_tax
  type: mul
  values: ["$income_0_to_50k", 0.08]
- id: mid_income_tax
  type: mul
  values: ["$income_50k_to_150k", 0.12]
- id: high_income_tax
  type: mul
  values: ["$income_above_150k", 0.15]
```

**Problem:** Income allocation between buckets may be off by one, or missing portions.

### ✓ Correct Pattern: Use bracket_tax Node

```yaml
- id: cantonal_tax
  type: bracket_tax
  base: "@gross_annual"
  brackets:
    - threshold: 0
      rate: 0.08
    - threshold: 50000
      rate: 0.12
    - threshold: 150000
      rate: 0.15
```

**Why this works:** The `bracket_tax` evaluator correctly allocates income to brackets and applies marginal rates.

## Bracket Tax Node Reference

The `bracket_tax` node type automatically:
1. Determines which bracket(s) apply to the base income
2. Allocates income to each bracket up to the next threshold
3. Applies the rate only to income within that bracket
4. Sums all bracket contributions

See `packages/schema/src/config-types.ts` for the TypeScript definition.

## When Discontinuities Are Acceptable

There are rare cases where discontinuities are legitimately part of tax law:

1. **Income cliffs in benefit phase-outs:** A credit disappears entirely at an income threshold
2. **Categorical tax regimes:** Different taxpayer categories taxed completely separately
3. **System changes:** A config changes eligibility rules

However:
- These should be clearly documented in the config
- They should be tested explicitly (add a separate test vector crossing the boundary)
- The test vector should have a large tolerance to acknowledge the discontinuity

Example:
```json
{
  "name": "Income cliff: credit disappears at 100k",
  "inputs": {"gross_annual": 99999},
  "expected": {"net": 70000},
  "tolerance": 1000,
  "tolerance_percent": 0.10,
  "notes": "This test documents a deliberate discontinuity in law where the €5,000 credit disappears entirely at €100,000 income"
}
```

## Debugging Detected Discontinuities

If the marginal rate validation test fails:

1. **Find the exact threshold** where the spike occurs
   - The error message will say something like "between 150000 and 151500 CHF"

2. **Check the config** for that country/year at that income range
   - Look for `switch` nodes that change rates based on income
   - Look for `mul` nodes that multiply entire income by conditional rates
   - Look for conditional logic around that income level

3. **Apply the fix:**
   - Replace flat-rate logic with `bracket_tax`
   - Or, if the discontinuity is intentional, add a test vector that explicitly documents it

4. **Test the fix:**
   - Rerun the marginal rate validation test
   - Run the full config test suite to ensure no other changes broke

## Monitoring

The test suite automatically validates all configs for discontinuities on every test run. To run just the marginal rate tests:

```bash
npm run test:configs -- --grep "Marginal Rate Validation"
```

To run all config tests:

```bash
npm run test:configs
```

To see which countries currently have known discontinuity bugs:

```bash
npm run test:configs 2>&1 | grep "Impossible marginal rate"
```
