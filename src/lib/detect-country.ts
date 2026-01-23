/**
 * Detect user's country from browser locale
 * Returns ISO 3166-1 alpha-2 country code
 */
export function detectUserCountry(): string {
  if (typeof window === "undefined") {
    return "de" // Server-side fallback
  }

  try {
    // Try to get country from locale
    const navigatorWithUserLanguage = navigator as Navigator & { userLanguage?: string }
    const locale = navigator.language || navigatorWithUserLanguage.userLanguage || "en-DE"

    // Extract country code from locale (e.g., "en-US" -> "US", "de-DE" -> "DE")
    const parts = locale.split("-")
    if (parts.length === 2) {
      const countryCode = parts[1].toLowerCase()

      // List of supported countries (should match available configs)
      const supportedCountries = [
        "au", "ca", "ch", "de", "dk", "es", "fr", "gb", "ie", "it",
        "jp", "kr", "nl", "no", "nz", "pt", "se", "sg", "us"
      ]

      if (supportedCountries.includes(countryCode)) {
        return countryCode
      }
    }

    // Fallback based on timezone
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

    // Check timezone prefix for broader matching
    if (timezone) {
      if (timezone.startsWith("Europe/")) {
        return "de" // Default to Germany for Europe
      } else if (timezone.startsWith("America/")) {
        return "us" // Default to US for Americas
      } else if (timezone.startsWith("Asia/")) {
        return "sg" // Default to Singapore for Asia
      } else if (timezone.startsWith("Australia/")) {
        return "au"
      } else if (timezone.startsWith("Pacific/Auckland")) {
        return "nz"
      }
    }
  } catch (error) {
    console.warn("Failed to detect user country:", error)
  }

  // Final fallback to Germany
  return "de"
}
