import { describe, it, expect } from 'vitest'
import { CalculationEngine } from '../src/engine'
import type { TaxConfig } from '../../schema/src/config-types'

describe('CalculationEngine', () => {
  describe('simple calculations', () => {
    it('should calculate UAE (no tax)', () => {
      const config: TaxConfig = {
        meta: {
          country: 'ae',
          year: 2024,
          currency: 'AED',
          version: '1.0.0',
          sources: [],
          updated_at: '2024-01-01',
        },
        inputs: {
          gross_annual: {
            type: 'number',
            required: true,
          },
        },
        parameters: {},
        calculations: [
          {
            id: 'net_annual',
            type: 'identity',
            value: '@gross_annual',
          },
        ],
        outputs: {
          gross: '@gross_annual',
          net: '$net_annual',
          effective_rate: 0,
          breakdown: {},
        },
      }

      const engine = new CalculationEngine(config)
      const result = engine.calculate({ gross_annual: 100000 })

      expect(result.gross).toBe(100000)
      expect(result.net).toBe(100000)
      expect(result.effective_rate).toBe(0)
    })

    it('should handle simple bracket tax', () => {
      const config: TaxConfig = {
        meta: {
          country: 'test',
          year: 2024,
          currency: 'USD',
          version: '1.0.0',
          sources: [],
          updated_at: '2024-01-01',
        },
        inputs: {
          gross_annual: {
            type: 'number',
            required: true,
          },
        },
        parameters: {
          tax_brackets: [
            { threshold: 0, rate: 0.1 },
            { threshold: 10000, rate: 0.2 },
            { threshold: 50000, rate: 0.3 },
          ],
        },
        calculations: [
          {
            id: 'income_tax',
            type: 'bracket_tax',
            base: '@gross_annual',
            brackets: '$tax_brackets',
            category: 'income_tax',
            label: 'Income Tax',
          },
          {
            id: 'net_annual',
            type: 'sub',
            values: ['@gross_annual', '$income_tax'],
          },
        ],
        outputs: {
          gross: '@gross_annual',
          net: '$net_annual',
          effective_rate: {
            type: 'div',
            values: [
              { type: 'sub', values: ['@gross_annual', '$net_annual'] },
              '@gross_annual',
            ],
          },
          breakdown: {
            taxes: ['$income_tax'],
          },
        },
      }

      const engine = new CalculationEngine(config)

      // Test 1: Income below first threshold
      let result = engine.calculate({ gross_annual: 5000 })
      expect(result.gross).toBe(5000)
      expect(result.net).toBe(4500) // 10% tax

      // Test 2: Income in second bracket
      result = engine.calculate({ gross_annual: 30000 })
      // First 10k at 10% = 1000
      // Next 20k at 20% = 4000
      // Total tax = 5000
      expect(result.gross).toBe(30000)
      expect(result.net).toBe(25000)

      // Test 3: Income in third bracket
      result = engine.calculate({ gross_annual: 100000 })
      // First 10k at 10% = 1000
      // Next 40k at 20% = 8000
      // Next 50k at 30% = 15000
      // Total tax = 24000
      expect(result.gross).toBe(100000)
      expect(result.net).toBe(76000)
    })

    it('should handle percentage contributions with caps', () => {
      const config: TaxConfig = {
        meta: {
          country: 'test',
          year: 2024,
          currency: 'USD',
          version: '1.0.0',
          sources: [],
          updated_at: '2024-01-01',
        },
        inputs: {
          gross_annual: {
            type: 'number',
            required: true,
          },
        },
        parameters: {
          social_security_cap: 50000,
          social_security_rate: 0.1,
        },
        calculations: [
          {
            id: 'capped_income',
            type: 'min',
            values: ['@gross_annual', '$social_security_cap'],
          },
          {
            id: 'social_security',
            type: 'percent_of',
            base: '$capped_income',
            rate: 0.1,
            category: 'contribution',
            label: 'Social Security',
          },
          {
            id: 'net_annual',
            type: 'sub',
            values: ['@gross_annual', '$social_security'],
          },
        ],
        outputs: {
          gross: '@gross_annual',
          net: '$net_annual',
          effective_rate: {
            type: 'div',
            values: [
              { type: 'sub', values: ['@gross_annual', '$net_annual'] },
              '@gross_annual',
            ],
          },
          breakdown: {
            contributions: ['$social_security'],
          },
        },
      }

      const engine = new CalculationEngine(config)

      // Below cap
      let result = engine.calculate({ gross_annual: 30000 })
      expect(result.net).toBe(27000) // 10% of 30k = 3k

      // Above cap
      result = engine.calculate({ gross_annual: 100000 })
      expect(result.net).toBe(95000) // 10% of 50k cap = 5k
    })

    it('should handle tax credits with phaseouts', () => {
      const config: TaxConfig = {
        meta: {
          country: 'test',
          year: 2024,
          currency: 'EUR',
          version: '1.0.0',
          sources: [],
          updated_at: '2024-01-01',
        },
        inputs: {
          gross_annual: {
            type: 'number',
            required: true,
          },
        },
        parameters: {
          max_credit: 1000,
          phaseout_start: 20000,
          phaseout_end: 30000,
          phaseout_rate: 0.1,
        },
        calculations: [
          {
            id: 'income_tax',
            type: 'percent_of',
            base: '@gross_annual',
            rate: 0.2,
            category: 'income_tax',
            label: 'Income Tax',
          },
          {
            id: 'tax_credit',
            type: 'credit',
            amount: '$max_credit',
            refundable: false,
            phaseout: {
              base: '@gross_annual',
              start: 20000,
              end: 30000,
              rate: 0.1,
            },
            category: 'credit',
            label: 'Tax Credit',
          },
          {
            id: 'tax_after_credit',
            type: 'max',
            values: [
              { type: 'sub', values: ['$income_tax', '$tax_credit'] },
              0,
            ],
          },
          {
            id: 'net_annual',
            type: 'sub',
            values: ['@gross_annual', '$tax_after_credit'],
          },
        ],
        outputs: {
          gross: '@gross_annual',
          net: '$net_annual',
          effective_rate: {
            type: 'div',
            values: [
              { type: 'sub', values: ['@gross_annual', '$net_annual'] },
              '@gross_annual',
            ],
          },
          breakdown: {
            taxes: ['$income_tax'],
            credits: ['$tax_credit'],
          },
        },
      }

      const engine = new CalculationEngine(config)

      // Below phaseout (full credit)
      let result = engine.calculate({ gross_annual: 15000 })
      // Tax: 15000 * 0.2 = 3000
      // Credit: 1000
      // Net tax: 2000
      // Net: 13000
      expect(result.net).toBe(13000)

      // In phaseout range
      result = engine.calculate({ gross_annual: 25000 })
      // Tax: 25000 * 0.2 = 5000
      // Phaseout amount: (25000 - 20000) * 0.1 = 500
      // Credit: 1000 - 500 = 500
      // Net tax: 4500
      // Net: 20500
      expect(result.net).toBe(20500)

      // After phaseout (no credit)
      result = engine.calculate({ gross_annual: 35000 })
      // Tax: 35000 * 0.2 = 7000
      // Credit: 0 (fully phased out)
      // Net: 28000
      expect(result.net).toBe(28000)
    })
  })

  describe('reference resolution', () => {
    it('should resolve @ references to inputs', () => {
      const config: TaxConfig = {
        meta: {
          country: 'test',
          year: 2024,
          currency: 'USD',
          version: '1.0.0',
          sources: [],
          updated_at: '2024-01-01',
        },
        inputs: {
          gross_annual: { type: 'number', required: true },
          bonus: { type: 'number', required: false, default: 0 },
        },
        parameters: {},
        calculations: [
          {
            id: 'total_income',
            type: 'sum',
            values: ['@gross_annual', '@bonus'],
          },
          {
            id: 'net_annual',
            type: 'identity',
            value: '$total_income',
          },
        ],
        outputs: {
          gross: '$total_income',
          net: '$net_annual',
          effective_rate: 0,
          breakdown: {},
        },
      }

      const engine = new CalculationEngine(config)
      const result = engine.calculate({ gross_annual: 50000, bonus: 10000 })

      expect(result.gross).toBe(60000)
      expect(result.net).toBe(60000)
    })

    it('should resolve $ references to parameters and nodes', () => {
      const config: TaxConfig = {
        meta: {
          country: 'test',
          year: 2024,
          currency: 'USD',
          version: '1.0.0',
          sources: [],
          updated_at: '2024-01-01',
        },
        inputs: {
          gross_annual: { type: 'number', required: true },
        },
        parameters: {
          tax_rate: 0.3,
        },
        calculations: [
          {
            id: 'tax',
            type: 'percent_of',
            base: '@gross_annual',
            rate: 0.3,
            category: 'income_tax',
            label: 'Tax',
          },
          {
            id: 'net_annual',
            type: 'sub',
            values: ['@gross_annual', '$tax'],
          },
        ],
        outputs: {
          gross: '@gross_annual',
          net: '$net_annual',
          effective_rate: {
            type: 'div',
            values: ['$tax', '@gross_annual'],
          },
          breakdown: {
            taxes: ['$tax'],
          },
        },
      }

      const engine = new CalculationEngine(config)
      const result = engine.calculate({ gross_annual: 100000 })

      expect(result.net).toBe(70000)
      expect(result.effective_rate).toBe(0.3)
    })
  })
})
