import { join } from 'path'
import { parse } from 'yaml'
import type { TaxConfig } from '../../schema/src/config-types'

// Import config bundle for production (Cloudflare Workers)
let configBundle: any = null
try {
  configBundle = require('../../../.generated/config-bundle.ts').default
} catch {
  // Bundle not available, will use filesystem
}

// Import the manifest for listing operations
let manifest: any = null
try {
  manifest = require('../../../configs-manifest.json')
} catch {
  // Manifest not available in dev mode
}

export class ConfigLoader {
  private configsPath: string
  private cache: Map<string, TaxConfig>
  private useBundle: boolean

  constructor(configsPath: string = 'configs') {
    this.configsPath = configsPath
    this.cache = new Map()
    // Use bundle if available (production), otherwise use filesystem (dev/test)
    // Never use the bundle in Vitest — tests must read live YAML files so that
    // config changes are reflected immediately without a manual bundle rebuild.
    this.useBundle = configBundle !== null && !process.env.VITEST
  }

  /**
   * Validate country code format (2-letter lowercase ISO 3166-1 alpha-2)
   * Prevents path traversal attacks
   */
  private validateCountry(country: string): void {
    if (!/^[a-z]{2}$/.test(country)) {
      throw new Error(`Invalid country code: ${country}`)
    }
  }

  /**
   * Validate year format (4-digit number)
   * Prevents path traversal attacks
   */
  private validateYear(year: string | number): void {
    const yearStr = year.toString()
    if (!/^\d{4}$/.test(yearStr)) {
      throw new Error(`Invalid year: ${year}`)
    }
  }

  /**
   * Validate variant format (alphanumeric + hyphens only)
   * Prevents path traversal attacks
   */
  private validateVariant(variant: string): void {
    if (!/^[a-z0-9-]+$/.test(variant)) {
      throw new Error(`Invalid variant: ${variant}`)
    }
  }

