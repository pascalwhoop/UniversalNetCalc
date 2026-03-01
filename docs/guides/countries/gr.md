# Greece (GR) - Tax Configuration Guide

## Overview

Greece uses a progressive income tax system with 6 brackets (from 2026), combined with social security contributions through the unified EFKA system. The solidarity contribution was abolished in 2023 and no longer applies.

**Key 2026 changes (Law 5246/2025):**
- New 6-bracket tax scale with a new 39% bracket for EUR 40,001-60,000
- Reduced rates across brackets (20% vs 22%, 26% vs 28%, 34% vs 36%)
- Child-dependent reduced rates for first two brackets
- Under-25 zero-rate on first EUR 20,000 (not modeled)
- Age 26-30 reduced 9% rate on second bracket (not modeled)

## Tax System Components

### 1. Income Tax (Forologhia Eisodimatos)

Progressive brackets for employment income (2026, no children):

| Bracket | Rate |
|---------|------|
| EUR 0 - 10,000 | 9% |
| EUR 10,001 - 20,000 | 20% |
| EUR 20,001 - 30,000 | 26% |
| EUR 30,001 - 40,000 | 34% |
| EUR 40,001 - 60,000 | 39% |
| EUR 60,001+ | 44% |

#### Child-dependent rates (first 3 brackets only)

| Children | 1st bracket | 2nd bracket | 3rd bracket |
|----------|------------|------------|------------|
| 0 | 9% | 20% | 26% |
| 1 | 9% | 18% | 24% |
| 2 | 9% | 16% | 22% |
| 3+ | 9% | 9% | 20% |

Brackets 4-6 (34%, 39%, 44%) are the same regardless of children.

### 2. Personal Tax Credit (Meion Forou)

A tax credit that reduces income tax liability:

| Status | Credit Amount |
|--------|--------------|
| No children | EUR 777 |
| 1 child | EUR 900 |
| 2 children | EUR 1,120 |
| 3 children | EUR 1,340 |
| 4 children | EUR 1,580 |
| 5 children | EUR 1,780 |

**Phaseout:** Reduced by EUR 20 per EUR 1,000 of income above EUR 12,000.
- At EUR 12,000 income: full credit
- At EUR 50,850 income: credit fully phased out (for single/no children)
- The credit cannot exceed the tax liability (non-refundable)

### 3. Social Security (EFKA)

Employee contribution rate: **13.37%** (after 2025 reduction)

Breakdown:
- Main Pension (IKA): 6.67%
- Supplementary Pension: 3.00%
- Healthcare (EOPYY): 2.15%
- Other (unemployment, etc.): 1.55%

**Monthly cap:** EUR 7,761.94 (annual EUR 93,143.28)

Employer rate: 21.79% (not included in employee calculator)

#### Important: EFKA NOT Tax-Deductible

In Greece, EFKA contributions are **NOT deducted from your taxable income** for income tax purposes. This is a key difference from many other European countries (Spain, Italy, Portugal, Finland, etc.). Both income tax and EFKA are independent, parallel deductions calculated on the same gross salary.

Example: An employee earning EUR 30,000 has:
- Income tax: calculated on EUR 30,000 (full gross) → EUR 5,083
- EFKA: calculated on EUR 30,000 (full gross) → EUR 4,011
- Net: EUR 30,000 - EUR 5,083 - EUR 4,011 = EUR 20,906

This is correct per Greek law and how the calculator works.

### 4. Solidarity Contribution

**Abolished since January 1, 2023** (Law 4972/2022). No longer applies to any income type.

## Special Tax Regimes

### Article 5C - 50% Income Tax Exemption

The most relevant special regime for expat salary calculator users.

**What it does:** 50% exemption from income tax on employment/business income earned in Greece for 7 years.

**Eligibility:**
- Not a Greek tax resident for 5 of the 6 years (or 7 of 8 years) before application
- Transfer tax residence to Greece
- Work in Greece via employment contract or business activity
- From EU/EEA country or country with tax cooperation agreement
- Employment must fill a "new job position"
- Declare intention to stay at least 2 years

**How it works:**
- Only 50% of Greek-source employment income is subject to income tax
- Social security (EFKA) still applies on full gross salary
- Tax credit phaseout operates on full gross income, not reduced taxable income
- Duration: 7 consecutive tax years, no extension

**Implementation:** Variant `article-5c` overrides `taxable_income` to multiply gross by 0.50.

### Article 5A - Non-Dom Flat Tax (Not Implemented)

