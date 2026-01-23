# Country Tax Research

Research comprehensive tax systems for internationally mobile workers and create standardized documentation.

## Purpose

This skill guides the research and documentation of a country's tax system with focus on:
- Income tax structure and brackets
- Mandatory social contributions
- Expat-specific tax regimes and benefits
- Regional variations (states/provinces/municipalities)
- Tax residency rules
- Practical implementation guidance

The output is a comprehensive markdown guide that can be rendered in the web application and used as source material for creating tax calculator configurations.

## When to Use

Use this skill when:
- Adding a new country to the tax calculator
- Researching tax systems for internationally mobile workers
- Creating documentation for expat tax considerations
- Updating existing country guides with new tax year data

## Research Methodology

### 1. Executive Summary (First Section)

Create an overview containing:
- Country name and tax year covered
- Brief description of tax system complexity
- Top-line effective tax rates at 3 income levels (low, median, high)
- Key expat benefits summarized in 2-3 bullet points
- Table of contents

**Example:**
```markdown
# [Country] Tax System: [Year]

This guide covers [Country]'s tax system for the [year] tax year, with focus on considerations for internationally mobile workers.

**System Complexity**: [Low/Medium/High]

**Effective Tax Rates** (typical scenarios):
- Low income (€30,000): ~15-20%
- Median income (€50,000): ~25-30%
- High income (€100,000): ~35-40%

**Key Features for Expats**:
- [Special regime name]: [Brief benefit description]
- [Other consideration]

[Table of contents]
```

### 2. Income Tax Structure

Research and document:
- **Tax brackets**: Exact thresholds and rates for current year
- **Tax base**: Gross income, adjusted gross, taxable income
- **Calculation method**: How brackets apply (marginal vs flat)
- **Recent changes**: Any reforms or updates in past 2 years
- **Future changes**: Scheduled reforms for next 1-2 years

Include:
- Complete bracket table with currency-specific formatting
- Explanation of how brackets are applied
- Any additional levies or surcharges (solidarity tax, etc.)

**Example:**
```markdown
## 2. Income Tax Structure

[Country] uses a progressive income tax system with [X] brackets:

| Taxable Income    | Rate | Marginal Tax on Band |
| ----------------- | ---- | -------------------- |
| €0 - €15,000      | 10%  | €1,500               |
| €15,001 - €50,000 | 20%  | €7,000               |
...

### Calculation Method
[Explanation of how tax is calculated]

### Recent Changes
[Any 2024-2025 reforms]
```

### 3. Social Contributions

Research ALL mandatory payroll deductions:
- **Pension/retirement**: Employee + employer rates
- **Health insurance**: Rates and income caps
- **Unemployment insurance**: Rates and caps
- **Other mandatory**: Disability, parental leave, etc.
- **Income caps**: Maximum contribution bases
- **Exemptions**: Any groups exempt from certain contributions

Provide:
- Complete table with employee and employer portions
- Annual maximum contributions
- Whether employer portion is visible to employee
- Differences for expats vs citizens (if any)

**Example:**
```markdown
## 3. Social Contributions

| Contribution Type | Employee Rate | Employer Rate | Cap/Max         |
| ----------------- | ------------- | ------------- | --------------- |
| National Pension  | 4.5%          | 4.5%          | Monthly cap: $X |
| Health Insurance  | 3.5%          | 3.5%          | No cap          |
...

**Total Employee Contribution**: ~[X]% (uncapped) or $[Y] maximum

**Expat Considerations**:
- [Any exemptions or special rules]
```

### 4. Expat-Specific Tax Regimes

THIS IS CRITICAL - Research thoroughly:
- **Official name**: Local language + English translation
- **Benefit**: Exact tax advantage (flat rate, exemption percentage, etc.)
- **Duration**: How many years available
- **Eligibility criteria**:
  - Income threshold (if any)
  - Prior residency requirements
  - Job type restrictions
  - Application process and deadlines
- **Trade-offs**: What deductions/credits are forfeited
- **Concrete savings example**: Calculate tax savings vs standard system

