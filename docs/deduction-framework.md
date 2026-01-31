# Tax Deduction Framework Design

## Executive Summary

This document outlines the design of a flexible, extensible framework for modeling tax deductions across different countries. The framework supports the wide variety of deduction schemes found globally while maintaining simplicity and configurability through YAML.

## Research Summary

### Top Tax Deductions by Country

#### Netherlands (Top 3)
1. **Mortgage Interest (Hypotheekrente)**: Max deduction rate 37.48% (2025), 30-year maximum period
2. **Pension/Annuity Contributions (Lijfrente)**: Based on "jaarruimte" (annual allowance) from previous year, with 10-year carry-forward
3. **Healthcare Costs (Specifieke Zorgkosten)**: Only amounts exceeding income-related threshold

#### Other Countries
- **Switzerland**: Pillar 3a pension (CHF 7,258 limit), mortgage interest, pension buy-ins
- **Italy**: Home renovation costs (50% for primary residence, max €96,000, spread over 10 years)
- **Germany**: Work expenses (€1,230 lump sum), craftsman services (20% up to €1,200), childcare (80% up to €4,800)
- **USA**: 401k/IRA contributions, mortgage interest ($750k limit), student loans ($2,500 limit with phase-outs)
- **France**: Actual work expenses (frais réels), childcare (50% up to €1,750/child), charitable donations (66% up to 20% of income)

## Deduction Patterns

From analyzing global tax systems, we identified these common patterns:

### 1. Simple Deductions
Directly reduce taxable income by a fixed or calculated amount.
- Example: Germany's €1,230 work expense lump sum

### 2. Capped Deductions
Deductions with maximum amounts.
- Example: USA student loan interest (max $2,500)
- Example: Swiss Pillar 3a (max CHF 7,258)

### 3. Threshold-Based Deductions
Only amounts above/below a threshold count.
- Example: Netherlands healthcare costs (only amount exceeding income-based threshold)
- Example: France charitable donations (minimum 1% of income for Netherlands)

