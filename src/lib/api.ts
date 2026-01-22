// API client for the salary calculator

export interface BreakdownItem {
  id: string
  label: string
  amount: number
  category: "income_tax" | "contribution" | "credit" | "deduction" | "surtax"
  description?: string
}

export interface CalculationResult {
  gross: number
  net: number
  effective_rate: number
  breakdown: BreakdownItem[]
  currency: string // ISO 4217 currency code (EUR, USD, CHF, etc.)
  config_version_hash: string
  config_last_updated: string
}

export interface CalcRequest {
  country: string
  year: string | number
  gross_annual: number
  variant?: string
  [key: string]: string | number | boolean | undefined // Allow dynamic inputs
}

export interface ApiError {
  error: string
  details?: string
}

// Input definitions from config
export interface EnumOption {
  label: string
  description?: string
}

export interface InputDefinition {
  type: "number" | "enum" | "boolean"
  required: boolean
  label?: string
  description?: string
  default?: string | number | boolean
  // For number inputs
  min?: number
  max?: number
  // For enum inputs
  options?: Record<string, EnumOption>
}

export interface ConfigInputs {
  inputs: Record<string, InputDefinition>
  currency: string
}

const API_BASE = "/api/calc"

export async function fetchCountries(): Promise<string[]> {
  const res = await fetch(`${API_BASE}?action=countries`)
  if (!res.ok) {
    throw new Error("Failed to fetch countries")
  }
  const data: { countries: string[] } = await res.json()
  return data.countries
}

export async function fetchYears(country: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}?action=years&country=${country}`)
  if (!res.ok) {
    throw new Error("Failed to fetch years")
  }
  const data: { years: string[] } = await res.json()
  return data.years
}

export async function fetchVariants(
  country: string,
  year: string
): Promise<string[]> {
  const res = await fetch(
    `${API_BASE}?action=variants&country=${country}&year=${year}`
  )
  if (!res.ok) {
    throw new Error("Failed to fetch variants")
  }
  const data: { variants: string[] } = await res.json()
  return data.variants
}

export async function fetchInputs(
  country: string,
  year: string,
  variant?: string
): Promise<ConfigInputs> {
  const url = variant
    ? `${API_BASE}?action=inputs&country=${country}&year=${year}&variant=${variant}`
    : `${API_BASE}?action=inputs&country=${country}&year=${year}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("Failed to fetch inputs")
  }
  const data: ConfigInputs = await res.json()
  return data
}

export async function calculateSalary(
  request: CalcRequest
): Promise<CalculationResult> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  const data: CalculationResult | ApiError = await res.json()

  if (!res.ok) {
    const error = data as ApiError
    throw new Error(error.details || error.error || "Calculation failed")
  }

  return data as CalculationResult
}

// Country display names
export const COUNTRY_NAMES: Record<string, string> = {
  nl: "Netherlands",
  ch: "Switzerland",
  us: "United States",
  de: "Germany",
  gb: "United Kingdom",
  uk: "United Kingdom",
  fr: "France",
  es: "Spain",
  pt: "Portugal",
  it: "Italy",
  ie: "Ireland",
  sg: "Singapore",
  hk: "Hong Kong",
  ae: "UAE",
  au: "Australia",
  ca: "Canada",
}

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toLowerCase()] || code.toUpperCase()
}
