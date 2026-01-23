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

export async function fetchCountries(signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(`${API_BASE}?action=countries`, { signal })
  if (!res.ok) {
    throw new Error("Failed to fetch countries")
  }
  const data: { countries: string[] } = await res.json()
  return data.countries
}

export async function fetchYears(country: string, signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(`${API_BASE}?action=years&country=${country}`, { signal })
  if (!res.ok) {
    throw new Error("Failed to fetch years")
  }
  const data: { years: string[] } = await res.json()
  return data.years
}

export async function fetchVariants(
  country: string,
  year: string,
  signal?: AbortSignal
): Promise<string[]> {
  const res = await fetch(
    `${API_BASE}?action=variants&country=${country}&year=${year}`,
    { signal }
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
  variant?: string,
  signal?: AbortSignal
): Promise<ConfigInputs> {
  const url = variant
    ? `${API_BASE}?action=inputs&country=${country}&year=${year}&variant=${variant}`
    : `${API_BASE}?action=inputs&country=${country}&year=${year}`
  const res = await fetch(url, { signal })
  if (!res.ok) {
    throw new Error("Failed to fetch inputs")
  }
  const data: ConfigInputs = await res.json()
  return data
}

export async function calculateSalary(
  request: CalcRequest,
  signal?: AbortSignal
): Promise<CalculationResult> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    signal,
  })

  const data: CalculationResult | ApiError = await res.json()

  if (!res.ok) {
    const error = data as ApiError
    throw new Error(error.details || error.error || "Calculation failed")
  }

  return data as CalculationResult
}

// Currency symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  CAD: "C$",
  AUD: "A$",
  SGD: "S$",
  HKD: "HK$",
  AED: "AED",
  JPY: "¥",
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code
}

// Exchange rate API
export interface ExchangeRateResponse {
  from: string
  to: string
  rate: number
  cached: boolean
  fetchedAt: string
  expiresAt: string
}

export async function fetchExchangeRate(
  from: string,
  to: string,
  signal?: AbortSignal
): Promise<number> {
  if (from.toUpperCase() === to.toUpperCase()) {
    return 1
  }

  const res = await fetch(`/api/exchange-rates?from=${from}&to=${to}`, { signal })
  if (!res.ok) {
    const errorText = await res.text()
    const error = new Error(`Failed to fetch exchange rate: ${errorText}`)
    throw error
  }
  const data: ExchangeRateResponse = await res.json()
  return data.rate
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
  bg: "Bulgaria",
}

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toLowerCase()] || code.toUpperCase()
}
