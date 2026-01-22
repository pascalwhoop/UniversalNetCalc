import { describe, it, expect } from 'vitest'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { CalculationEngine } from '../src/engine'
import { ConfigLoader } from '../src/config-loader'
import type { TestVector } from '../../schema/src/config-types'

const configsPath = join(process.cwd(), 'configs')
const loader = new ConfigLoader(configsPath)

/**
 * Automatically discover and run all test vectors from config files
 */
async function discoverTests(): Promise<
  Array<{
    country: string
    year: string
    variant?: string
    testFile: string
    testVector: TestVector
  }>
> {
  const tests: Array<{
    country: string
    year: string
    variant?: string
    testFile: string
    testVector: TestVector
  }> = []

  try {
    const countries = await readdir(configsPath, { withFileTypes: true })

    for (const countryDir of countries) {
      if (!countryDir.isDirectory()) continue

      const country = countryDir.name
      const countryPath = join(configsPath, country)

      const years = await readdir(countryPath, { withFileTypes: true })

      for (const yearDir of years) {
        if (!yearDir.isDirectory()) continue

        const year = yearDir.name
        const testsPath = join(countryPath, year, 'tests')

        try {
          const testFiles = await readdir(testsPath)

          for (const testFile of testFiles) {
            if (!testFile.endsWith('.json')) continue

            const testPath = join(testsPath, testFile)
            const testContent = await readFile(testPath, 'utf-8')
            const testVector: TestVector = JSON.parse(testContent)

            tests.push({
              country,
              year,
              variant: testVector.variant,
              testFile,
              testVector,
            })
          }
        } catch (e) {
          // No tests directory or can't read it - skip
        }
      }
    }
  } catch (e) {
    console.error('Error discovering tests:', e)
  }

  return tests
}

describe('Config Test Vectors', async () => {
  const tests = await discoverTests()

  if (tests.length === 0) {
    it('should find at least one test vector', () => {
      expect(tests.length).toBeGreaterThan(0)
    })
    return
  }

  for (const test of tests) {
    const testName = `${test.country}/${test.year} - ${test.testVector.name}`

    it(testName, async () => {
      // Load config
      const config = await loader.loadConfig(test.country, test.year, test.variant)

      // Create engine and calculate
      const engine = new CalculationEngine(config)
      const result = engine.calculate(test.testVector.inputs)

      // Get tolerances
      const absTolerance = test.testVector.tolerance || 0
      const pctTolerance = test.testVector.tolerance_percent || 0

      // Helper to check if value is within tolerance
      const withinTolerance = (actual: number, expected: number): boolean => {
        const absDiff = Math.abs(actual - expected)

        if (absDiff <= absTolerance) return true

        if (pctTolerance > 0) {
          const pctDiff = Math.abs((actual - expected) / expected)
          if (pctDiff <= pctTolerance) return true
        }

        return false
      }

      // Check net income
      expect(
        withinTolerance(result.net, test.testVector.expected.net),
        `Net income: expected ${test.testVector.expected.net}, got ${result.net} (diff: ${Math.abs(result.net - test.testVector.expected.net)})`
      ).toBe(true)

      // Check effective rate
      expect(
        withinTolerance(result.effective_rate, test.testVector.expected.effective_rate),
        `Effective rate: expected ${test.testVector.expected.effective_rate}, got ${result.effective_rate} (diff: ${Math.abs(result.effective_rate - test.testVector.expected.effective_rate)})`
      ).toBe(true)

      // Check breakdown items if specified
      if (test.testVector.expected.breakdown) {
        for (const [itemId, expectedAmount] of Object.entries(
          test.testVector.expected.breakdown
        )) {
          // Skip if it's an empty array (like UAE tests have)
          if (Array.isArray(expectedAmount) && expectedAmount.length === 0) {
            continue
          }

          // Skip if it's an array at all - we expect individual item amounts
          if (Array.isArray(expectedAmount)) {
            continue
          }

          const breakdownItem = result.breakdown.find(
            (item) => item.id === itemId || item.label === itemId
          )

          expect(
            breakdownItem,
            `Breakdown item "${itemId}" not found in result`
          ).toBeDefined()

          if (breakdownItem) {
            expect(
              withinTolerance(breakdownItem.amount, expectedAmount as number),
              `Breakdown ${itemId}: expected ${expectedAmount}, got ${breakdownItem.amount} (diff: ${Math.abs(breakdownItem.amount - (expectedAmount as number))})`
            ).toBe(true)
          }
        }
      }
    })
  }
})
