// LocalStorage utilities for saving calculations and preferences

import { SavedCalculation, UserPreferences, StorageData, ComparisonState } from "./types"
import { CalculationResult } from "./api"

const STORAGE_KEY = "netcalc_history"
const STORAGE_VERSION = 1
const MAX_CALCULATIONS = 50

/**
 * Get storage data from localStorage
 */
function getStorageData(): StorageData {
  if (typeof window === "undefined") {
    return {
      calculations: [],
      preferences: {},
      version: STORAGE_VERSION,
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        calculations: [],
        preferences: {},
        version: STORAGE_VERSION,
      }
    }

    const data = JSON.parse(raw) as StorageData

    // Handle version migrations if needed
    if (data.version !== STORAGE_VERSION) {
      return {
        calculations: data.calculations || [],
        preferences: data.preferences || {},
        version: STORAGE_VERSION,
      }
    }

    return data
  } catch (error) {
    console.error("Failed to parse localStorage:", error)
    return {
      calculations: [],
      preferences: {},
      version: STORAGE_VERSION,
    }
  }
}

/**
 * Save storage data to localStorage
 */
function setStorageData(data: StorageData) {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
    // Handle quota exceeded error
    if (error instanceof Error && error.name === "QuotaExceededError") {
      // Remove oldest calculations and retry
      data.calculations = data.calculations.slice(-MAX_CALCULATIONS / 2)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (retryError) {
        console.error("Failed to save after cleanup:", retryError)
      }
    }
  }
}

/**
 * Generate unique ID for calculation
 */
function generateId(): string {
  return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Save a calculation with metadata
 */
export function saveCalculation(
  name: string,
  state: ComparisonState,
  results?: { country: string; year: string; result: CalculationResult }[],
  notes?: string
): SavedCalculation {
  const data = getStorageData()

  const calculation: SavedCalculation = {
    id: generateId(),
    name,
    notes,
    countries: state.countries,
    timestamp: Date.now(),
    results,
  }

  // Add to beginning of list
  data.calculations.unshift(calculation)

  // Apply FIFO eviction if over limit
  if (data.calculations.length > MAX_CALCULATIONS) {
    data.calculations = data.calculations.slice(0, MAX_CALCULATIONS)
  }

  setStorageData(data)
  return calculation
}

/**
 * Load calculation history
 */
export function loadHistory(): SavedCalculation[] {
  const data = getStorageData()
  return data.calculations
}

/**
 * Get a specific calculation by ID
 */
export function getCalculation(id: string): SavedCalculation | null {
  const data = getStorageData()
  return data.calculations.find((c) => c.id === id) || null
}

/**
 * Delete a calculation
 */
export function deleteCalculation(id: string): void {
  const data = getStorageData()
  data.calculations = data.calculations.filter((c) => c.id !== id)
  setStorageData(data)
}

/**
 * Update a calculation (e.g., rename)
 */
export function updateCalculation(id: string, updates: Partial<SavedCalculation>): void {
  const data = getStorageData()
  const index = data.calculations.findIndex((c) => c.id === id)

  if (index !== -1) {
    data.calculations[index] = {
      ...data.calculations[index],
      ...updates,
    }
    setStorageData(data)
  }
}

/**
 * Clear all calculations
 */
export function clearHistory(): void {
  const data = getStorageData()
  data.calculations = []
  setStorageData(data)
}

/**
 * Get user preferences
 */
export function getPreferences(): UserPreferences {
  const data = getStorageData()
  return data.preferences
}

/**
 * Save user preferences
 */
export function savePreferences(preferences: Partial<UserPreferences>): void {
  const data = getStorageData()
  data.preferences = {
    ...data.preferences,
    ...preferences,
  }
  setStorageData(data)
}

/**
 * Get specific preference value
 */
export function getPreference<K extends keyof UserPreferences>(
  key: K
): UserPreferences[K] | undefined {
  const preferences = getPreferences()
  return preferences[key]
}

/**
 * Set specific preference value
 */
export function setPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  savePreferences({ [key]: value })
}
