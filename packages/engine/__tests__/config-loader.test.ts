import { describe, it, expect, beforeAll } from 'vitest'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { ConfigLoader } from '../src/config-loader'

const configsPath = join(process.cwd(), 'configs')
const loader = new ConfigLoader(configsPath)

describe('ConfigLoader - Regression Tests', () => {
  describe('listCountries', () => {
    it('should return non-empty list of countries', async () => {
      const countries = await loader.listCountries()
      expect(countries.length).toBeGreaterThan(0)
    })

    it('should include Italy', async () => {
      const countries = await loader.listCountries()
      expect(countries).toContain('it')
    })

    it('should not include duplicate countries', async () => {
      const countries = await loader.listCountries()
      const uniqueCountries = new Set(countries)
      expect(uniqueCountries.size).toBe(countries.length)
    })
  })

  describe('listYears', () => {
    it('should return years for Netherlands', async () => {
      const years = await loader.listYears('nl')
      expect(years.length).toBeGreaterThan(0)
      expect(years).toContain('2025')
    })

    it('should return years for Italy - REGRESSION TEST for selector issue', async () => {
      // Regression test: This was failing because manifest wasn't regenerated
      // when Italy configs were added
      const years = await loader.listYears('it')
      expect(years).toBeDefined()
      expect(years.length).toBeGreaterThan(0)
      expect(years).toContain('2025')
      expect(years).toContain('2026')
    })

    it('should return empty array for non-existent country', async () => {
      // 'xx' is a valid 2-letter code format but not a real country directory
      const years = await loader.listYears('xx')
      expect(years).toEqual([])
    })

    it('should not return duplicate years', async () => {
      const years = await loader.listYears('it')
      const uniqueYears = new Set(years)
      expect(uniqueYears.size).toBe(years.length)
    })
  })

  describe('listVariants', () => {
    it('should return variants for Netherlands 2025', async () => {
      const variants = await loader.listVariants('nl', '2025')
      expect(variants).toContain('30-ruling')
    })

    it('should return variants for Italy 2025 - REGRESSION TEST for variant toggle', async () => {
      // Regression test: This was failing because variants weren't being listed
      // properly due to stale manifest
      const variants = await loader.listVariants('it', '2025')
      expect(variants).toBeDefined()
      expect(Array.isArray(variants)).toBe(true)
      expect(variants).toContain('impatriate')
    })

    it('should return variants for Italy 2026', async () => {
      const variants = await loader.listVariants('it', '2026')
      expect(variants).toContain('impatriate')
    })

    it('should return empty array for country with no variants', async () => {
      const variants = await loader.listVariants('ae', '2025')
      expect(Array.isArray(variants)).toBe(true)
      expect(variants.length).toBe(0)
    })

    it('should not return duplicate variants', async () => {
      const variants = await loader.listVariants('it', '2025')
      const uniqueVariants = new Set(variants)
      expect(uniqueVariants.size).toBe(variants.length)
    })
  })

  describe('loadConfig', () => {
    it('should load Italy base config 2025', async () => {
      const config = await loader.loadConfig('it', '2025')
      expect(config).toBeDefined()
      expect(config.meta.country).toBe('it')
      expect(config.meta.year).toBe(2025)
      expect(config.inputs).toBeDefined()
      expect(config.calculations).toBeDefined()
    })

    it('should load Italy base config 2026', async () => {
      const config = await loader.loadConfig('it', '2026')
      expect(config).toBeDefined()
      expect(config.meta.country).toBe('it')
      expect(config.meta.year).toBe(2026)
    })

    it('should load Italy impatriate variant 2025', async () => {
      const config = await loader.loadConfig('it', '2025', 'impatriate')
      expect(config).toBeDefined()
      expect(config.meta.variant).toBe('impatriate')
    })

    it('should load Italy impatriate variant 2026', async () => {
      const config = await loader.loadConfig('it', '2026', 'impatriate')
      expect(config).toBeDefined()
      expect(config.meta.variant).toBe('impatriate')
    })

    it('should cache configs after first load', async () => {
      const cache = new ConfigLoader(configsPath)
      const config1 = await cache.loadConfig('nl', '2025')
      const config2 = await cache.loadConfig('nl', '2025')
      expect(config1).toBe(config2) // Same reference (cached)
    })
  })

  describe('Manifest Consistency', () => {
    let actualCountries: Record<string, Record<string, string[]>> = {}

    beforeAll(async () => {
      // Build actual directory structure
      const countries = await readdir(configsPath, { withFileTypes: true })
      for (const countryDir of countries) {
        if (!countryDir.isDirectory()) continue
        const country = countryDir.name
        const countryPath = join(configsPath, country)
        actualCountries[country] = {}

        const years = await readdir(countryPath, { withFileTypes: true })
        for (const yearDir of years) {
          if (!yearDir.isDirectory()) continue
          const year = yearDir.name
          const yearPath = join(countryPath, year)

          // Get variants
          try {
            const variantFiles = await readdir(join(yearPath, 'variants'))
            actualCountries[country][year] = variantFiles
              .filter((f) => f.endsWith('.yaml'))
              .map((f) => f.replace('.yaml', ''))
          } catch {
            actualCountries[country][year] = []
          }
        }
      }
    })

    it('should have Italy in config directory', () => {
      expect(actualCountries['it']).toBeDefined()
    })

    it('should have Italy 2025 and 2026 config directories', () => {
      expect(actualCountries['it']['2025']).toBeDefined()
      expect(actualCountries['it']['2026']).toBeDefined()
    })

    it('should have impatriate variant files for Italy', () => {
      expect(actualCountries['it']['2025']).toContain('impatriate')
      expect(actualCountries['it']['2026']).toContain('impatriate')
    })

    it('loader should return correct years for Italy', async () => {
      const loaderYears = await loader.listYears('it')
      const actualYears = Object.keys(actualCountries['it']).sort()
      expect(loaderYears.sort()).toEqual(actualYears)
    })

    it('loader should return correct variants for Italy 2025', async () => {
      const loaderVariants = (await loader.listVariants('it', '2025')).sort()
      const actualVariants = (actualCountries['it']['2025'] || []).sort()
      expect(loaderVariants).toEqual(actualVariants)
    })

    it('loader should return correct variants for Italy 2026', async () => {
      const loaderVariants = (await loader.listVariants('it', '2026')).sort()
      const actualVariants = (actualCountries['it']['2026'] || []).sort()
      expect(loaderVariants).toEqual(actualVariants)
    })

    it('should return consistent data across multiple calls', async () => {
      const years1 = await loader.listYears('it')
      const years2 = await loader.listYears('it')
      expect(years1).toEqual(years2)

      const variants1 = await loader.listVariants('it', '2025')
      const variants2 = await loader.listVariants('it', '2025')
      expect(variants1).toEqual(variants2)
    })
  })

  describe('UI Integration - Selector Availability', () => {
    it('Italy should have selectable years (not empty array)', async () => {
      const years = await loader.listYears('it')
      // This ensures the year selector would not be disabled
      expect(years.length).toBeGreaterThan(0)
    })

    it('Italy 2025 should have selectable variants (not empty array)', async () => {
      const variants = await loader.listVariants('it', '2025')
      // This ensures the variant selector would be enabled
      expect(Array.isArray(variants)).toBe(true)
      expect(variants.length).toBeGreaterThan(0)
    })

    it('Italy 2026 should have selectable variants', async () => {
      const variants = await loader.listVariants('it', '2026')
      expect(Array.isArray(variants)).toBe(true)
      expect(variants.length).toBeGreaterThan(0)
    })

    it('all Italy variants should be loadable', async () => {
      const variants2025 = await loader.listVariants('it', '2025')
      for (const variant of variants2025) {
        const config = await loader.loadConfig('it', '2025', variant)
        expect(config).toBeDefined()
        expect(config.meta.variant).toBe(variant)
      }

      const variants2026 = await loader.listVariants('it', '2026')
      for (const variant of variants2026) {
        const config = await loader.loadConfig('it', '2026', variant)
        expect(config).toBeDefined()
        expect(config.meta.variant).toBe(variant)
      }
    })
  })
})
