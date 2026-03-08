import type { CalculationContext } from '../../../schema/src/config-types'

/**
 * Austria Full-Year Tax Calculation (14-salary system)
 *
 * Austria pays employees 14 times per year (regular monthly × 12 + holiday bonus + Christmas bonus).
 * The 13th and 14th month payments ("Sonderzahlungen") receive preferential tax treatment:
 * - Social security at reduced rates (17.07% employee vs 18.07% regular)
 * - First EUR 620 tax-free, then 6% flat rate up to EUR 25,000
 * - Higher graduated rates above EUR 25,000
 *
 * Inputs:
 *   gross_annual: Total annual compensation (14 months)
 *   sv_base_rate: Employee SV rate excluding unemployment (pension + health + AK + WF)
 *   sv_base_rate_special: Employee SV rate for special payments excluding unemployment
 *   unemployment_rate: Full unemployment insurance rate (2.95%)
 *   sv_cap_monthly: Monthly SV cap (EUR 6,930 for 2026)
 *   sv_cap_special_annual: Annual SV cap for special payments (EUR 13,860 for 2026)
 *   transport_credit: Verkehrsabsetzbetrag (EUR 496 for 2026)
 *   werbungskosten: Standard business expense deduction (EUR 132 for 2026)
 *   alv_tier1_limit: Unemployment insurance tier 1 upper limit (EUR 2,225 for 2026)
 *   alv_tier2_limit: Unemployment insurance tier 2 upper limit (EUR 2,427 for 2026)
 *   alv_tier3_limit: Unemployment insurance tier 3 upper limit (EUR 2,630 for 2026)
 *
 * Returns: Total annual income tax.
 * Source: Austrian Income Tax Act (EStG) 2026, PwC Austria tax summaries
 */
export function austriaFullYearTax(
  inputs: Record<string, any>,
  context: CalculationContext
): number {
  const {
    gross_annual,
    sv_base_rate,
    sv_base_rate_special,
    unemployment_rate,
    sv_cap_monthly,
    sv_cap_special_annual,
    transport_credit,
    werbungskosten,
    alv_tier1_limit,
    alv_tier2_limit,
    alv_tier3_limit,
  } = inputs

  const taxableFraction = inputs.taxable_fraction ?? 1.0

  const monthlyGross = gross_annual / 14
  const regularAnnual = monthlyGross * 12
  const specialAnnual = monthlyGross * 2

  // Tiered unemployment insurance reduction for low earners (ASVG 2026)
  let effectiveAlvRate: number
  if (monthlyGross <= alv_tier1_limit) {
    effectiveAlvRate = 0
  } else if (monthlyGross <= alv_tier2_limit) {
    effectiveAlvRate = 0.01
  } else if (monthlyGross <= alv_tier3_limit) {
    effectiveAlvRate = 0.02
  } else {
    effectiveAlvRate = unemployment_rate
  }

  // Social security on regular payments
  const svRegularRate = sv_base_rate + effectiveAlvRate
  const svBaseMonthly = Math.min(monthlyGross, sv_cap_monthly)
  const svRegularAnnual = svBaseMonthly * svRegularRate * 12

  // Social security on special payments (reduced rate)
  const svSpecialRate = sv_base_rate_special + effectiveAlvRate
  const svSpecialBase = Math.min(specialAnnual, sv_cap_special_annual)
  const svSpecialAnnual = svSpecialBase * svSpecialRate

  const totalSV = svRegularAnnual + svSpecialAnnual

  context.nodes['sv_regular'] = Math.round(svRegularAnnual * 100) / 100
  context.nodes['sv_special'] = Math.round(svSpecialAnnual * 100) / 100
  context.nodes['total_social_security'] = Math.round(totalSV * 100) / 100

  // Progressive income tax on regular payments
  const taxableRegularGross = regularAnnual * taxableFraction
  const taxableRegular = Math.max(0, taxableRegularGross - svRegularAnnual - werbungskosten)

  // Use brackets from config parameters instead of hardcoded
  const brackets = context.parameters['tax_brackets'] as Array<{ threshold: number; rate: number }>
  const regularTaxGross = computeProgressiveBracketTax(taxableRegular, brackets)
  const regularTax = Math.max(0, regularTaxGross - transport_credit)

  context.nodes['regular_income_tax'] = Math.round(regularTax * 100) / 100

  // Flat-rate tax on special payments (Sonderzahlungen)
  const specialTaxableGross = specialAnnual * taxableFraction
  const specialAfterSV = specialTaxableGross - svSpecialAnnual
  const specialTaxBase = Math.max(0, specialAfterSV - 620)

  let specialTax = 0
  if (specialTaxBase > 0) {
    if (specialTaxBase <= 25000) {
      specialTax = specialTaxBase * 0.06
    } else if (specialTaxBase <= 50000) {
      specialTax = 25000 * 0.06 + (specialTaxBase - 25000) * 0.27
    } else if (specialTaxBase <= 83333) {
      specialTax = 25000 * 0.06 + 25000 * 0.27 + (specialTaxBase - 50000) * 0.3575
    } else {
      specialTax =
        25000 * 0.06 +
        25000 * 0.27 +
        33333 * 0.3575 +
        (specialTaxBase - 83333) * 0.50
    }
  }

  context.nodes['special_payment_tax'] = Math.round(specialTax * 100) / 100

  const totalIncomeTax = regularTax + specialTax
  context.nodes['total_income_tax'] = Math.round(totalIncomeTax * 100) / 100

  if (taxableFraction < 1.0) {
    const taxFreeAllowance = gross_annual * (1 - taxableFraction)
    context.nodes['zuzugsfreibetrag_allowance'] = Math.round(taxFreeAllowance * 100) / 100
  }

  return Math.round(totalIncomeTax * 100) / 100
}

/**
 * Progressive bracket tax calculation (matches evaluateBracketTax logic)
 * Applies each bracket's rate to income WITHIN that bracket's range.
 */
function computeProgressiveBracketTax(
  income: number,
  brackets: Array<{ threshold: number; rate: number }>
): number {
  if (income <= 0) return 0

  let tax = 0
  let remaining = income

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i]
    const nextThreshold = i < brackets.length - 1 ? brackets[i + 1].threshold : Infinity

    const bracketAmount = Math.min(remaining, nextThreshold - bracket.threshold)

    if (bracketAmount <= 0) break

    tax += bracketAmount * bracket.rate
    remaining -= bracketAmount
  }

  return Math.round(tax * 100) / 100
}