**Example:**
```markdown
## 4. Special Tax Regime for Foreign Workers: [Regime Name]

### Overview
The [local name] ([English translation]) is a special tax regime offering [benefit description] for up to [X] years.

### Eligibility
- Minimum salary: [amount]
- Not a tax resident in past [X] years
- Must apply within [X] months of starting work
- Qualifying professions: [list or "all employment income"]

### Tax Treatment
- **Flat rate**: [X]% on employment income up to [cap]
- **Foreign income**: [Exempt/Taxed/Conditional]
- **Deductions forfeited**: [List]

### Calculation Example
**Scenario**: [Income level] salary under standard vs special regime

Standard System:
- Gross: [amount]
- Income tax: [amount] ([X]%)
- Social: [amount] ([X]%)
- Net: [amount] ([X]%)

Special Regime:
- Gross: [amount]
- Income tax: [amount] ([X]%)
- Social: [amount] ([X]%)
- Net: [amount] ([X]%)

**Annual savings: [amount] ([X] percentage points)**
```

### 5. Deductions, Credits, and Allowances


Document standard deductions available:
- **Personal allowance**: Basic tax-free amount
- **Standard deductions**: Automatic deductions (employment expenses, etc.)
- **Dependent deductions**: Spouse, children, elderly parents
- **Common credits**: Work credits, low-income credits
- **Phase-outs**: Income levels where benefits reduce

Clarify:
- Whether these are deductions (reduce taxable income) or credits (reduce tax owed)
- How they interact with expat regimes
- Whether available to non-residents

### 6. Regional Variations

If applicable, research:
- **States/provinces/cantons**: Which level has taxation power
- **Rate variations**: Range of rates across regions
- **Major cities**: Specific rates for key expat destinations
- **Impact**: How much difference can region make (percentage points)

For countries with significant variations:
- Provide table of rates for top 5-10 regions
- Calculate example showing tax difference between highest and lowest
- Note if employer location or residence location determines region

**Example:**
```markdown
## 6. Regional Variations

[Country] has significant cantonal variation:

| Canton | Municipal Rate | Total Effective Rate |
| ------ | -------------- | -------------------- |
| Zug    | 22.8%          | ~29% (lowest)        |
| Geneva | 45.5%          | ~43% (highest)       |
...

**Example**: €100,000 income
- In Zug: Net €71,000
- In Geneva: Net €57,000
- **Difference: €14,000 (14 percentage points)**
```

### 7. Tax Residency Rules

Document how someone becomes tax resident:
- **Day count test**: 183 days or other threshold
- **Permanent home test**: Having residence in country
- **Economic ties test**: Center of vital interests
- **Combinations**: How tests interact
- **Treaty overrides**: When tax treaties supersede domestic rules
- **Departure rules**: How to cease residency

Provide practical examples for common expat scenarios:
- Short-term assignment (< 183 days)
- Long-term assignment (> 183 days)
- Relocating with family
- Remote worker

### 8. Detailed Calculation Examples

Provide 3-4 complete calculations:
- **Low income** (around 50th percentile): Step-by-step
- **Median income** (around 75th percentile): Step-by-step
- **High income** (top 10%): Step-by-step
- **Expat regime** (if applicable): Comparison

Each example should show:
1. Gross income
2. Social contributions calculation
3. Taxable income derivation
4. Tax calculation by bracket
5. Credits/deductions applied
6. Net income
7. Effective tax rate

**Format:**
```markdown
### Example 1: [Income level] Income - [Amount]

**Assumptions**: [Filing status, region, standard deductions]

**Step 1: Gross Income**
Annual gross: [amount]

**Step 2: Social Contributions**
- Pension: [calculation] = [amount]
- Health: [calculation] = [amount]
- Total: [amount]

**Step 3: Taxable Income**
Gross: [amount]
Less: [deduction]: [amount]
Taxable income: [amount]

**Step 4: Income Tax**
- [Bracket 1]: [calculation] = [amount]
- [Bracket 2]: [calculation] = [amount]
Total income tax: [amount]

**Step 5: Tax Credits**
- [Credit type]: [amount]
Final income tax: [amount]

**Step 6: Net Income**
Gross: [amount]
Less: Income tax: [amount]
Less: Social contributions: [amount]
**Net income: [amount]**

**Effective tax rate**: [X]%
```

