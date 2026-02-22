/**
 * Detect user's country from browser signals.
 * Prioritises timezone (physical location) over locale (UI language preference).
 * Returns ISO 3166-1 alpha-2 country code.
 */
export function detectUserCountry(): string {
  if (typeof window === "undefined") {
    return "de" // Server-side fallback
  }

  const supportedCountries = [
    "au", "ca", "ch", "de", "dk", "es", "fr", "gb", "ie", "it",
    "jp", "kr", "nl", "no", "nz", "pt", "se", "sg", "us",
  ]

  try {
    // 1. Timezone is the best proxy for physical location — use it first.
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Map common timezones to countries
    const timezoneMap: Record<string, string> = {
      "Europe/Berlin": "de",
      "Europe/Paris": "fr",
      "Europe/Amsterdam": "nl",
      "Europe/London": "gb",
      "Europe/Madrid": "es",
      "Europe/Rome": "it",
      "Europe/Zurich": "ch",
      "Europe/Stockholm": "se",
      "Europe/Copenhagen": "dk",
      "Europe/Oslo": "no",
      "Europe/Dublin": "ie",
      "Europe/Lisbon": "pt",
      "America/New_York": "us",
      "America/Los_Angeles": "us",
      "America/Chicago": "us",
      "America/Denver": "us",
      "America/Toronto": "ca",
      "America/Vancouver": "ca",
      "Asia/Tokyo": "jp",
      "Asia/Seoul": "kr",
      "Asia/Singapore": "sg",
      "Australia/Sydney": "au",
      "Pacific/Auckland": "nz",
    }

    if (timezone && timezoneMap[timezone]) {
      return timezoneMap[timezone]
    }

    // Broader timezone-prefix fallbacks
    if (timezone) {
      if (timezone.startsWith("Europe/")) return "de"
      if (timezone.startsWith("America/")) return "us"
      if (timezone.startsWith("Asia/")) return "sg"
      if (timezone.startsWith("Australia/")) return "au"
      if (timezone.startsWith("Pacific/")) return "nz"
    }

    // 2. Locale as last resort — only trust the region tag when the language
    //    is NOT English, because English speakers appear worldwide and
    //    `navigator.language` reflects UI preference, not physical location.
    const navigatorWithUserLanguage = navigator as Navigator & { userLanguage?: string }
    const locale = navigator.language || navigatorWithUserLanguage.userLanguage || ""
    const parts = locale.split("-")
    if (parts.length === 2 && parts[0].toLowerCase() !== "en") {
      const countryCode = parts[1].toLowerCase()
      if (supportedCountries.includes(countryCode)) {
        return countryCode
      }
    }
  } catch (error) {
    console.warn("Failed to detect user country:", error)
  }

  // Final fallback
  return "de"
}
