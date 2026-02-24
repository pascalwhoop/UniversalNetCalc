// Type definitions for state management and persistence

import { CalculationResult } from "./api"

/**
 * Monthly cost-of-living expenses in local currency.
 * Keys are category IDs from LIVING_COST_CATEGORIES, values are monthly amounts.
 */
export type CostOfLiving = Record<string, number>

export const DEFAULT_COST_OF_LIVING: CostOfLiving = {}

export interface LivingCostCategory {
  id: string
  emoji: string
  label: string
}

export const LIVING_COST_CATEGORIES: LivingCostCategory[] = [
  { id: "rent", emoji: "🏠", label: "Rent / Mortgage" },
  { id: "groceries", emoji: "🛒", label: "Groceries" },
  { id: "health_insurance", emoji: "🏥", label: "Health Insurance" },
  { id: "transport", emoji: "🚗", label: "Car / Transport" },
  { id: "phone_internet", emoji: "📱", label: "Phone & Internet" },
  { id: "utilities", emoji: "⚡", label: "Utilities" },
  { id: "dining", emoji: "🍽️", label: "Dining Out" },
  { id: "childcare", emoji: "👶", label: "Childcare" },
  { id: "education", emoji: "🎓", label: "Education" },
  { id: "insurance", emoji: "🛡️", label: "Insurance" },
  { id: "gym", emoji: "💪", label: "Gym & Fitness" },
  { id: "travel", emoji: "✈️", label: "Travel & Holidays" },
  { id: "clothing", emoji: "👕", label: "Clothing" },
  { id: "entertainment", emoji: "🎭", label: "Entertainment" },
  { id: "pets", emoji: "🐾", label: "Pets" },
  { id: "personal_care", emoji: "💇", label: "Personal Care" },
  { id: "gifts", emoji: "🎁", label: "Gifts & Donations" },
  { id: "savings", emoji: "💰", label: "Savings & Investments" },
  { id: "subscriptions", emoji: "📦", label: "Subscriptions" },
  { id: "misc", emoji: "🔧", label: "Miscellaneous" },
]

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
  costOfLiving: CostOfLiving
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
