// Country metadata including flags and display information

/**
 * Country flag emojis using Unicode
 * Map of country code to flag emoji
 */
export const COUNTRY_FLAGS: Record<string, string> = {
  nl: "🇳🇱",
  de: "🇩🇪",
  ch: "🇨🇭",
  us: "🇺🇸",
  gb: "🇬🇧",
  uk: "🇬🇧",
  fr: "🇫🇷",
  it: "🇮🇹",
  es: "🇪🇸",
  pt: "🇵🇹",
  ie: "🇮🇪",
  sg: "🇸🇬",
  ae: "🇦🇪",
  au: "🇦🇺",
  bg: "🇧🇬",
  ca: "🇨🇦",
  hk: "🇭🇰",
  jp: "🇯🇵",
}

/**
 * Get flag emoji for a country code
 */
export function getCountryFlag(countryCode: string): string {
  return COUNTRY_FLAGS[countryCode.toLowerCase()] || "🏳️"
}

/**
 * Extended country metadata
 */
export interface CountryMetadata {
  code: string
  name: string
  flag: string
  currency: string
}

/**
 * Get complete metadata for a country
 */
export function getCountryMetadata(countryCode: string): CountryMetadata | null {
  const code = countryCode.toLowerCase()
  const flag = getCountryFlag(code)

  // Map to currency (approximate, actual currency comes from config)
  const currencyMap: Record<string, string> = {
    nl: "EUR",
    de: "EUR",
    fr: "EUR",
    it: "EUR",
    es: "EUR",
    pt: "EUR",
    ie: "EUR",
    ch: "CHF",
    us: "USD",
    gb: "GBP",
    uk: "GBP",
    sg: "SGD",
    ae: "AED",
    au: "AUD",
    bg: "BGN",
    ca: "CAD",
    hk: "HKD",
    jp: "JPY",
  }

  const nameMap: Record<string, string> = {
    nl: "Netherlands",
    de: "Germany",
    ch: "Switzerland",
    us: "United States",
    gb: "United Kingdom",
    uk: "United Kingdom",
    fr: "France",
    it: "Italy",
    es: "Spain",
    pt: "Portugal",
    ie: "Ireland",
    sg: "Singapore",
    ae: "UAE",
    au: "Australia",
    bg: "Bulgaria",
    ca: "Canada",
    hk: "Hong Kong",
    jp: "Japan",
  }

  return {
    code,
    name: nameMap[code] || code.toUpperCase(),
    flag,
    currency: currencyMap[code] || "EUR",
  }
}
