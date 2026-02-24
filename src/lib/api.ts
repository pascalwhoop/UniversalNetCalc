// API client for the salary calculator
import { CURRENCY_SYMBOLS, getCurrencySymbol, COUNTRY_NAMES, getCountryName } from "./country-metadata"
import { UnsupportedCurrencyError } from "./errors"

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
  marginal_rate?: number // Tax rate on the next earned amount
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
  group?: string // If set, this is a secondary field belonging to the named primary input's group
  // For enum inputs
  options?: Record<string, EnumOption>
}

export interface Notice {
  id: string
  title: string
  body: string
  severity?: "info" | "warning" | "error"
  show_for_variants?: string[]
}

export interface ConfigInputs {
  inputs: Record<string, InputDefinition>
  currency: string
  notices: Notice[]
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

// Export re-exported for backward compatibility
export { CURRENCY_SYMBOLS, getCurrencySymbol }

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
  const data: ExchangeRateResponse | { error?: string; unsupported_currency?: string; message?: string } = await res.json()

  if (!res.ok) {
    // Handle unsupported currency gracefully
    if (res.status === 400 && "unsupported_currency" in data && data.unsupported_currency) {
      throw new UnsupportedCurrencyError(data.unsupported_currency, data.message || "Unsupported currency")
    }
    throw new Error("error" in data && data.error ? data.error : "Failed to fetch exchange rate")
  }

  return (data as ExchangeRateResponse).rate
}

const RATE_CACHE_TTL = 3600_000 // 1 hour
const rateCache = new Map<string, { rate: number; ts: number }>()
const inflight = new Map<string, Promise<number>>()

/** Cached + deduplicated exchange rate. Use this from UI to avoid duplicate requests. */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from.toUpperCase() === to.toUpperCase()) return 1
  const key = `${from.toUpperCase()}:${to.toUpperCase()}`
  const cached = rateCache.get(key)
  if (cached && Date.now() - cached.ts < RATE_CACHE_TTL) return cached.rate

  if (!inflight.has(key)) {
    inflight.set(
      key,
      fetchExchangeRate(from, to).then(rate => {
        rateCache.set(key, { rate, ts: Date.now() })
        inflight.delete(key)
        return rate
      })
    )
  }
  return inflight.get(key)!
}

// Export re-exported for backward compatibility
export { COUNTRY_NAMES, getCountryName }