For high-net-worth individuals: flat EUR 100,000 annual tax on foreign income. Not relevant for salary calculator (applies to foreign-source income only).

### 7% Flat Tax for Foreign Pensioners (Not Implemented)

For foreign pensioners transferring residence to Greece. Not relevant for employment income calculator.

### Digital Nomad Visa (Not Implemented)

Greece offers a digital nomad visa, but it does not provide a special tax regime. Digital nomads who become tax residents are taxed under standard rules (or may qualify for Article 5C if eligible).

## Configuration Details

### Files

```
configs/gr/2026/
  base.yaml                          # Base Greek tax config
  variants/
    article-5c.yaml                  # 50% income tax exemption variant
  tests/
    very-low-income.json             # EUR 10,000 single
    low-income-single.json           # EUR 15,000 single
    median-income-single.json        # EUR 30,000 single
    high-income-single.json          # EUR 80,000 single
    very-high-income-efka-cap.json   # EUR 120,000 (above EFKA cap)
    median-income-one-child.json     # EUR 30,000 with 1 child
    low-income-three-children.json   # EUR 18,000 with 3+ children
    article-5c-median.json           # EUR 30,000 Article 5C
    article-5c-high-income.json      # EUR 60,000 Article 5C
```

### Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `gross_annual` | number | yes | - | Annual gross salary including 13th/14th month |
| `filing_status` | enum | yes | single | Family status (single, one_child, two_children, three_children) |

### Calculation Flow

1. `taxable_income` = gross annual (identity)
2. `income_tax_gross` = bracket_tax based on filing_status (selects appropriate bracket set)
3. `base_tax_credit` = switch on filing_status (777/900/1120/1340)
4. `income_above_phaseout` = max(0, gross - 12,000)
5. `phaseout_reduction` = income_above_phaseout * 0.02
6. `tax_credit` = max(0, base_tax_credit - phaseout_reduction)
7. `income_tax` = max(0, income_tax_gross - tax_credit)
8. `efka_base` = min(gross, 93,143.28)
9. `efka_employee` = efka_base * 13.37%
10. `net_annual` = gross - income_tax - efka_employee

### Article 5C Variant Overrides

- `taxable_income` = gross * 0.50 (only override)
- All other calculations flow naturally from the reduced taxable income

## Limitations & Not Modeled

1. **Age-based exemptions**: Under-25 (0% on first EUR 20,000) and 26-30 (9% on second bracket) not modeled
2. **4+ children brackets**: Only modeled up to 3+ children (4+ and 5+ have progressively lower rates)
3. **Electronic payment deduction**: 30% deduction on certain electronic payments (max EUR 5,000) not modeled
4. **Article 5A Non-Dom regime**: EUR 100,000 flat tax on foreign income not relevant for salary calculator
5. **Foreign pensioner 7% regime**: Not relevant for employment income
6. **Municipal/regional taxes**: Greece does not have significant municipal income taxes for employees
7. **13th/14th month bonuses**: Calculator expects the full annual total as input; does not split into monthly payments

## Sources

1. [Ministry of Finance - Income Taxation](https://minfin.gov.gr/en/tax-policy/tax-guide/income-taxation/) - Official 2026 tax scale
2. [KPMG Flash Alert 2025-277](https://kpmg.com/xx/en/our-insights/gms-flash-alert/flash-alert-2025-277.html) - Law 5246/2025 changes
3. [PwC Tax Summaries - Personal Income](https://taxsummaries.pwc.com/greece/individual/taxes-on-personal-income) - 2026 brackets
4. [PwC Tax Summaries - Other Taxes](https://taxsummaries.pwc.com/greece/individual/other-taxes) - EFKA rates and cap
5. [PwC Tax Summaries - Deductions](https://taxsummaries.pwc.com/greece/individual/deductions) - Tax credit details
6. [Grant Thornton - Expatriate Tax Greece](https://www.grantthornton.global/en/insights/articles/expatriate-tax-Greece/) - 2026 confirmation
7. [TaxLaw.gr - Article 5C](https://www.taxlaw.gr/en/practice-areas/tax-law/5c-tax-regime-special-regime-of-taxation-for-income-from-employment-and-business-activity-earned-in-greece-by-individuals-who-transfer-their-tax-residence-to-greece/) - 5C regime details
8. [Greek Ministry of Labour](https://ypergasias.gov.gr/en/social-security/insured-persons/insurance-contributions/) - EFKA contribution rates
