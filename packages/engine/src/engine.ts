import type {
  TaxConfig,
  CalculationContext,
  CalculationResult,
  InlineNode,
  NodeCategory,
  BreakdownItem,
} from '../../schema/src/config-types'
import { evaluateNode } from './evaluators'
import { resolveFunctions } from './functions'

export class CalculationEngine {
  private config: TaxConfig
  private functions: Map<string, any>

  constructor(config: TaxConfig) {
    this.config = config
    this.functions = resolveFunctions()
  }

  calculate(inputs: Record<string, string | number | boolean | Record<string, unknown> | undefined>): CalculationResult {
    // Initialize context
    const context: CalculationContext = {
      inputs: { ...inputs },
      parameters: this.config.parameters,
      nodes: {},
      config: {
        meta: {
          year: this.config.meta.year,
          country: this.config.meta.country,
        },
      },
    }

    // Evaluate all calculation nodes in order
    for (const node of this.config.calculations) {
      const value = evaluateNode(node, context, this.functions)
      context.nodes[node.id] = value
    }

    // Resolve outputs
    const gross = this.resolveValue(this.config.outputs.gross, context)
    const net = this.resolveValue(this.config.outputs.net, context)
    const effective_rate = this.resolveValue(
      this.config.outputs.effective_rate,
      context
    )

    // Build breakdown
    const breakdown = this.buildBreakdown(context)

    return {
      gross,
      net,
      effective_rate,
      breakdown,
      currency: this.config.meta.currency,
      config_version_hash: this.hashConfig(),
      config_last_updated: this.config.meta.updated_at,
    }
  }

  private resolveValue(
    value: string | number | InlineNode,
    context: CalculationContext
  ): number {
    if (typeof value === 'number') {
      return value
    }

    if (typeof value === 'string') {
      return this.resolveReference(value, context)
    }

    // Inline node
    return evaluateNode(value as any, context, this.functions)
  }

  resolveReference(ref: string, context: CalculationContext): number {
    if (ref.startsWith('@')) {
      // Input reference
      const inputName = ref.slice(1)
      const parts = inputName.split('.')

      let value: unknown = context.inputs[parts[0]]
      for (let i = 1; i < parts.length; i++) {
        value = (value as Record<string, unknown>)?.[parts[i]]
      }

      if (value === undefined) {
        throw new Error(`Input not found: ${inputName}`)
      }

      return typeof value === 'number' ? value : parseFloat(String(value))
    }

    if (ref.startsWith('$')) {
      // Parameter or node reference
      const name = ref.slice(1)

      // Check nodes first
      if (context.nodes[name] !== undefined) {
        const nodeValue = context.nodes[name]
        return typeof nodeValue === 'number' ? nodeValue : Number(nodeValue)
      }

      // Check parameters
      if (context.parameters[name] !== undefined) {
        const param = context.parameters[name]
        if (typeof param === 'number') {
          return param
        }
        throw new Error(`Parameter ${name} is not a number`)
      }

      throw new Error(`Reference not found: ${name}`)
    }

    throw new Error(`Invalid reference: ${ref}`)
  }

  private buildBreakdown(context: CalculationContext): BreakdownItem[] {
    const items: BreakdownItem[] = []
    const breakdown = this.config.outputs.breakdown

    // Helper to add items from a category
    const addItems = (nodeIds: string[] = [], category: string) => {
      for (const nodeId of nodeIds) {
        const id = nodeId.startsWith('$') ? nodeId.slice(1) : nodeId
        const node = this.config.calculations.find((n) => n.id === id)

        if (node && context.nodes[id] !== undefined) {
          const amount = context.nodes[id]
          if (typeof amount === 'number') {
            items.push({
              id,
              label: node.label || id,
              amount,
              category: (node.category || 'deduction') as NodeCategory,
              description: node.description,
            })
          }
        }
      }
    }

    if (breakdown.taxes) addItems(breakdown.taxes, 'income_tax')
    if (breakdown.contributions) addItems(breakdown.contributions, 'contribution')
    if (breakdown.credits) addItems(breakdown.credits, 'credit')
    if (breakdown.deductions) addItems(breakdown.deductions, 'deduction')
    if (breakdown.surtaxes) addItems(breakdown.surtaxes, 'surtax')

    return items
  }

  /**
   * Calculate marginal tax rate by computing how much of the next earned amount is taxed.
   * This shows the tax rate on the next dollar/euro earned.
   *
   * @param inputs - The current input values
   * @param delta - The additional gross income to test (default: 1000)
   * @returns Marginal tax rate as a decimal (e.g., 0.42 for 42%)
   */
  calculateMarginalRate(
    inputs: Record<string, string | number | boolean | Record<string, unknown> | undefined>,
    delta: number = 1000
  ): number {
    // Calculate net at current gross
    const currentResult = this.calculate(inputs)
    const currentGross = currentResult.gross
    const currentNet = currentResult.net

    // Calculate net at gross + delta
    const increasedInputs = {
      ...inputs,
      gross_annual: Number(inputs.gross_annual) + delta,
    }
    const increasedResult = this.calculate(increasedInputs)
    const increasedNet = increasedResult.net

    // Marginal rate = (delta - increase in net) / delta
    const netIncrease = increasedNet - currentNet
    const marginalRate = (delta - netIncrease) / delta

    return Math.max(0, Math.min(1, marginalRate)) // Clamp between 0 and 1
  }

  private hashConfig(): string {
    // Simple hash for now - in production use crypto
    return `${this.config.meta.country}-${this.config.meta.year}-${this.config.meta.version}`
  }
}
