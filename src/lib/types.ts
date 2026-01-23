// Type definitions for state management and persistence

import { CalculationResult } from "./api"

/**
 * State for a single country calculation
 */
export interface CalculationState {
  country: string
  year: string
  gross_annual: string
  variant?: string
  formValues: Record<string, string>
  currency?: string
}

/**
 * Full state for a country column including UI state and results
 */
export interface CountryColumnState extends CalculationState {
  id: string // Stable UUID for tracking
  index: number // Display order
  result: CalculationResult | null
  isCalculating: boolean
  calculationError: string | null
}

/**
 * State for all countries in comparison
 */
export interface ComparisonState {
  countries: CalculationState[]
  timestamp?: number
}

/**
 * Persisted calculation with metadata
 */
export interface SavedCalculation {
  id: string
  name: string
  notes?: string
  countries: CalculationState[]
  timestamp: number
  results?: {
    country: string
    year: string
    result: CalculationResult
  }[]
}

/**
 * User preferences stored in localStorage
 */
export interface UserPreferences {
  viewMode?: "grid" | "table"
  showMonthly?: boolean
  theme?: "light" | "dark" | "system"
}

/**
 * localStorage data structure
 */
export interface StorageData {
  calculations: SavedCalculation[]
  preferences: UserPreferences
  version: number
}