### 4. Rate-Limited Deductions
Deduction applies at a specific tax rate, not the marginal rate.
- Example: Netherlands mortgage interest (max 37.48% in 2025, regardless of taxpayer's bracket)
- **Critical**: This is different from a tax credit - it still reduces taxable income, but the tax benefit is calculated at a specific rate

### 5. Phase-Out Deductions
Deduction amount reduces based on income level.
- Example: USA IRA deductions (phase-out ranges based on MAGI)

### 6. Percentage-Based Deductions
Deduction is a percentage of expenses.
- Example: Italy renovation costs (50% of expenses up to €96,000)
- Example: Germany craftsman services (20% of labor costs up to €1,200 total credit)

### 7. Carry-Forward Deductions
Unused deduction amounts can be used in future years.
- Example: Netherlands pension contributions (10-year carry-forward of unused "jaarruimte")
- **Note**: Requires external state management, may be out of scope for initial implementation

### 8. Multi-Year Deductions
Deduction is spread across multiple tax years.
- Example: Italy renovation bonus (divided into 10 equal annual installments)
- **Note**: Requires external state management, may be out of scope for initial implementation

### 9. Hybrid Credits (Deduction + Credit)
Some schemes reduce taxable income AND provide a credit.
- Example: Some retirement contributions reduce income AND trigger matching credits

## Framework Design

### Core Concept

We extend the existing `deduction` node type to support these patterns while maintaining backward compatibility. The framework uses a flexible configuration approach where deductions can be composed with various modifiers.

### Enhanced Deduction Node Schema

```yaml
# Basic structure (backward compatible)
- id: simple_deduction
  type: deduction
  amount: 5000  # Fixed amount or reference
  category: deduction
  label: "Standard Deduction"

# With cap
- id: capped_deduction
  type: deduction
  amount: "$calculated_expenses"
  cap: 2500
  category: deduction
  label: "Student Loan Interest"

# With threshold (only amounts exceeding threshold)
- id: threshold_deduction
  type: deduction
  amount: "$healthcare_expenses"
  threshold:
    amount: "$threshold_calculation"  # Reference to calculated threshold
    mode: "above"  # or "below" - deduct only amount above/below threshold
  category: deduction
  label: "Healthcare Costs"

# With percentage reduction (for rate-limited deductions)
- id: mortgage_interest
  type: deduction
  amount: "$annual_mortgage_interest"
  cap: 30_year_limit_calculation  # Can reference another node
  rate_limit: 0.3748  # Max tax benefit rate
  category: deduction
  label: "Mortgage Interest"
  description: "Deduction capped at 37.48% rate for 2025"

# With phaseout
- id: phaseout_deduction
  type: deduction
  amount: "$base_amount"
  phaseout:
    base: "@gross_annual"
    start: 85000
    end: 100000
    mode: "linear"  # or "step"
  category: deduction
  label: "Pension Contribution"

# Percentage of expenses
- id: percentage_deduction
  type: deduction
  amount:
    type: mul
    values: ["@renovation_expenses", 0.50]
  cap: 48000  # 50% of €96,000 max
  category: deduction
  label: "Renovation Costs"
```

### Key Features

1. **`amount`**: Base deduction amount (can be fixed value, reference, or inline calculation)

2. **`cap`**: Maximum deduction amount (optional)

3. **`threshold`**: Only count amounts above/below a threshold (optional)
   - `amount`: The threshold value
   - `mode`: "above" or "below"

4. **`rate_limit`**: For rate-limited deductions, the maximum tax rate at which the deduction provides benefit (optional)
   - This is metadata for UI/calculation purposes
   - Actual implementation depends on how the tax calculation works

5. **`phaseout`**: Reduce deduction based on income (optional)
   - `base`: Reference to income field
   - `start`: Income level where phaseout begins
   - `end`: Income level where deduction is fully phased out
   - `mode`: "linear" or "step"

6. **`percentage`**: For percentage-based deductions (optional, alternative to using inline calc)
   - `base`: Reference to expense amount
   - `rate`: Percentage to deduct

### Backward Compatibility

The existing simple deduction node remains fully functional:
```yaml
- id: old_style
  type: deduction
  amount: 1000
  cap: 5000
```

### New Input Types for Deductions

To support deductions, we need new input fields:

```yaml
inputs:
  # For mortgage interest
  mortgage_interest_paid:
    type: number
    required: false
    min: 0
    label: "Annual Mortgage Interest Paid"
    description: "Interest paid on mortgage for primary residence"

  # For pension contributions
  pension_contributions:
    type: number
    required: false
    min: 0
    label: "Pension/Annuity Contributions"
    description: "Additional pension or annuity contributions (e.g., lijfrente)"

  # For healthcare costs
  healthcare_expenses:
    type: number
    required: false
    min: 0
    label: "Healthcare Expenses"
    description: "Out-of-pocket medical and healthcare costs"

  # For charitable donations
  charitable_donations:
    type: number
    required: false
    min: 0
    label: "Charitable Donations"
    description: "Donations to registered charities"
```

### Output Schema Extension

The breakdown section needs to show deductions:

```yaml
outputs:
  gross: "@gross_annual"
  net: "$net_annual"
  effective_rate: ...
  breakdown:
    taxes:
      - "$income_tax"
    deductions:  # Already supported!
      - "$mortgage_interest_deduction"
      - "$pension_contribution_deduction"
      - "$healthcare_deduction"
    credits:
      - "$general_credit"
```

## Implementation Strategy

### Phase 1: Core Enhancement (Immediate)
1. Extend `deduction` node type with new optional properties
2. Update TypeScript schema in `packages/schema/src/config-types.ts`
3. Implement enhanced deduction evaluator in `packages/engine/src/evaluators.ts`
4. Add comprehensive tests

### Phase 2: Netherlands Implementation (Immediate)
1. Create new inputs for top 3 deductions
2. Implement mortgage interest deduction with rate limit
3. Implement pension contribution deduction with jaarruimte calculation
4. Implement healthcare cost deduction with threshold
5. Create test vectors for each deduction scenario

### Phase 3: Documentation (Immediate)
1. Update DATA_SPEC.md with deduction framework
2. Add examples to CLAUDE.md
3. Create migration guide for existing configs

### Phase 4: Additional Countries (Future)
1. Add deduction examples for other countries
2. Extend framework based on additional edge cases discovered

## Example: Netherlands Mortgage Interest Deduction

```yaml
# In inputs section
inputs:
  mortgage_interest_paid:
    type: number
    required: false
    min: 0
    default: 0
    label: "Annual Mortgage Interest Paid"
    description: "Interest paid on your mortgage for your primary residence"

  mortgage_start_year:
    type: number
    required: false
    min: 1990
    max: 2025
    label: "Year Mortgage Started"
    description: "Year when mortgage was first taken out (for 30-year limit)"

# In parameters section
parameters:
  mortgage_interest_max_rate: 0.3748  # 2025 rate
  mortgage_max_years: 30
  current_year: 2025

# In calculations section
calculations:
  # Check if within 30-year limit
  - id: mortgage_years_elapsed
    type: sub
    values:
      - "$current_year"
      - "@mortgage_start_year"

  - id: mortgage_eligible
    type: conditional
    condition:
      type: lte
      left: "$mortgage_years_elapsed"
      right: "$mortgage_max_years"
    then: 1
    else: 0

  # Calculate deduction amount
  - id: mortgage_interest_deduction
    type: deduction
    amount:
      type: mul
      values:
        - "@mortgage_interest_paid"
        - "$mortgage_eligible"
    rate_limit: "$mortgage_interest_max_rate"
    category: deduction
    label: "Mortgage Interest Deduction"
    description: "Hypotheekrenteaftrek - max 30 years, max 37.48% rate"

  # Adjust taxable income
  - id: taxable_income_after_deductions
    type: sub
    values:
      - "$taxable_income"
      - "$mortgage_interest_deduction"
      - "$pension_contribution_deduction"
      - "$healthcare_deduction"
```

## Example: Netherlands Healthcare Cost Deduction

```yaml
# In inputs section
inputs:
  healthcare_expenses:
    type: number
    required: false
    min: 0
    default: 0
    label: "Healthcare Expenses"
    description: "Out-of-pocket medical and healthcare costs (specifieke zorgkosten)"

# In parameters section
parameters:
  healthcare_threshold_percentage: 0.0175  # Threshold is typically around 1.75% of income

# In calculations section
calculations:
  # Calculate threshold (income-dependent)
  - id: healthcare_threshold
    type: mul
    values:
      - "$taxable_income"
      - "$healthcare_threshold_percentage"

  # Only amounts above threshold are deductible
  - id: healthcare_deduction
    type: deduction
    amount: "@healthcare_expenses"
    threshold:
      amount: "$healthcare_threshold"
      mode: "above"
    category: deduction
    label: "Healthcare Cost Deduction"
    description: "Specifieke zorgkosten - only amounts above threshold"
```

## Example: Netherlands Pension Contribution

```yaml
# In inputs section
inputs:
  pension_contributions:
    type: number
    required: false
    min: 0
    default: 0
    label: "Pension/Annuity Contributions"
    description: "Additional pension or annuity contributions (lijfrente)"

  jaarruimte_available:
    type: number
    required: false
    min: 0
    default: 0
    label: "Available Jaarruimte"
    description: "Your available annual allowance for pension deductions from previous year"

# In calculations section
calculations:
  # Deduction capped by jaarruimte
  - id: pension_contribution_deduction
    type: deduction
    amount: "@pension_contributions"
    cap: "@jaarruimte_available"
    rate_limit: 0.3748  # Same as mortgage interest max rate
    category: deduction
    label: "Pension Contribution Deduction"
    description: "Lijfrente - capped by annual allowance (jaarruimte)"
```

## Technical Considerations

### 1. Rate-Limited Deductions

Rate-limited deductions (like Netherlands mortgage interest at 37.48%) require special handling:

**Option A: Metadata Only**
- Store `rate_limit` as metadata
- Display in UI: "This deduction provides tax benefit at maximum 37.48%"
- Actual calculation happens normally (deduction reduces taxable income)
- User understands they don't get benefit at their marginal rate

**Option B: Convert to Effective Credit**
- Calculate: `credit = deduction_amount * rate_limit`
- But this breaks the "deduction" semantic
- Not recommended

**Recommendation**: Use Option A - treat as metadata for UI/documentation purposes.

### 2. Threshold Calculations

The evaluator needs to handle threshold logic:

```typescript
// In evaluators.ts
function evaluateDeduction(node: DeductionNode, context: CalculationContext): number {
  let amount = resolveValue(node.amount, context);

  // Apply threshold if specified
  if (node.threshold) {
    const thresholdAmount = resolveValue(node.threshold.amount, context);
    if (node.threshold.mode === 'above') {
      amount = Math.max(0, amount - thresholdAmount);
    } else if (node.threshold.mode === 'below') {
      amount = Math.min(amount, thresholdAmount);
    }
  }

  // Apply cap if specified
  if (node.cap !== undefined) {
    const capAmount = resolveValue(node.cap, context);
    amount = Math.min(amount, capAmount);
  }

  // Apply phaseout if specified
  if (node.phaseout) {
    const income = resolveValue(node.phaseout.base, context);
    const phaseoutFactor = calculatePhaseout(income, node.phaseout);
    amount = amount * phaseoutFactor;
  }

  return Math.max(0, amount);  // Never negative
}
```

### 3. Integration with Tax Calculation

Deductions reduce taxable income BEFORE tax calculation:

```yaml
calculations:
  # Base income
  - id: gross_income
    type: identity
    value: "@gross_annual"

  # All deductions
  - id: total_deductions
    type: sum
    values:
      - "$mortgage_interest_deduction"
      - "$pension_contribution_deduction"
      - "$healthcare_deduction"

  # Reduced taxable income
  - id: taxable_income
    type: sub
    values:
      - "$gross_income"
      - "$total_deductions"

  # Tax on reduced income
  - id: income_tax
    type: bracket_tax
    base: "$taxable_income"
    brackets: "$income_tax_brackets"
```

## Benefits of This Framework

1. **Flexible**: Supports all major deduction patterns globally
2. **Composable**: Can combine threshold, cap, and phaseout
3. **Backward Compatible**: Existing configs continue to work
4. **Declarative**: Pure YAML configuration, no code changes needed
5. **Type-Safe**: TypeScript types ensure correctness
6. **Testable**: Each deduction can have dedicated test vectors

## Future Enhancements

### Carry-Forward Support (Out of Scope)
Requires state management across tax years:
- Store unused deduction amounts
- Track expiration (e.g., 10-year carry-forward)
- Would need database/state storage

### Multi-Year Deductions (Out of Scope)
Requires splitting deduction across multiple years:
- Italy's 10-year renovation bonus
- Would need to track original expense and remaining years
- Requires external state management

### Conditional Deductions
Some deductions depend on employment status, family situation, etc:
- Can be handled with existing `conditional` nodes
- May need additional input fields

## Migration Path

1. **Existing Configs**: No changes required
2. **New Features**: Opt-in by adding new properties
3. **Documentation**: Update examples and guides
4. **Testing**: Each new feature requires test vectors

## Conclusion

This framework provides a robust, flexible foundation for modeling tax deductions across countries. It handles the most common patterns while remaining simple and maintainable. The phased implementation approach allows us to deliver value incrementally while minimizing risk.
