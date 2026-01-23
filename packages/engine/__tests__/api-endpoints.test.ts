import { describe, it, expect } from 'vitest'
import { join } from 'path'
import { ConfigLoader } from '../src/config-loader'

const configsPath = join(process.cwd(), 'configs')
const loader = new ConfigLoader(configsPath)

/**
 * These tests verify the API endpoints work correctly
 * This simulates what the frontend calls via /api/calc endpoints
 */
describe('API Endpoints - ConfigLoader Simulation', () => {
  describe('GET /api/calc?action=years&country=it', () => {
    it('should return Italy years for 2025 selector', async () => {
      // Simulates the API call made when user selects Italy
      const years = await loader.listYears('it')

      // The year selector expects a non-empty array
      expect(years.length).toBeGreaterThan(0)
      expect(years).toContain('2025')
      expect(years).toContain('2026')

      // Verify array is valid JSON serializable
      const jsonStr = JSON.stringify({ years })
      expect(jsonStr).toContain('2025')
    })
  })

  describe('GET /api/calc?action=variants&country=it&year=2025', () => {
    it('should return Italy variants for impatriate toggle', async () => {
      // Simulates the API call made when user selects Italy 2025
      const variants = await loader.listVariants('it', '2025')

      // The variant selector expects a non-empty array
      expect(Array.isArray(variants)).toBe(true)
      expect(variants.length).toBeGreaterThan(0)
      expect(variants).toContain('impatriate')

      // Verify array is valid JSON serializable
      const jsonStr = JSON.stringify({ variants })
      expect(jsonStr).toContain('impatriate')
    })

    it('should return Italy variants for 2026', async () => {
      const variants = await loader.listVariants('it', '2026')

      expect(Array.isArray(variants)).toBe(true)
      expect(variants.length).toBeGreaterThan(0)
      expect(variants).toContain('impatriate')

      const jsonStr = JSON.stringify({ variants })
      expect(jsonStr).toContain('impatriate')
    })
  })

  describe('GET /api/calc?action=inputs&country=it&year=2025', () => {
    it('should load config and return inputs for Italy 2025', async () => {
      // Simulates the API call made when region_level_1 selector appears
      const config = await loader.loadConfig('it', '2025')

      expect(config.inputs).toBeDefined()
      expect(typeof config.inputs).toBe('object')

      // Should have region_level_1 for region selection
      expect(config.inputs.region_level_1).toBeDefined()

      // Verify it's JSON serializable
      const jsonStr = JSON.stringify({
        inputs: config.inputs,
        currency: config.meta.currency,
      })
      expect(jsonStr.length).toBeGreaterThan(0)
    })

    it('should have region_level_1 as required enum with all regions', async () => {
      const config = await loader.loadConfig('it', '2025')
      const regionInput = config.inputs.region_level_1

      expect(regionInput.type).toBe('enum')
      expect(regionInput.required).toBe(true)

      if (regionInput.type === 'enum') {
        expect(regionInput.options).toBeDefined()

        // Verify has all 20 Italian regions
        const regionCount = Object.keys(regionInput.options || {}).length
        expect(regionCount).toBeGreaterThanOrEqual(20)
      }
    })
  })

  describe('GET /api/calc?action=inputs&country=it&year=2025&variant=impatriate', () => {
    it('should load config with impatriate variant and return inputs', async () => {
      // Simulates the API call when impatriate variant is selected
      const config = await loader.loadConfig('it', '2025', 'impatriate')

      expect(config.inputs).toBeDefined()
      expect(config.meta.variant).toBe('impatriate')

      // Should still have region_level_1
      expect(config.inputs.region_level_1).toBeDefined()

      // Verify JSON serializable
      const jsonStr = JSON.stringify({
        inputs: config.inputs,
        currency: config.meta.currency,
      })
      expect(jsonStr.length).toBeGreaterThan(0)
    })
  })

  describe('POST /api/calc - Calculate with Italy', () => {
    it('should be able to calculate for Italy 2025 with region', async () => {
      const config = await loader.loadConfig('it', '2025')
      expect(config).toBeDefined()

      // This verifies all the pieces needed for a calculation are present
      expect(config.meta.country).toBe('it')
      expect(config.inputs.gross_annual).toBeDefined()
      expect(config.inputs.region_level_1).toBeDefined()
      expect(config.calculations.length).toBeGreaterThan(0)
      expect(config.outputs).toBeDefined()
    })

    it('should be able to calculate for Italy 2025 with impatriate variant', async () => {
      const config = await loader.loadConfig('it', '2025', 'impatriate')
      expect(config).toBeDefined()

      expect(config.meta.country).toBe('it')
      expect(config.meta.variant).toBe('impatriate')
      expect(config.inputs.gross_annual).toBeDefined()
      expect(config.calculations.length).toBeGreaterThan(0)
    })
  })

  describe('Error scenarios that could cause UI reset', () => {
    it('listYears should never throw, only return empty array', async () => {
      // This is critical - if listYears throws, it breaks the UI
      let error: Error | null = null
      let years: string[] = []

      try {
        years = await loader.listYears('it')
      } catch (e) {
        error = e as Error
      }

      expect(error).toBeNull()
      expect(Array.isArray(years)).toBe(true)
    })

    it('listVariants should never throw, only return empty array', async () => {
      // This is critical - if listVariants throws, it breaks the UI
      let error: Error | null = null
      let variants: string[] = []

      try {
        variants = await loader.listVariants('it', '2025')
      } catch (e) {
        error = e as Error
      }

      expect(error).toBeNull()
      expect(Array.isArray(variants)).toBe(true)
    })

    it('loadConfig should not throw for valid Italy config', async () => {
      let error: Error | null = null

      try {
        await loader.loadConfig('it', '2025')
      } catch (e) {
        error = e as Error
      }

      expect(error).toBeNull()
    })
  })
})
