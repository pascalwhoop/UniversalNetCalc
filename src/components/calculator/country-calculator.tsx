"use client"

import { CountryColumnState } from "@/lib/types"
import { useCountryCalculation } from "@/lib/hooks/use-country-calculation"

interface CountryCalculatorProps {
  state: CountryColumnState
  onUpdate: (updates: Partial<CountryColumnState>) => void
}

/**
 * Renderless component that manages calculation lifecycle for a single country.
 * Renders one per country in ComparisonGrid alongside the ComparisonTable.
 */
export function CountryCalculator({ state, onUpdate }: CountryCalculatorProps) {
  useCountryCalculation(state, onUpdate)
  return null
}
