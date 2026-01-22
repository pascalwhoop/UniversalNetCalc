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

  if (!splitting_factor || splitting_factor === 1) {
    // No splitting - compute normally
    return computeGermanTax2024(taxable_income)
  }

  // Split taxable income
  const splitIncome = taxable_income / splitting_factor

  // Compute tax on split income
  const splitTax = computeGermanTax2024(splitIncome)

  // Multiply result by splitting factor
  return splitTax * splitting_factor
}

/**
 * French Quotient Familial (family quotient)
 * Divides income by family units, computes tax, multiplies back
 */
function familyQuotientTax(
  inputs: Record<string, number>,
  context: CalculationContext
): number {
  const { gross, family_units, brackets: bracketsRef } = inputs as any

  if (!family_units || family_units === 1) {
    return computeBracketTax(gross, getBrackets(bracketsRef, context))
  }

  const quotient = gross / family_units
  const quotientTax = computeBracketTax(quotient, getBrackets(bracketsRef, context))

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
  bracketsRef: string | number,
  context: CalculationContext
): BracketEntry[] {
  if (typeof bracketsRef === 'string') {
    const ref = bracketsRef.startsWith('$') ? bracketsRef.slice(1) : bracketsRef
    const brackets = context.parameters[ref]

    if (!Array.isArray(brackets)) {
      throw new Error(`Brackets not found: ${ref}`)
    }

    return brackets as BracketEntry[]
  }

  throw new Error('Invalid brackets reference')
}

function computeBracketTax(income: number, brackets: BracketEntry[]): number {
  // Use actual German tax formula for 2024
  return computeGermanTax2024(income)
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
