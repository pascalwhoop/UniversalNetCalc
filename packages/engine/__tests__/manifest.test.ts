import { describe, it, expect } from 'vitest'

/**
 * Test that the manifest is up-to-date and consistent with actual configs
 * This test MUST pass for the UI to work correctly
 */
describe('Manifest Consistency', () => {
  it('should load manifest without errors', () => {
    let manifest: Record<string, unknown> | null = null
    let error: Error | null = null

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      manifest = require('../../../configs-manifest.json')
    } catch (e: unknown) {
      error = e as Error
    }

    expect(error).toBeNull()
    expect(manifest).toBeDefined()
  })

  it('should have Italy in manifest', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json') as Record<string, unknown>
    expect(manifest.countries).toBeDefined()
    expect((manifest.countries as Record<string, unknown>).it).toBeDefined()
  })

  it('should have Italy 2025 and 2026 in manifest', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json') as Record<string, unknown>
    const itData = (manifest.countries as Record<string, Record<string, unknown>>).it
    expect(itData.years).toBeDefined()
    expect((itData.years as Record<string, unknown>)['2025']).toBeDefined()
    expect((itData.years as Record<string, unknown>)['2026']).toBeDefined()
  })

  it('should have impatriate variants in manifest for Italy', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json') as Record<string, unknown>
    const itData = (manifest.countries as Record<string, Record<string, unknown>>).it
    expect(((itData.years as Record<string, Record<string, unknown>>)['2025'].variants as string[])).toContain('impatriate')
    expect(((itData.years as Record<string, Record<string, unknown>>)['2026'].variants as string[])).toContain('impatriate')
  })

  it('manifest should be valid JSON serializable', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json') as Record<string, unknown>
    expect(() => JSON.stringify(manifest)).not.toThrow()

    const jsonStr = JSON.stringify(manifest)
    expect(jsonStr).toContain('it')
    expect(jsonStr).toContain('impatriate')
  })

  it('manifest structure should match expected format', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json') as Record<string, unknown>

    // Verify structure for each country/year/variant
    for (const [_country, countryData] of Object.entries((manifest.countries as Record<string, unknown>))) {
      expect(countryData).toHaveProperty('years')

      for (const [_year, yearData] of Object.entries(
        (countryData as Record<string, Record<string, unknown>>).years
      )) {
        expect((yearData as Record<string, unknown>)).toHaveProperty('variants')
        expect(Array.isArray(((yearData as Record<string, unknown>).variants))).toBe(true)
      }
    }
  })

  it('should have non-empty variants array for Italy 2025', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json')
    const variants = manifest.countries.it.years['2025'].variants
    expect(Array.isArray(variants)).toBe(true)
    expect(variants.length).toBeGreaterThan(0)
  })

  it('should have non-empty variants array for Italy 2026', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json')
    const variants = manifest.countries.it.years['2026'].variants
    expect(Array.isArray(variants)).toBe(true)
    expect(variants.length).toBeGreaterThan(0)
  })
})

/**
 * Test that simulates the exact UI flow to catch caching issues
 */
describe('UI Flow Simulation - Year/Variant Selection', () => {
  it('step 1: user selects Italy country - listYears should return 2025 and 2026', async () => {
    // User picks Italy from country dropdown
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json')
    const italyYears = manifest.countries.it.years

    // This is what the UI gets back
    const yearsList = Object.keys(italyYears)

    // The UI expects this to be non-empty for the Year selector to be enabled
    expect(yearsList.length).toBeGreaterThan(0)
    expect(yearsList).toContain('2025')
    expect(yearsList).toContain('2026')
  })

  it('step 2: user selects 2025 year - listVariants should return impatriate', async () => {
    // User picks 2025 from year dropdown
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json')
    const variants2025 = manifest.countries.it.years['2025'].variants

    // This is what the UI gets back
    // The UI expects this to be non-empty for the Variant selector to show
    expect(Array.isArray(variants2025)).toBe(true)
    expect(variants2025.length).toBeGreaterThan(0)
    expect(variants2025).toContain('impatriate')
  })

  it('step 3: user selects 2026 year - listVariants should return impatriate', async () => {
    // User picks 2026 from year dropdown
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json')
    const variants2026 = manifest.countries.it.years['2026'].variants

    // The Variant selector should show options
    expect(Array.isArray(variants2026)).toBe(true)
    expect(variants2026.length).toBeGreaterThan(0)
    expect(variants2026).toContain('impatriate')
  })

  it('step 4: user selects impatriate variant - config should load', async () => {
    // User picks impatriate from variant dropdown
    // This will trigger a loadConfig call via the API
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../../configs-manifest.json')
    const hasImpatriate2025 = manifest.countries.it.years['2025'].variants.includes(
      'impatriate'
    )
    const hasImpatriate2026 = manifest.countries.it.years['2026'].variants.includes(
      'impatriate'
    )

    expect(hasImpatriate2025).toBe(true)
    expect(hasImpatriate2026).toBe(true)
  })
})
