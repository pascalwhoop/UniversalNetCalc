import type { CalculationContext, BracketEntry } from '../../schema/src/config-types'

/**
 * Built-in functions for complex tax calculations that can't be expressed in pure YAML
 */

export function resolveFunctions(): Map<string, Function> {
  const functions = new Map<string, Function>()

  functions.set('income_splitting_tax', incomeSplittingTax)
  functions.set('family_quotient_tax', familyQuotientTax)
  functions.set('alternative_minimum_tax', alternativeMinimumTax)
  functions.set('swiss_federal_tax', swissFederalTax)

  return functions
}

/**
 * German Ehegattensplitting (income splitting)
 * Used for married couples filing jointly
 *
 * Splits taxable income in half, computes tax, then doubles the result
 */
function incomeSplittingTax(
  inputs: Record<string, number>,
  context: CalculationContext
): number {
  const { taxable_income, splitting_factor } = inputs as any

  // Detect tax year from config metadata
  const taxYear = context.config?.meta?.year || 2024

  // Select appropriate tax function based on year
  const computeTax =
    taxYear === 2026
      ? computeGermanTax2026
      : taxYear === 2025
        ? computeGermanTax2025
        : computeGermanTax2024

  if (!splitting_factor || splitting_factor === 1) {
    // No splitting - compute normally
    return computeTax(taxable_income)
  }

  // Split taxable income
  const splitIncome = taxable_income / splitting_factor

  // Compute tax on split income
  const splitTax = computeTax(splitIncome)

  // Multiply result by splitting factor
  return splitTax * splitting_factor
}

/**
 * French Quotient Familial (family quotient)
 * Divides income by family units, computes tax, multiplies back
 *
 * Note: brackets parameter must be specified in config but is read from context.parameters
 * This is because the evaluator can only pass numbers, not arrays
 */
function familyQuotientTax(
  inputs: Record<string, any>,
  context: CalculationContext
): number {
  const { gross, family_units, brackets: bracketsRef } = inputs

  if (typeof gross !== 'number' || isNaN(gross)) {
    throw new Error(`Invalid gross income: ${gross} (type: ${typeof gross})`)
  }

  if (typeof family_units !== 'number' || isNaN(family_units)) {
    throw new Error(`Invalid family_units: ${family_units} (type: ${typeof family_units})`)
  }

  if (!bracketsRef) {
    throw new Error(`familyQuotientTax requires a brackets input reference`)
  }

  const brackets = getBrackets(bracketsRef, context)

  if (!Array.isArray(brackets) || brackets.length === 0) {
    throw new Error(`brackets not found in parameters or is empty`)
  }

  if (!family_units || family_units === 1) {
    return computeProgressiveBracketTax(gross, brackets)
  }

  const quotient = gross / family_units
  const quotientTax = computeProgressiveBracketTax(quotient, brackets)

  return quotientTax * family_units
}

/**
 * US Alternative Minimum Tax
 * Computes both regular tax and AMT, returns the maximum
 */
function alternativeMinimumTax(
  inputs: Record<string, number>,
  context: CalculationContext
): number {
  const {
    gross,
    regular_brackets: regularRef,
    amt_brackets: amtRef,
    amt_exemption,
  } = inputs as any

  // Compute regular tax
  const regularTax = computeBracketTax(gross, getBrackets(regularRef, context))

  // Compute AMT
  const amtBase = Math.max(0, gross - (amt_exemption || 0))
  const amt = computeBracketTax(amtBase, getBrackets(amtRef, context))

  // Return the higher of the two
  return Math.max(regularTax, amt)
}

/**
 * Swiss Federal Tax
 * Uses different rate schedules for single vs married
 */
function swissFederalTax(
  inputs: Record<string, number>,
  context: CalculationContext
): number {
  const { gross, filing_status, single_brackets: singleRef, married_brackets: marriedRef } =
    inputs as any

  const bracketsRef = filing_status === 'married' ? marriedRef : singleRef

  return computeBracketTax(gross, getBrackets(bracketsRef, context))
}

// Helper functions

function getBrackets(
  bracketsRef: any,
  context: CalculationContext
): BracketEntry[] {
  if (Array.isArray(bracketsRef)) {
    return bracketsRef as BracketEntry[]
  }

  if (typeof bracketsRef === 'string') {
    const ref = bracketsRef.startsWith('$') ? bracketsRef.slice(1) : bracketsRef
    const brackets = context.parameters[ref]

    if (!Array.isArray(brackets)) {
      throw new Error(`Brackets not found: ${ref}`)
    }

    return brackets as BracketEntry[]
  }

  throw new Error(`Invalid brackets reference: ${JSON.stringify(bracketsRef)}`)
}

function computeBracketTax(income: number, brackets: BracketEntry[]): number {
  return computeProgressiveBracketTax(income, brackets)
}

/**
 * Standard progressive bracket tax calculation
 * Used by French quotient familial and other systems
 */
