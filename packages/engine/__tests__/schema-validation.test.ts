/**
 * Schema validation test: every YAML config file is validated against the Zod schema.
 * Base configs must satisfy TaxConfigSchema; variant configs must satisfy VariantConfigSchema.
 *
 * This runs as part of `npm run test:configs`.
 */
import { describe, it, expect } from 'vitest'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { parse } from 'yaml'
import { TaxConfigSchema, VariantConfigSchema } from '../../schema/src/config-types'
import type { ZodError } from 'zod'

const configsPath = join(process.cwd(), 'configs')

interface ConfigFile {
  country: string
  year: string
  file: string // relative path from configsPath
  isVariant: boolean
}

async function discoverConfigs(): Promise<ConfigFile[]> {
  const configs: ConfigFile[] = []

  const countries = await readdir(configsPath, { withFileTypes: true })
  for (const countryDir of countries) {
    if (!countryDir.isDirectory()) continue
    const country = countryDir.name
    const countryPath = join(configsPath, country)

    const years = await readdir(countryPath, { withFileTypes: true })
    for (const yearDir of years) {
      if (!yearDir.isDirectory()) continue
      const year = yearDir.name
      const yearPath = join(countryPath, year)

      // Base config
      configs.push({
        country,
        year,
        file: join(country, year, 'base.yaml'),
        isVariant: false,
      })

      // Variant configs
      const variantsPath = join(yearPath, 'variants')
      try {
        const variants = await readdir(variantsPath)
        for (const variant of variants) {
          if (!variant.endsWith('.yaml')) continue
          configs.push({
            country,
            year,
            file: join(country, year, 'variants', variant),
            isVariant: true,
          })
        }
      } catch {
        // No variants directory - fine
      }
    }
  }

  return configs
}

function formatZodError(err: ZodError): string {
  return err.issues
    .map((issue) => `  [${issue.path.join('.')}] ${issue.message}`)
    .join('\n')
}

describe('Config Schema Validation', async () => {
  const configs = await discoverConfigs()

  if (configs.length === 0) {
    it('should find at least one config file', () => {
      expect(configs.length).toBeGreaterThan(0)
    })
    return
  }

  for (const cfg of configs) {
    const label = cfg.isVariant
      ? `${cfg.country}/${cfg.year}/variants/${cfg.file.split('/').pop()}`
      : `${cfg.country}/${cfg.year}/base.yaml`

    it(`schema: ${label}`, async () => {
      const fullPath = join(configsPath, cfg.file)
      const raw = await readFile(fullPath, 'utf-8')
      const parsed = parse(raw)

      const schema = cfg.isVariant ? VariantConfigSchema : TaxConfigSchema
      const result = schema.safeParse(parsed)

      if (!result.success) {
        throw new Error(
          `Schema validation failed for ${label}:\n${formatZodError(result.error)}`
        )
      }

      expect(result.success).toBe(true)
    })
  }
})
