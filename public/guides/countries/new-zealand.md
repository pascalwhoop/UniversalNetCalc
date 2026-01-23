# New Zealand Tax System Research
## For Internationally Mobile Workers

**Research Date:** January 23, 2026
**Tax Years Covered:** 2024-25 and 2025-26
**Target Audience:** Universal Gross-to-Net Salary Calculator Implementation

---

## Executive Summary

New Zealand operates one of the simplest tax systems among developed nations, characterized by:

- **Uniform national tax system** with no state/provincial/regional variations
- **Progressive PAYE income tax** with 5 brackets (10.5% to 39%)
- **ACC earners levy** as the only mandatory payroll contribution (1.60% for 2024-25, 1.67% for 2025-26)
- **No social security contributions** for pension, unemployment, or health insurance
- **Straightforward tax residency rules** (183-day test or permanent place of abode)
- **Limited tax credits** (primarily Independent Earner Tax Credit)

This simplicity makes New Zealand an excellent candidate for the Universal Salary Calculator and a good reference point for comparing against more complex systems.

---

## 1. Income Tax Structure (PAYE)

### 1.1 Tax Year Definition

New Zealand's tax year runs from **1 April to 31 March** of the following year.

### 1.2 PAYE Tax Brackets

#### 2025-26 Tax Year (from 1 April 2025)

| Taxable Income (NZD) | Tax Rate | Tax on Band |
|---------------------|----------|-------------|
| $0 - $15,600 | 10.5% | $1,638 |
| $15,601 - $53,500 | 17.5% | $6,632.50 |
| $53,501 - $78,100 | 30.0% | $7,380 |
| $78,101 - $180,000 | 33.0% | $33,627 |
| $180,001+ | 39.0% | (marginal) |

**Key Change:** The Budget 2024 tax reforms, effective from 31 July 2024, simplified the tax bracket structure by removing intermediate thresholds and reducing effective rates for low and middle-income earners.

#### 2024-25 Tax Year (1 April 2024 - 31 March 2025)

This tax year had a **transitional structure** due to mid-year tax reforms on 31 July 2024:

**Before 31 July 2024:**
- Used the old 2023-24 tax bracket structure

**After 31 July 2024:**
- Transitioned to new simplified brackets (shown above for 2025-26)

The annual tax calculation for 2024-25 requires **pro-rating** between the old and new structures, though for calculator purposes, we should use the new structure since the reforms applied for the majority of the year.

### 1.3 Official Sources