### 9. Official Sources

List ALL sources used with full URLs:
- **Primary sources** (government agencies):
  - Tax authority official website
  - Social security administration
  - Official tax rate publications
- **Professional sources**:
  - PWC Tax Summaries
  - KPMG tax guides
  - Deloitte expat tax guides
- **Tertiary sources**:
  - Expat-focused websites (verify against official sources)
  - Tax calculator tools (for validation)

Format as numbered list with hyperlinks:
```markdown
## 9. Official Sources

### Government Sources
1. [Agency Name - Page Title](URL) - [Brief description]
2. ...

### Professional Tax Guides
1. [PWC Tax Summaries: Country](URL)
2. ...

### Additional Resources
1. ...
```

### 10. Implementation Notes

Provide guidance for creating tax configs:
- **Required inputs**: List all inputs needed (gross, region, filing status, etc.)
- **Optional inputs**: Age, dependents, special elections
- **Calculation flow**: High-level steps for computation
- **Node types needed**: Which calculation primitives to use
- **Variants recommended**: Base + expat regime + regional variants
- **Test vectors**: Suggested test scenarios
- **Edge cases**: Tricky situations to handle
- **Rounding considerations**: How to handle rounding
- **Annual updates**: What changes each year

**Example:**
```markdown
## 10. Implementation Notes for Tax Calculator

### Required Inputs
- `gross_annual`: Annual gross salary (number)
- `region`: Canton selection (dropdown: ZH, GE, ZG, ...)
- `age`: Age of employee (affects certain contributions)

### Optional Inputs
- `filing_status`: Single, married (affects allowances)
- `expert_tax_eligible`: Boolean for expat regime

### Calculation Flow
1. Calculate social contributions from gross
2. Derive taxable income (gross - deductions)
3. Apply federal tax brackets
4. Apply cantonal tax rate
5. Sum taxes and contributions
6. Calculate net income

### Suggested YAML Structure
[High-level config structure]

### Test Vectors Needed
1. Low income (CHF 50k) in Zurich
2. Median income (CHF 80k) in Geneva
3. High income (CHF 150k) in Zug
4. Expert tax regime (CHF 120k) in Zurich
5. High income with social caps (CHF 300k)

### Edge Cases
- Income above social contribution caps
- Multiple cantons (move mid-year)
- Expert tax interaction with credits

### Annual Updates
- Federal tax brackets (adjust for inflation)
- Cantonal rates (check October of prior year)
- Social contribution caps (published January)
- Expert tax threshold (adjusted annually)
```

## Output Format

Save the research document as:
- **Location**: `/public/guides/countries/[country-slug].md`
- **Naming**: Use lowercase, hyphenated country name (e.g., `south-korea.md`, `new-zealand.md`)
- **Metadata**: Include year range in title (e.g., "2024-2025" or "2025")

## Quality Checklist

Before completing research, verify:

- [ ] All tax brackets with exact thresholds and rates documented
- [ ] All mandatory social contributions researched (pension, health, unemployment, etc.)
- [ ] Expat-specific tax regimes thoroughly explained with eligibility and benefits
- [ ] At least 3 calculation examples provided with step-by-step breakdowns
- [ ] Regional variations documented (if applicable)
- [ ] Tax residency rules clearly explained with practical scenarios
- [ ] Minimum 15 official sources cited with URLs
- [ ] Implementation guidance provided for config creation
- [ ] Test vector scenarios suggested
- [ ] Document is 15,000+ words (comprehensive coverage)

## Tips for Effective Research

1. **Start with official sources**: Always use government tax authority websites as primary source
2. **Cross-reference**: Verify rates with multiple sources (PWC, KPMG, official sites)
3. **Focus on expat benefits**: These are often the deciding factor for mobile workers
4. **Use current tax year**: Prioritize 2024-2025 data, note if using 2023-2024
5. **Show your work**: Include calculation steps, don't just state final numbers
6. **Think implementation**: Consider how the system will be coded as you research
7. **Be thorough**: 20-30 pages of documentation is normal for complex systems

## Example: Using This Skill

To research a new country:

```
User: "Research the tax system for Finland with focus on expat considerations"