function computeProgressiveBracketTax(income: number, brackets: BracketEntry[]): number {
  if (income <= 0) return 0

  let tax = 0
  let previousThreshold = 0

  for (const bracket of brackets) {
    if (income <= bracket.threshold) {
      // Income is in this bracket
      if (bracket.rate > 0) {
        tax += (income - previousThreshold) * bracket.rate
      }
      break
    } else {
      // Income exceeds this bracket, tax the full bracket
      if (bracket.rate > 0 && bracket.threshold > previousThreshold) {
        tax += (bracket.threshold - previousThreshold) * bracket.rate
      }
      previousThreshold = bracket.threshold
    }
  }

  // If income exceeds all brackets, apply the last bracket's rate to remaining income
  const lastBracket = brackets[brackets.length - 1]
  if (income > lastBracket.threshold) {
    tax += (income - lastBracket.threshold) * lastBracket.rate
  }

  return Math.round(tax)
}

/**
 * German tax formula for 2026
 * Based on official BMF formula (§32a EStG) with continuous progression zones
 * Source: https://www.finanz-tools.de/einkommensteuer/berechnung-formeln/2026
 *
 * Key changes from 2025:
 * - Basic allowance raised to €12,348 (from €12,096)
 * - Zone thresholds adjusted: €17,799 (zone 2 end), €69,878 (zone 3 end)
 * - Solidarity surcharge exemption threshold increased to €20,350 (single)
 */
function computeGermanTax2026(taxableIncome: number): number {
  const x = Math.floor(taxableIncome)

  // Zone 1: Below basic allowance (€12,348)
  if (x <= 12348) {
    return 0
  }

  // Zone 2: Linear progression (€12,349 - €17,799)
  // Formula: E = (914.51 · y + 1,400) · y where y = (income - 12,348) / 10,000
  if (x <= 17799) {
    const y = (x - 12348) / 10000
    return Math.floor((914.51 * y + 1400) * y)
  }

  // Zone 3: Linear progression (€17,800 - €69,878)
  // Formula: E = (173.20 · z + 2,397) · z + 1,034 where z = (income - 17,799) / 10,000
  if (x <= 69878) {
    const z = (x - 17799) / 10000
    return Math.floor((173.20 * z + 2397) * z + 1034)
  }

  // Zone 4: Linear rate 42% (€69,879 - €277,825)
  if (x <= 277825) {
    return Math.floor(0.42 * x - 11136)
  }

  // Zone 5: Linear rate 45% (≥ €277,826)
  return Math.floor(0.45 * x - 19471)
}

/**
 * German tax formula for 2024
 * Based on official BMF formula (§32a EStG) with continuous progression zones
 * Source: https://www.finanz-tools.de/einkommensteuer/berechnung-formeln/2024
 *
 * The basic allowance was retroactively raised to €11,784 for 2024
 */
function computeGermanTax2024(taxableIncome: number): number {
  const x = Math.floor(taxableIncome)

  // Zone 1: Below basic allowance (€11,784 - retroactively raised)
  if (x <= 11784) {
    return 0
  }

  // Zone 2: Linear progression (€11,785 - €17,005)
  if (x <= 17005) {
    const y = (x - 11784) / 10000
    return Math.floor((954.80 * y + 1400) * y)
  }

  // Zone 3: Linear progression (€17,006 - €66,760)
  if (x <= 66760) {
    const z = (x - 17005) / 10000
    return Math.floor((181.19 * z + 2397) * z + 991.21)
  }

  // Zone 4: Linear rate 42% (€66,761 - €277,825)
  if (x <= 277825) {
    return Math.floor(0.42 * x - 10636.31)
  }

  // Zone 5: Linear rate 45% (≥ €277,826)
  return Math.floor(0.45 * x - 18971.06)
}

/**
 * German tax formula for 2025
 * Based on official BMF formula (§32a EStG) with continuous progression zones
 * Source: https://taxrep.us/tax_guide/german-income-tax-guide/german-income-tax-rates-brackets/
 *
 * Key changes from 2024:
 * - Basic allowance raised to €12,096
 * - Zone thresholds adjusted: €17,443 (zone 2), €68,480 (zone 3)
 * - Solidarity surcharge exemption threshold increased to €19,950 (single)
 */
function computeGermanTax2025(taxableIncome: number): number {
  const x = Math.floor(taxableIncome)

  // Zone 1: Below basic allowance (€12,096)
  if (x <= 12096) {
    return 0
  }

  // Zone 2: Linear progression (€12,097 - €17,443)
  // Formula: E = (932.30 · y + 1,400) · y where y = (income - 12,096) / 10,000
  if (x <= 17443) {
    const y = (x - 12096) / 10000
    return Math.floor((932.30 * y + 1400) * y)
  }

  // Zone 3: Linear progression (€17,444 - €68,480)
  // Formula: E = (177.23 · z + 2,397) · z + 1,025.84 where z = (income - 17,443) / 10,000
  if (x <= 68480) {
    const z = (x - 17443) / 10000
    return Math.floor((177.23 * z + 2397) * z + 1025.84)
  }

  // Zone 4: Linear rate 42% (€68,481 - €277,825)
  if (x <= 277825) {
    return Math.floor(0.42 * x - 10911.92)
  }

  // Zone 5: Linear rate 45% (≥ €277,826)
  return Math.floor(0.45 * x - 19246.67)
}
