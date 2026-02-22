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
 * Polynomial zone income splitting tax (e.g. German Ehegattensplitting)
 * Used for married couples filing jointly where the tax formula uses
 * polynomial progression zones rather than simple brackets.
 *
 * The zones parameter must reference a parameter defined in the config YAML.
 * Each zone entry describes a progression zone with its upper threshold and
 * formula type ('zero', 'quadratic', or 'linear').
 *
 * Quadratic zone: tax = floor((a * y + b) * y + c)  where y = (x - offset) / scale
 * Linear zone:    tax = floor(rate * x - constant)
 * Zero zone:      tax = 0
 */
function incomeSplittingTax(
  inputs: Record<string, unknown>,
  context: CalculationContext
): number {
  const { taxable_income, splitting_factor, zones: zonesRef } = inputs as any

  if (!zonesRef) {
    throw new Error('incomeSplittingTax requires a zones input reference')
  }

  const zones = getZones(zonesRef, context)

  if (!splitting_factor || splitting_factor === 1) {
    return computePolynomialZoneTax(taxable_income, zones)
  }

  const splitIncome = taxable_income / splitting_factor
  const splitTax = computePolynomialZoneTax(splitIncome, zones)
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

export interface PolynomialZone {
  threshold: number
  type: 'zero' | 'quadratic' | 'linear'
  // Quadratic: tax = floor((a * y + b) * y + c)  where y = (x - offset) / scale
  a?: number
  b?: number
  c?: number
  offset?: number
  scale?: number
  // Linear: tax = floor(rate * x - constant)
  rate?: number
  constant?: number
}

function getZones(zonesRef: unknown, context: CalculationContext): PolynomialZone[] {
  if (Array.isArray(zonesRef)) return zonesRef as PolynomialZone[]

  if (typeof zonesRef === 'string') {
    const key = zonesRef.startsWith('$') ? zonesRef.slice(1) : zonesRef
    const zones = context.parameters[key]
    if (!Array.isArray(zones)) throw new Error(`Zones not found in parameters: ${key}`)
    return zones as PolynomialZone[]
  }

  throw new Error(`Invalid zones reference: ${JSON.stringify(zonesRef)}`)
}

function computePolynomialZoneTax(income: number, zones: PolynomialZone[]): number {
  const x = Math.floor(income)
  if (x <= 0) return 0

  for (const zone of zones) {
    if (x > zone.threshold) continue

    if (zone.type === 'zero') return 0

    if (zone.type === 'quadratic') {
      const { a = 0, b = 0, c = 0, offset = 0, scale = 10000 } = zone
      const y = (x - offset) / scale
      return Math.floor((a * y + b) * y + c)
    }

    if (zone.type === 'linear') {
      const { rate = 0, constant = 0 } = zone
      return Math.floor(rate * x - constant)
    }

    throw new Error(`Unknown zone type: ${(zone as any).type}`)
  }

  // Income exceeds all zone thresholds — apply last zone
  const last = zones[zones.length - 1]
  if (last.type === 'linear') {
    const { rate = 0, constant = 0 } = last
    return Math.floor(rate * x - constant)
  }

  throw new Error('Income exceeds all polynomial zones and last zone is not linear')
}

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