  async loadConfig(
    country: string,
    year: string | number,
    variant?: string
  ): Promise<TaxConfig> {
    // Validate inputs to prevent path traversal attacks
    this.validateCountry(country)
    this.validateYear(year)
    if (variant) {
      this.validateVariant(variant)
    }

    const cacheKey = `${country}-${year}${variant ? `-${variant}` : ''}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const config = this.useBundle
      ? await this.loadConfigFromBundle(country, year, variant)
      : await this.loadConfigFromDisk(country, year, variant)

    this.cache.set(cacheKey, config)

    return config
  }

  /**
   * Load config from bundled JSON (production/Cloudflare Workers)
   */
  private async loadConfigFromBundle(
    country: string,
    year: string | number,
    variant?: string
  ): Promise<TaxConfig> {
    const yearStr = year.toString()

    if (!configBundle[country]?.[yearStr]) {
      throw new Error(`Config not found: ${country}/${yearStr}`)
    }

    const baseConfig = configBundle[country][yearStr].base

    if (!baseConfig) {
      throw new Error(`Base config not found: ${country}/${yearStr}`)
    }

    // Apply variant if specified
    if (variant) {
      const variantConfig = configBundle[country][yearStr].variants?.[variant]
      if (!variantConfig) {
        throw new Error(`Variant not found: ${country}/${yearStr}/${variant}`)
      }
      return this.mergeConfigs(baseConfig, variantConfig)
    }

    return baseConfig
  }

  /**
   * Load config from YAML files on disk (dev mode)
   */
  private async loadConfigFromDisk(
    country: string,
    year: string | number,
    variant?: string
  ): Promise<TaxConfig> {
    const { readFile } = await import('fs/promises')
    const configDir = join(this.configsPath, country, year.toString())

    // Load base config
    const basePath = join(configDir, 'base.yaml')
    const baseYaml = await readFile(basePath, 'utf-8')
    let config: TaxConfig = parse(baseYaml)

    // Apply variant if specified
    if (variant) {
      const variantPath = join(configDir, 'variants', `${variant}.yaml`)
      const variantYaml = await readFile(variantPath, 'utf-8')
      const variantConfig = parse(variantYaml)

      config = this.mergeConfigs(config, variantConfig)
    }

    return config
  }

  private mergeConfigs(base: TaxConfig, variant: any): TaxConfig {
    // Deep merge variant onto base
    const merged = JSON.parse(JSON.stringify(base)) // Deep clone

    // Merge meta
    if (variant.meta) {
      merged.meta = { ...merged.meta, ...variant.meta }
    }

    // Merge or replace notices
    if (variant.notices) {
      if (!merged.notices) {
        merged.notices = []
      }
      merged.notices = [...merged.notices, ...variant.notices]
    }

    // Merge parameters (replace)
    if (variant.parameters) {
      merged.parameters = { ...merged.parameters, ...variant.parameters }
    }

    // Merge inputs (replace)
    if (variant.inputs) {
      merged.inputs = { ...merged.inputs, ...variant.inputs }
    }

    // Merge calculations (replace nodes with matching id, handle $delete)
    if (variant.calculations) {
      const variantCalcs = variant.calculations.filter((c: any) => !c.$delete)
      const deleteIds = variant.calculations
        .filter((c: any) => c.$delete)
        .map((c: any) => c.id)

      // Remove deleted nodes
      merged.calculations = merged.calculations.filter(
        (c: any) => !deleteIds.includes(c.id)
      )

      // Replace or add variant calculations
      for (const variantCalc of variantCalcs) {
        const index = merged.calculations.findIndex((c: any) => c.id === variantCalc.id)
        if (index >= 0) {
          merged.calculations[index] = variantCalc
        } else {
          merged.calculations.push(variantCalc)
        }
      }
    }

    // Merge outputs (replace if variant defines it)
    if (variant.outputs) {
      merged.outputs = { ...merged.outputs, ...variant.outputs }

      // Deep merge breakdown if both exist
      if (merged.outputs.breakdown && variant.outputs.breakdown) {
        merged.outputs.breakdown = {
          ...merged.outputs.breakdown,
          ...variant.outputs.breakdown
        }
      }
    }

    return merged
  }

  clearCache(): void {
    this.cache.clear()
  }

  async listCountries(): Promise<string[]> {
    // Use manifest if available (Cloudflare Workers)
    if (manifest && manifest.countries) {
      return Object.keys(manifest.countries)
    }

    // Fallback to fs operations (dev mode)
    const { readdir } = await import('fs/promises')
    try {
      const entries = await readdir(this.configsPath, { withFileTypes: true })
      return entries.filter((e) => e.isDirectory()).map((e) => e.name)
    } catch (error) {
      console.error('Error listing countries:', error)
      return []
    }
  }

  async listYears(country: string): Promise<string[]> {
    // Validate input to prevent path traversal
    this.validateCountry(country)

    // Use manifest if available (Cloudflare Workers)
    if (manifest && manifest.countries?.[country]?.years) {
      return Object.keys(manifest.countries[country].years)
    }

    // Fallback to fs operations (dev mode)
    const { readdir } = await import('fs/promises')
    try {
      const countryPath = join(this.configsPath, country)
      const entries = await readdir(countryPath, { withFileTypes: true })
      return entries.filter((e) => e.isDirectory()).map((e) => e.name)
    } catch (error) {
      console.error(`Error listing years for ${country}:`, error)
      return []
    }
  }

  async listVariants(country: string, year: string): Promise<string[]> {
    // Validate inputs to prevent path traversal
    this.validateCountry(country)
    this.validateYear(year)

    // Use manifest if available (Cloudflare Workers)
    if (manifest && manifest.countries?.[country]?.years?.[year]?.variants) {
      return manifest.countries[country].years[year].variants
    }

    // Fallback to fs operations (dev mode)
    const { readdir } = await import('fs/promises')
    try {
      const variantsPath = join(this.configsPath, country, year, 'variants')
      const entries = await readdir(variantsPath)
      return entries
        .filter((f) => f.endsWith('.yaml'))
        .map((f) => f.replace('.yaml', ''))
    } catch (error) {
      console.error(`Error listing variants for ${country}/${year}:`, error)
      return []
    }
  }
}
