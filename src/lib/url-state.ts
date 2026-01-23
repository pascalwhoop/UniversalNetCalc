// URL state management for shareable links

import { ComparisonState, CalculationState } from "./types"

/**
 * Encode comparison state to URL search params
 * Format: ?c=nl-2025-60000-single,de-2025-60000-married&v=nl:30-ruling
 */
export function encodeState(state: ComparisonState): string {
  const params = new URLSearchParams()

  if (state.countries.length === 0) {
    return ""
  }

  // Encode countries: code-year-gross[-formValue1-formValue2...]
  const countryStrings = state.countries.map((country) => {
    const parts = [
      country.country,
      country.year,
      country.gross_annual || "",
    ]

    // Add other form values (excluding gross_annual)
    for (const [key, value] of Object.entries(country.formValues)) {
      if (key !== "gross_annual" && value) {
        parts.push(`${key}:${value}`)
      }
    }

    return parts.join("-")
  })

  params.set("c", countryStrings.join(","))

  // Encode variants separately: code:variant,code:variant
  const variantStrings = state.countries
    .filter((c) => c.variant)
    .map((c) => `${c.country}:${c.variant}`)

  if (variantStrings.length > 0) {
    params.set("v", variantStrings.join(","))
  }

  return params.toString()
}

/**
 * Decode URL search params to comparison state
 */
export function decodeState(searchParams: URLSearchParams): ComparisonState | null {
  // Support both formats:
  // - ?c=nl-2025-60000,de-2025 (full format)
  // - ?countries=us-ca,ch-zh,nl (preset format)
  const countriesParam = searchParams.get("c") || searchParams.get("countries")
  const variantsParam = searchParams.get("v")

  if (!countriesParam) {
    return null
  }

  // Parse variants into a map
  const variantsMap = new Map<string, string>()
  if (variantsParam) {
    const variantPairs = variantsParam.split(",")
    for (const pair of variantPairs) {
      const [code, variant] = pair.split(":")
      if (code && variant) {
        variantsMap.set(code, variant)
      }
    }
  }

  // Parse countries
  const countryStrings = countriesParam.split(",")
  const countries: CalculationState[] = []

  for (const countryStr of countryStrings) {
    const parts = countryStr.split("-")
    if (parts.length < 1) continue

    const [country, year, gross, ...formParts] = parts

    // Handle preset format (just country code or country-year)
    // Full format: country-year-gross-formKey:value-...
    // Preset format: country or country-year

    // Parse form values
    const formValues: Record<string, string> = {}
    if (gross) {
      formValues.gross_annual = gross
    }

    for (const part of formParts) {
      if (part.includes(":")) {
        const [key, value] = part.split(":")
        if (key && value) {
          formValues[key] = value
        }
      }
    }

    countries.push({
      country,
      year: year || "", // Year can be empty for presets, will be auto-selected
      gross_annual: gross || "",
      variant: variantsMap.get(country),
      formValues,
    })
  }

  return {
    countries,
    timestamp: Date.now(),
  }
}

/**
 * Update browser URL with current state (without navigation)
 */
export function updateURL(state: ComparisonState, replace = true) {
  if (typeof window === "undefined") return

  const encoded = encodeState(state)
  const url = encoded ? `?${encoded}` : window.location.pathname

  if (replace) {
    window.history.replaceState({}, "", url)
  } else {
    window.history.pushState({}, "", url)
  }
}

/**
 * Parse current URL search params
 */
export function parseURL(): ComparisonState | null {
  if (typeof window === "undefined") return null

  const params = new URLSearchParams(window.location.search)
  return decodeState(params)
}

/**
 * Get shareable URL for current state
 */
export function getShareableURL(state: ComparisonState): string {
  if (typeof window === "undefined") return ""

  const encoded = encodeState(state)
  const baseUrl = window.location.origin + window.location.pathname
  return encoded ? `${baseUrl}?${encoded}` : baseUrl
}
