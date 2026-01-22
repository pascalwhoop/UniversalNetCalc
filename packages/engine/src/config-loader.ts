import { readFile } from 'fs/promises'
import { join } from 'path'
import { parse } from 'yaml'
import type { TaxConfig } from '../../schema/src/config-types'

export class ConfigLoader {
  private configsPath: string
  private cache: Map<string, TaxConfig>

  constructor(configsPath: string = 'configs') {
    this.configsPath = configsPath
    this.cache = new Map()
  }

  async loadConfig(
    country: string,
    year: string | number,
    variant?: string
  ): Promise<TaxConfig> {
    const cacheKey = `${country}-${year}${variant ? `-${variant}` : ''}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const config = await this.loadConfigFromDisk(country, year, variant)
    this.cache.set(cacheKey, config)

    return config
  }

  private async loadConfigFromDisk(
    country: string,
    year: string | number,
    variant?: string
  ): Promise<TaxConfig> {
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

    // Merge calculations (replace nodes with matching id, handle $delete)
    if (variant.calculations) {
      const variantCalcs = variant.calculations.filter((c: any) => !c.$delete)
      const deleteIds = variant.calculations
        .filter((c: any) => c.$delete)
        .map((c: any) => c.id)

      // Remove deleted nodes
      merged.calculations = merged.calculations.filter(
        (c) => !deleteIds.includes(c.id)
      )

      // Replace or add variant calculations
      for (const variantCalc of variantCalcs) {
        const index = merged.calculations.findIndex((c) => c.id === variantCalc.id)
        if (index >= 0) {
          merged.calculations[index] = variantCalc
        } else {
          merged.calculations.push(variantCalc)
        }
      }
    }

    return merged
  }

  clearCache(): void {
    this.cache.clear()
  }

  async listCountries(): Promise<string[]> {
    const { readdir } = await import('fs/promises')
    try {
      const entries = await readdir(this.configsPath, { withFileTypes: true })
      return entries.filter((e) => e.isDirectory()).map((e) => e.name)
    } catch {
      return []
    }
  }

  async listYears(country: string): Promise<string[]> {
    const { readdir } = await import('fs/promises')
    try {
      const countryPath = join(this.configsPath, country)
      const entries = await readdir(countryPath, { withFileTypes: true })
      return entries.filter((e) => e.isDirectory()).map((e) => e.name)
    } catch {
      return []
    }
  }

  async listVariants(country: string, year: string): Promise<string[]> {
    const { readdir } = await import('fs/promises')
    try {
      const variantsPath = join(this.configsPath, country, year, 'variants')
      const entries = await readdir(variantsPath)
      return entries
        .filter((f) => f.endsWith('.yaml'))
        .map((f) => f.replace('.yaml', ''))
    } catch {
      return []
    }
  }
}
