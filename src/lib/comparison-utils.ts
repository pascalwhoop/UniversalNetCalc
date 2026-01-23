/**
 * Utilities for salary comparison calculations
 */

import { CalculationResult } from "./api"

/**
 * Calculate the net income delta between current and best country,
 * accounting for currency differences using normalized values.
 *
 * @param bestNormalizedNet - Best country's net in EUR (normalized)
 * @param currentNormalizedNet - Current country's net in EUR (normalized)
 * @param currentResult - Current country's calculation result
 * @returns Delta in the current country's currency, or null if best is same as current
 */
export function calculateNetDelta(
  bestNormalizedNet: number | undefined,
  currentNormalizedNet: number | undefined,
  currentResult: CalculationResult
): number | null {
  if (bestNormalizedNet === undefined || currentNormalizedNet === undefined) {
    return null
  }

  // Calculate delta in EUR
  const deltaInEur = currentNormalizedNet - bestNormalizedNet

  // Convert delta back to current country's currency
  const currentCurrency = currentResult.currency
  if (currentCurrency === "EUR") {
    return deltaInEur
  }

  // Approximate conversion using the ratio
  const originalNet = currentResult.net
  const ratio = originalNet / currentNormalizedNet
  return deltaInEur * ratio
}

/**
 * Calculate total deductions (taxes + contributions + surtax) for a country
 */
export function calculateTotalDeductions(result: CalculationResult): number {
  return result.breakdown
    .filter(item => item.category === "income_tax" || item.category === "contribution" || item.category === "surtax")
    .reduce((sum, item) => sum + item.amount, 0)
}

/**
 * Find the country with the best (highest) normalized net income
 */
export function findBestCountryByNet(normalizedValues: Map<string, number>): string | null {
  if (normalizedValues.size < 2) {
    return null
  }

  let bestId: string | null = null
  let maxNet = -Infinity

  for (const [id, net] of normalizedValues.entries()) {
    if (net > maxNet) {
      maxNet = net
      bestId = id
    }
  }

  return bestId
}

/**
 * Find the country with the best (lowest) effective tax rate
 */
export function findBestCountryByTaxRate(
  results: Map<string, { country: string; year: string; result: CalculationResult }>
): string | null {
  if (results.size < 2) {
    return null
  }

  let bestId: string | null = null
  let minRate = Infinity

  for (const [id, data] of results.entries()) {
    if (data.result.effective_rate < minRate) {
      minRate = data.result.effective_rate
      bestId = id
    }
  }

  return bestId
}