- [Inland Revenue: Tax rates for individuals](https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals)
- [PwC Tax Summaries: New Zealand - Individual taxes](https://taxsummaries.pwc.com/new-zealand/individual/taxes-on-personal-income)

---

## 2. ACC Earners Levy

### 2.1 Overview

The **Accident Compensation Corporation (ACC)** levy is New Zealand's mandatory injury insurance scheme. All workers pay a levy that provides no-fault accident compensation coverage, replacing the right to sue for personal injury.

**Key Characteristics:**
- Flat percentage rate applied to gross earnings
- Maximum liable earnings cap (levy not charged above this amount)
- Covers work and non-work injuries
- No separate employer/employee split (earners levy is paid by employee)
- Rate includes GST

### 2.2 Current Rates

#### 2024-25 Tax Year (1 April 2024 - 31 March 2025)
- **Rate:** 1.60% ($1.60 per $100 of earnings)
- **Maximum liable earnings:** $142,283
- **Maximum levy:** $2,276.53

#### 2025-26 Tax Year (1 April 2025 - 31 March 2026)
- **Rate:** 1.67% ($1.67 per $100 of earnings)
- **Maximum liable earnings:** $152,790
- **Maximum levy:** $2,551.59

### 2.3 Calculation Example

For an annual salary of $100,000 in 2025-26:
```
ACC Levy = $100,000 × 1.67% = $1,670
```

For an annual salary of $200,000 in 2025-26:
```
ACC Levy = $152,790 × 1.67% = $2,551.59 (capped)
```

### 2.4 Official Sources

- [Inland Revenue: ACC earners levy rates](https://www.ird.govt.nz/income-tax/income-tax-for-individuals/acc-clients-and-carers/acc-earners-levy-rates)
- [ACC: Understanding levies](https://www.acc.co.nz/for-business/understanding-levies-if-you-work-or-own-a-business)
- [ACC: Levy results](https://www.acc.co.nz/about-us/our-levies-2/levy-results)

---

## 3. Social Security Contributions

### 3.1 Key Finding: No Mandatory Social Security Contributions

**New Zealand is unique among developed nations** in that its social security system (welfare, pensions, unemployment benefits) is **funded entirely from general tax revenue**, not through dedicated payroll contributions.

This means:
- **No pension contributions** (unlike US Social Security, UK National Insurance, etc.)
- **No unemployment insurance contributions**
- **No health insurance contributions**
- **No separate social security tax**

### 3.2 Social Benefits Overview

New Zealand provides the following social benefits funded through general taxation:

#### New Zealand Superannuation (Pension)
- Universal pension available at age 65
- Requires 10 years of residence (including 5 years after age 50)
- **No income or asset test** for standard recipients
- Funded on a pay-as-you-go basis from general revenue

#### Job Seeker Support (Unemployment Benefit)
- Income-tested unemployment benefit
- Requires 2+ years of continuous residence
- No contribution history required

#### Healthcare
- Public healthcare system funded through general taxation
- No mandatory health insurance contributions

### 3.3 KiwiSaver (Voluntary Retirement Savings)

**KiwiSaver is NOT a mandatory social security contribution** but a voluntary retirement savings scheme with automatic enrollment:

- **Employee contribution:** 3%, 4%, 6%, 8%, or 10% of gross pay (employee choice)
- **Employer contribution:** Minimum 3% of gross pay (mandatory if employee is enrolled)
- **Automatic enrollment:** New employees aged 18-65 are automatically enrolled but can opt out within weeks 2-8 of employment
- **Voluntary nature:** Those who join cannot opt out later, but the initial enrollment is effectively voluntary

**For calculator purposes:** KiwiSaver should be treated as an **optional deduction**, not a mandatory contribution, with a default of 3% if the user wants to include it.

### 3.4 Official Sources

- [Wikipedia: Welfare in New Zealand](https://en.wikipedia.org/wiki/Welfare_in_New_Zealand)
- [US Social Security Administration: New Zealand social security programs](https://www.ssa.gov/policy/docs/progdesc/ssptw/2018-2019/asia/new-zealand.html)
- [Workia: New Zealand Social Security Insights](https://workia.com/knowledge/social-security-insights-from-workia/newzealand-social-security)
- [Inland Revenue: KiwiSaver opting out](https://www.ird.govt.nz/kiwisaver/kiwisaver-individuals/opting-out-of-kiwisaver)

---

## 4. Tax Residency Rules

### 4.1 Becoming a New Zealand Tax Resident

An individual becomes a New Zealand tax resident when they meet **either** of the following tests:

#### Test 1: 183-Day Rule
- Present in New Zealand for **more than 183 days** in any 12-month period
- **Backdated:** Tax residency is backdated to day 1 of the 183-day period
- Partial days count as whole days (arrival/departure days count)
- Days do not need to be consecutive

**Example:** Someone arrives on 1 July 2024. On 31 December 2024 (day 184), they become a tax resident effective from 1 July 2024.

#### Test 2: Permanent Place of Abode
- Having a place where you "usually live" in New Zealand
- Does not require property ownership
- Can apply even if you're frequently absent

**Factors considered:**
- Frequency and duration of returns to NZ
- Family and social ties in NZ
- Economic interests (employment, investments, superannuation)
- Intention to return permanently

### 4.2 Tax Implications of Residency

- **Tax residents:** Taxed on worldwide income
- **Non-residents:** Taxed only on New Zealand-sourced income

### 4.3 Ceasing Tax Residency

To cease being a New Zealand tax resident, **both** conditions must be met:

1. **No permanent place of abode** in New Zealand
2. **Absent for more than 325 days** in any 12-month period

**Important:** Partial days in New Zealand do NOT count toward the 325-day absence requirement (unlike the 183-day test).

### 4.4 Special Rules for Temporary Workers

**Seasonal workers** on Recognised Seasonal Employer (RSE) Limited Visas and **fishing crew** on Fishing Crew Work Visas are exempt from the 183-day rule and are taxed as non-residents provided they:
- Do not establish a permanent place of abode in New Zealand
- Are present specifically for seasonal/fishing work

### 4.5 Official Sources

- [Inland Revenue: Tax residency status for individuals](https://www.ird.govt.nz/international-tax/individuals/tax-residency-status-for-individuals)
- [Inland Revenue: IR292 - New Zealand tax residence guide (PDF)](https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir200---ir299/ir292/ir292-2024.pdf)
- [Deloitte NZ: Tax residency refresh](https://www.deloitte.com/nz/en/services/tax/perspectives/tax-residency-refresh-how-does-it-apply-to-individual-taxpayers.html)
- [PwC Tax Summaries: New Zealand - Residence](https://taxsummaries.pwc.com/new-zealand/individual/residence)

---

## 5. Tax Credits

New Zealand has a limited number of tax credits compared to many other countries. The main credits relevant to internationally mobile workers earning employment income are:

### 5.1 Independent Earner Tax Credit (IETC)

The **IETC** is the primary tax credit for middle-income earners who are not receiving welfare benefits or Working for Families credits.

#### Eligibility (2025-26)
- New Zealand tax resident
- Annual income between **$24,000 and $70,000**
- **Not claiming** Working for Families Tax Credits or a benefit
- Earning primarily from salary/wages, self-employment, or shareholder-employee income

#### Credit Amount (from 31 July 2024)
- **Maximum credit:** $520 per year ($10 per week)
- **Full credit:** For income up to $66,000
- **Abatement:** Reduces by 13 cents for every dollar earned between $66,001 and $70,000
- **Zero credit:** At income of $70,000 and above

#### Calculation Example

For annual income of $50,000:
```
Income $50,000 is below $66,000
IETC = $520 (full credit)
```

For annual income of $68,000:
```
Income exceeds $66,000 by $2,000
Abatement = $2,000 × 0.13 = $260
IETC = $520 - $260 = $260
```

#### Historical Context

The IETC was significantly expanded in Budget 2024:
- **Old threshold:** $44,000 - $48,000 (income range)
- **New threshold:** $24,000 - $70,000 (effective 31 July 2024)

This change extended the credit to approximately 500,000 additional New Zealand workers.

### 5.2 Working for Families Tax Credits

These credits are for families with dependent children and are income-tested. They include:
- **Family Tax Credit:** Primary credit for dependent children
- **In-Work Tax Credit:** For working families
- **FamilyBoost:** Childcare cost support (introduced 2024)

**Relevance to calculator:** These are typically not relevant for single internationally mobile workers without dependents. If we implement them, they would require:
- Number of dependent children
- Partner income
- Childcare costs (for FamilyBoost)

### 5.3 Other Credits

- **Minimum Family Tax Credit:** For working families with low income
- **Best Start Tax Credit:** For families with children under 3
- **Paid Parental Leave Tax Credit:** Related to parental leave

**Implementation note:** For the initial New Zealand calculator, focusing on **IETC only** covers the majority of internationally mobile worker scenarios. Working for Families credits can be added as a variant or extension.

### 5.4 Official Sources

- [Inland Revenue: Independent Earner Tax Credit](https://www.ird.govt.nz/income-tax/income-tax-for-individuals/individual-tax-credits/independent-earner-tax-credit-ietc)
- [Budget 2024: Tax Relief Factsheet (PDF)](https://www.beehive.govt.nz/sites/default/files/2024-05/Factsheet%20-%20Responsible%20tax%20relief.pdf)
- [PwC Tax Summaries: NZ - Other tax credits](https://taxsummaries.pwc.com/new-zealand/individual/other-tax-credits-and-incentives)
- [Solo App: IETC Guide and Calculator](https://www.soloapp.nz/independent-earner-tax-credit/)

---

## 6. Regional Uniformity

### 6.1 Confirmation: No Regional Tax Variations

New Zealand operates under a **unitary system of government**, meaning:

- **No state or provincial income taxes**
- **No regional tax variations**
- **No municipal income taxes**
- **Single national tax system** administered by Inland Revenue

### 6.2 Historical Context

Provincial governments were **abolished in 1876** under the Abolition of the Provinces Act of 1875. Since then, New Zealand has had a unitary parliamentary system with:
- Single national parliament as the supreme source of power
- Regional councils with very limited taxing authority
- Local councils fund operations primarily through property taxes (rates)

### 6.3 Comparison to Federal Systems

This contrasts significantly with federal systems where income tax can vary by region:
- **United States:** Federal + state + sometimes local income taxes
- **Canada:** Federal + provincial income taxes
- **Switzerland:** Federal + cantonal + municipal income taxes
- **Australia:** Federal income tax + state payroll taxes

### 6.4 Implications for Calculator

For the New Zealand configuration:
- **No regional inputs required** (unlike US, Canada, Switzerland)
- **No regional calculation nodes**
- **Single base configuration** covers all workers
- Simplest possible implementation

### 6.5 Official Sources

- [Wikipedia: Taxation in New Zealand](https://en.wikipedia.org/wiki/Taxation_in_New_Zealand)
- [Tax Foundation: New Zealand tax system](https://taxfoundation.org/location/new-zealand/)
- [Te Ara Encyclopedia: Provinces and provincial districts](https://teara.govt.nz/en/1966/provinces-and-provincial-districts)
- [New Zealand Shores: Tax in New Zealand overview](https://www.newzealandshores.com/tax-in-new-zealand/)

---

## 7. Implementation Considerations

### 7.1 Calculation Flow

For a New Zealand tax calculator, the calculation flow is straightforward:

```
1. Input: gross_annual
2. Calculate: taxable_income = gross_annual
3. Calculate: income_tax (bracket_tax with 5 brackets)
4. Calculate: acc_levy = min(gross_annual, max_liable_earnings) × acc_rate
5. Calculate: ietc (if 24000 <= gross_annual <= 70000)
6. Calculate: net = gross_annual - income_tax - acc_levy + ietc
```

### 7.2 Required Inputs

**Minimal configuration:**
```yaml
inputs:
  gross_annual:
    type: number
    required: true
    label: "Annual Gross Salary (NZD)"
```

**Optional for future variants:**
- `has_student_loan` (for student loan repayments)
- `kiwisaver_rate` (for voluntary KiwiSaver contributions)
- `num_children` (for Working for Families credits)

### 7.3 Parameters (2025-26)

```yaml
parameters:
  acc_rate: 0.0167
  acc_max_earnings: 152790
  ietc_min: 24000
  ietc_max: 70000
  ietc_full_threshold: 66000
  ietc_amount: 520
  ietc_abatement_rate: 0.13
```

### 7.4 Tax Brackets (2025-26)

```yaml
parameters:
  tax_brackets:
    - threshold: 0
      rate: 0.105
    - threshold: 15600
      rate: 0.175
    - threshold: 53500
      rate: 0.30
    - threshold: 78100
      rate: 0.33
    - threshold: 180000
      rate: 0.39
```

### 7.5 Variants to Consider

Potential variants for future implementation:
1. **Student Loan Repayment** (12% of income above threshold)
2. **Working for Families** (with dependent children)
3. **KiwiSaver Included** (with employer and employee contributions)
4. **Non-Resident** (different tax treatment)

### 7.6 Test Vectors

Suggested test vectors for validation:

**Low Income ($30,000):**
```json
{
  "name": "Low income with IETC",
  "inputs": { "gross_annual": 30000 },
  "expected": {
    "income_tax": 3640,
    "acc_levy": 501,
    "ietc": 520,
    "net": 26379,
    "effective_rate": 0.1207
  }
}
```

**Median Income ($65,000):**
```json
{
  "name": "Median income with full IETC",
  "inputs": { "gross_annual": 65000 },
  "expected": {
    "income_tax": 11632.50,
    "acc_levy": 1085.50,
    "ietc": 520,
    "net": 52802,
    "effective_rate": 0.1876
  }
}
```

**High Income ($150,000):**
```json
{
  "name": "High income no IETC",
  "inputs": { "gross_annual": 150000 },
  "expected": {
    "income_tax": 39377.50,
    "acc_levy": 2551.59,
    "ietc": 0,
    "net": 108070.91,
    "effective_rate": 0.2795
  }
}
```

**Above ACC Cap ($200,000):**
```json
{
  "name": "Income above ACC cap",
  "inputs": { "gross_annual": 200000 },
  "expected": {
    "income_tax": 55877.50,
    "acc_levy": 2551.59,
    "ietc": 0,
    "net": 141570.91,
    "effective_rate": 0.2921
  }
}
```

### 7.7 Simplicity Benefits

New Zealand's tax system simplicity offers several implementation advantages:

1. **No regional complexity** - Single national configuration
2. **Minimal mandatory deductions** - Only PAYE and ACC
3. **Straightforward residency** - Clear 183-day rule
4. **Limited credits** - IETC covers most scenarios
5. **No social security maze** - No complex contribution calculations

This makes it an ideal **first international country** to implement after the initial country, as it validates the calculator architecture without introducing excessive complexity.

---

## 8. Key Differences from Similar Countries

### 8.1 vs. Australia
- **NZ:** No Medicare levy (Australia: 2%)
- **NZ:** No state taxes (Australia: federal only, but has state payroll taxes)
- **NZ:** ACC levy is lower than combined Australian levies
- **NZ:** Simpler tax bracket structure (5 vs 5, but NZ cleaner thresholds)

### 8.2 vs. United Kingdom
- **NZ:** No National Insurance (UK: significant NI contributions ~12-13.25%)
- **NZ:** No personal allowance (UK: £12,570 tax-free allowance)
- **NZ:** ACC replaces employer's liability and workers' compensation
- **NZ:** Simpler credit system (UK: multiple allowances and reliefs)

### 8.3 vs. Netherlands
- **NZ:** No social security contributions (NL: substantial contributions ~27% combined)
- **NZ:** No box system (NL: complex three-box system)
- **NZ:** No mandatory pension contributions (NL: AOW contribution)
- **NZ:** Much simpler overall (NL: one of Europe's most complex)

### 8.4 vs. United States
- **NZ:** No Social Security tax (US: 6.2%)
- **NZ:** No Medicare tax (US: 1.45%)
- **NZ:** No state/local income taxes (US: varies by state, 0-13%+)
- **NZ:** Significantly simpler overall

---

## 9. Sources Summary

### Official Government Sources

1. **Inland Revenue (IRD) - Primary Authority**
   - Tax rates: https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals
   - ACC levy: https://www.ird.govt.nz/income-tax/income-tax-for-individuals/acc-clients-and-carers/acc-earners-levy-rates
   - Tax residency: https://www.ird.govt.nz/international-tax/individuals/tax-residency-status-for-individuals
   - IETC: https://www.ird.govt.nz/income-tax/income-tax-for-individuals/individual-tax-credits/independent-earner-tax-credit-ietc
   - IR292 Guide: https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir200---ir299/ir292/ir292-2024.pdf

2. **ACC (Accident Compensation Corporation)**
   - Levy information: https://www.acc.co.nz/for-business/understanding-levies-if-you-work-or-own-a-business
   - Levy results: https://www.acc.co.nz/about-us/our-levies-2/levy-results

3. **Government Budget Documents**
   - Budget 2024 Tax Relief: https://www.beehive.govt.nz/sites/default/files/2024-05/Factsheet%20-%20Responsible%20tax%20relief.pdf

### Professional Sources

4. **PwC Tax Summaries**
   - Individual taxes: https://taxsummaries.pwc.com/new-zealand/individual/taxes-on-personal-income
   - Residence: https://taxsummaries.pwc.com/new-zealand/individual/residence
   - Credits: https://taxsummaries.pwc.com/new-zealand/individual/other-tax-credits-and-incentives

5. **Deloitte New Zealand**
   - Tax residency guidance: https://www.deloitte.com/nz/en/services/tax/perspectives/tax-residency-refresh-how-does-it-apply-to-individual-taxpayers.html
   - Budget 2024 analysis: https://www.deloitte.com/nz/en/services/tax/perspectives/budget-2024-everything-you-need-to-know-about-the-tax-changes.html

6. **EY Global**
   - Budget 2024 summary: https://www.ey.com/en_gl/technical/tax-alerts/new-zealand-2024-25-budget-delivers-personal-income-tax-cuts-and

### Reference Sources

7. **Tax Foundation**
   - NZ tax system overview: https://taxfoundation.org/location/new-zealand/

8. **US Social Security Administration**
   - International programs: https://www.ssa.gov/policy/docs/progdesc/ssptw/2018-2019/asia/new-zealand.html

9. **Wikipedia**
   - Taxation in NZ: https://en.wikipedia.org/wiki/Taxation_in_New_Zealand
   - Welfare in NZ: https://en.wikipedia.org/wiki/Welfare_in_New_Zealand

---

## 10. Next Steps for Implementation

1. **Create base configuration:** `configs/nz/2025/base.yaml`
2. **Define calculation nodes:**
   - Taxable income (passthrough)
   - Income tax (bracket_tax with 5 brackets)
   - ACC levy (percent_of with cap)
   - IETC (credit with abatement)
3. **Write test vectors:** At minimum low, median, high income, and above-ACC-cap scenarios
4. **Validate with npm run test:configs**
5. **Consider variants:**
   - Student loan repayment variant
   - KiwiSaver included variant
   - Working for Families variant (future)

---

## 11. Conclusion

New Zealand's tax system is remarkably simple and transparent, making it an excellent candidate for early implementation in the Universal Salary Calculator. The absence of regional variations, minimal mandatory contributions, and straightforward residency rules provide a clean test case for the calculator architecture.

The system's simplicity also makes it easier for internationally mobile workers to understand their tax obligations when considering New Zealand as a destination, which aligns perfectly with the calculator's purpose.

**Complexity Rating:** Low (2/10)
**Implementation Priority:** High (excellent second country after initial implementation)
**Documentation Quality:** Excellent (IRD provides clear, accessible guidance)
