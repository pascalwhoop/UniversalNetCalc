import { describe, it, expect } from 'vitest'

/**
 * Tests for comparison summary visibility logic (fixes #11)
 *
 * The comparison summary should be visible when:
 * 1. There are 2+ configured countries (loaded from URL)
 * 2. Regardless of whether calculations have completed yet
 *
 * Previously, the check was based on completed results (countryResults.size >= 2),
 * which failed on initial load with pre-configured countries because calculations
 * weren't complete yet.
 */

describe('Comparison Summary Visibility (fixes #11)', () => {
  interface CountryColumnState {
    id: string
    country: string
    year: string
    result: unknown | null
  }

  /**
   * Simulates the visibility check logic after the fix.
   * Should return true if there are 2+ configured countries (country + year set).
   */
  function shouldShowComparisonSummary(countries: CountryColumnState[]): boolean {
    return countries.filter(c => c.country && c.year).length >= 2
  }

  it('should show comparison summary with 2 configured countries, no results yet', () => {
    const countries: CountryColumnState[] = [
      { id: '1', country: 'nl', year: '2025', result: null },
      { id: '2', country: 'de', year: '2025', result: null },
    ]

    expect(shouldShowComparisonSummary(countries)).toBe(true)
  })

  it('should show comparison summary with 3 configured countries, no results yet', () => {
    const countries: CountryColumnState[] = [
      { id: '1', country: 'nl', year: '2025', result: null },
      { id: '2', country: 'de', year: '2025', result: null },
      { id: '3', country: 'fr', year: '2025', result: null },
    ]

    expect(shouldShowComparisonSummary(countries)).toBe(true)
  })

  it('should NOT show comparison summary with only 1 configured country', () => {
    const countries: CountryColumnState[] = [
      { id: '1', country: 'nl', year: '2025', result: null },
    ]

    expect(shouldShowComparisonSummary(countries)).toBe(false)
  })

  it('should NOT show comparison summary with empty countries', () => {
    const countries: CountryColumnState[] = []

    expect(shouldShowComparisonSummary(countries)).toBe(false)
  })

  it('should NOT show comparison summary with unconfigured countries (missing country or year)', () => {
    const countries: CountryColumnState[] = [
      { id: '1', country: 'nl', year: '2025', result: null },
      { id: '2', country: '', year: '2025', result: null }, // Missing country
    ]

    expect(shouldShowComparisonSummary(countries)).toBe(false)
  })

  it('should NOT show comparison summary with partially configured countries', () => {
    const countries: CountryColumnState[] = [
      { id: '1', country: 'nl', year: '', result: null }, // Missing year
      { id: '2', country: '', year: '2025', result: null }, // Missing country
    ]

    expect(shouldShowComparisonSummary(countries)).toBe(false)
  })

  it('should show comparison summary with 2+ countries even after adding a third unconfigured country', () => {
    const countries: CountryColumnState[] = [
      { id: '1', country: 'nl', year: '2025', result: null },
      { id: '2', country: 'de', year: '2025', result: null },
      { id: '3', country: '', year: '', result: null }, // Added but not configured
    ]

    expect(shouldShowComparisonSummary(countries)).toBe(true)
  })

  it('should NOT show comparison summary when removing one country from comparison', () => {
    const countries: CountryColumnState[] = [
      { id: '1', country: 'nl', year: '2025', result: null },
      // Second country removed
    ]

    expect(shouldShowComparisonSummary(countries)).toBe(false)
  })
})
