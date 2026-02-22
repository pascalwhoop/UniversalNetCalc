import { describe, it, expect } from 'vitest'
import { CalculationEngine } from '../src/engine'
import type { TaxConfig } from '../../schema/src/config-types'

describe('Logic Fixes', () => {
  it('should correctly handle German-style brackets with base_amount', () => {
    const config: TaxConfig = {
      meta: {
        country: 'de',
        year: 2024,
        currency: 'EUR',
        version: '1.0.0',
        sources: [],
        updated_at: '2024-01-01',
      },
      inputs: {
        taxable_income: { type: 'number', required: true },
      },
      parameters: {
        german_brackets: [
          { threshold: 0, rate: 0, base_amount: 0 },
          { threshold: 10000, rate: 0.14, base_amount: 0 },
          { threshold: 20000, rate: 0.24, base_amount: 1400 }, // 1400 is tax from previous bracket
        ],
      },
      calculations: [
        {
          id: 'income_tax',
          type: 'bracket_tax',
          base: '@taxable_income',
          brackets: '$german_brackets',
        },
      ],
      outputs: {
        gross: '@taxable_income',
        net: { type: 'sub', values: ['@taxable_income', '$income_tax'] },
        effective_rate: 0,
        breakdown: { taxes: ['$income_tax'] },
      },
    }

    const engine = new CalculationEngine(config)

    // Test 1: In first bracket (tax-free)
    expect(engine.calculate({ taxable_income: 5000 }).breakdown[0].amount).toBe(0)

    // Test 2: In second bracket
    // (15000 - 10000) * 0.14 = 5000 * 0.14 = 700
    expect(engine.calculate({ taxable_income: 15000 }).breakdown[0].amount).toBeCloseTo(700, 5)

    // Test 3: In third bracket
    // Base amount 1400 + (25000 - 20000) * 0.24 = 1400 + 5000 * 0.24 = 1400 + 1200 = 2600
    // Previously it would have added 1400 MULTIPLE TIMES if logic was wrong.
    expect(engine.calculate({ taxable_income: 25000 }).breakdown[0].amount).toBeCloseTo(2600, 5)
  })

  it('should correctly resolve non-numeric references in switches', () => {
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
        filing_status: { type: 'enum', required: true, options: { single: { label: 'Single' }, married: { label: 'Married' } } },
        income: { type: 'number', required: true },
      },
      parameters: {
        single_brackets: [{ threshold: 0, rate: 0.1 }],
        married_brackets: [{ threshold: 0, rate: 0.05 }],
      },
      calculations: [
        {
          id: 'active_brackets',
          type: 'switch',
          on: '@filing_status',
          cases: {
            single: '$single_brackets',
            married: '$married_brackets',
          },
        },
        {
          id: 'tax',
          type: 'bracket_tax',
          base: '@income',
          brackets: '$active_brackets',
        },
      ],
      outputs: {
        gross: '@income',
        net: { type: 'sub', values: ['@income', '$tax'] },
        effective_rate: 0,
        breakdown: { taxes: ['$tax'] },
      },
    }

    const engine = new CalculationEngine(config)

    // Single: 10000 * 0.1 = 1000
    expect(engine.calculate({ filing_status: 'single', income: 10000 }).breakdown[0].amount).toBe(1000)

    // Married: 10000 * 0.05 = 500
    expect(engine.calculate({ filing_status: 'married', income: 10000 }).breakdown[0].amount).toBe(500)
  })
})
