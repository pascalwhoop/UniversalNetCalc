import type {
  CalculationNode,
  CalculationContext,
  BracketEntry,
  PhaseoutConfig,
  InlineNode,
  IdentityNode,
  SumNode,
  SubNode,
  MulNode,
  DivNode,
  MinNode,
  MaxNode,
  ClampNode,
  BracketTaxNode,
  PercentOfNode,
  CreditNode,
  DeductionNode,
  SwitchNode,
  LookupNode,
  ConditionalNode,
  RoundNode,
  FunctionNode,
} from '../../schema/src/config-types'

export function evaluateNode(
  node: CalculationNode | InlineNode,
  context: CalculationContext,
  functions: Map<string, Function>
): any {
  switch (node.type) {
    case 'identity':
      return evaluateIdentity(node as IdentityNode, context)
    case 'sum':
      return evaluateSum(node as SumNode, context, functions)
    case 'sub':
      return evaluateSub(node as SubNode, context, functions)
    case 'mul':
      return evaluateMul(node as MulNode, context, functions)
    case 'div':
      return evaluateDiv(node as DivNode, context, functions)
    case 'min':
      return evaluateMin(node as MinNode, context, functions)
    case 'max':
      return evaluateMax(node as MaxNode, context, functions)
    case 'clamp':
      return evaluateClamp(node as ClampNode, context, functions)
    case 'bracket_tax':
      return evaluateBracketTax(node as BracketTaxNode, context, functions)
    case 'percent_of':
      return evaluatePercentOf(node as PercentOfNode, context, functions)
    case 'credit':
      return evaluateCredit(node as CreditNode, context, functions)
    case 'deduction':
      return evaluateDeduction(node as DeductionNode, context, functions)
    case 'switch':
      return evaluateSwitch(node as SwitchNode, context, functions)
    case 'lookup':
      return evaluateLookup(node as LookupNode, context, functions)
    case 'conditional':
      return evaluateConditional(node as ConditionalNode, context, functions)
    case 'round':
      return evaluateRound(node as RoundNode, context, functions)
    case 'function':
      return evaluateFunction(node as FunctionNode, context, functions)
    default:
      throw new Error(`Unknown node type: ${(node as any).type}`)
  }
}

// Helper to resolve a value (number, reference, or inline node)
export function resolveValue(
  value: string | number | InlineNode | any,
  context: CalculationContext,
  functions: Map<string, Function>
): any {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    // If it's a plain string that doesn't look like a reference, return it as-is
    if (!value.startsWith('@') && !value.startsWith('$')) {
      return value
    }
    return resolveReference(value, context)
  }

  // Inline node
  if (typeof value === 'object' && value !== null && 'type' in value) {
    return evaluateNode(value as any, context, functions)
  }

  return value
}

export function resolveReference(ref: string, context: CalculationContext): any {
  if (ref.startsWith('@')) {
    const inputName = ref.slice(1)
    const parts = inputName.split('.')

    let value: unknown = context.inputs[parts[0]]
    for (let i = 1; i < parts.length; i++) {
      value = (value as Record<string, unknown>)?.[parts[i]]
    }

    if (value === undefined) {
      throw new Error(`Input not found: ${inputName}`)
    }

    // Coerce numeric strings to numbers, but leave other types alone
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      return Number(value)
    }

    return typeof value === 'number' ? value : value
  }

  if (ref.startsWith('$')) {
    const name = ref.slice(1)

    if (context.nodes[name] !== undefined) {
      const nodeValue = context.nodes[name]
      // Only coerce to number if it's not an array or object
      if (Array.isArray(nodeValue) || typeof nodeValue === 'object') {
        return nodeValue
      }
      return typeof nodeValue === 'number' ? nodeValue : Number(nodeValue)
    }

    if (context.parameters[name] !== undefined) {
      const param = context.parameters[name]
      // Only coerce to number if it's not an array or object
      if (Array.isArray(param) || typeof param === 'object') {
        return param
      }
      return typeof param === 'number' ? param : Number(param)
    }

    throw new Error(`Reference not found: ${name}`)
  }

  throw new Error(`Invalid reference: ${ref}`)
}

// Arithmetic evaluators
function evaluateIdentity(node: IdentityNode, context: CalculationContext): number {
  return resolveValue(node.value, context, new Map())
}

function evaluateSum(
  node: SumNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  return node.values.reduce(
    (sum: number, val: any) => sum + resolveValue(val, context, functions),
    0
  )
}

function evaluateSub(
  node: SubNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const values = node.values.map((v: any) => resolveValue(v, context, functions))
  if (values.length === 0) return 0
  if (values.length === 1) return values[0]

  return values.slice(1).reduce((result: number, val: number) => result - val, values[0])
}

function evaluateMul(
  node: MulNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  return node.values.reduce(
    (product: number, val: any) => product * resolveValue(val, context, functions),
    1
  )
}

function evaluateDiv(
  node: DivNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const values = node.values.map((v: any) => resolveValue(v, context, functions))
  if (values.length !== 2) {
    throw new Error('Division requires exactly 2 values')
  }
  if (values[1] === 0) {
    throw new Error('Division by zero')
  }
  return values[0] / values[1]
}

function evaluateMin(
  node: MinNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const values = node.values.map((v: any) => resolveValue(v, context, functions))
  return Math.min(...values)
}

function evaluateMax(
  node: MaxNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const values = node.values.map((v: any) => resolveValue(v, context, functions))
  return Math.max(...values)
}

function evaluateClamp(
  node: ClampNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const value = resolveValue(node.value, context, functions)
  const min = resolveValue(node.min, context, functions)
  const max = resolveValue(node.max, context, functions)
  return Math.min(Math.max(value, min), max)
}

// Tax evaluators
function evaluateBracketTax(
  node: BracketTaxNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const base = resolveValue(node.base, context, functions)

  // Resolve brackets (might be a parameter or node reference)
  let brackets: BracketEntry[]
  if (typeof node.brackets === 'string') {
    const ref = node.brackets.startsWith('$') ? node.brackets.slice(1) : node.brackets

    // Check if it's a node first (nodes can contain arrays from switches)
    if (context.nodes[ref] !== undefined) {
      brackets = context.nodes[ref] as BracketEntry[]
    } else if (context.parameters[ref] !== undefined) {
      brackets = context.parameters[ref] as BracketEntry[]
    } else {
      throw new Error(`Brackets reference not found: ${ref}`)
    }
  } else {
    brackets = node.brackets as BracketEntry[]
  }

  if (!brackets || !Array.isArray(brackets)) {
    throw new Error('Invalid brackets configuration')
  }

  let tax = 0
  let remaining = base

  // Check if brackets use base_amount (German-style)
  const useBaseAmount = brackets.some((b) => b.base_amount !== undefined)

  if (useBaseAmount) {
    // Find the applicable bracket (highest threshold <= base)
    let applicableBracket = brackets[0]
    for (let i = brackets.length - 1; i >= 0; i--) {
      if (base >= brackets[i].threshold) {
        applicableBracket = brackets[i]
        break
      }
    }
    const taxableInBracket = base - applicableBracket.threshold
    tax = (applicableBracket.base_amount || 0) + taxableInBracket * applicableBracket.rate
    return tax
  }

  // Standard progressive calculation
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i]
    const nextThreshold = i < brackets.length - 1 ? brackets[i + 1].threshold : Infinity

    const bracketAmount = Math.min(remaining, nextThreshold - bracket.threshold)

    if (bracketAmount <= 0) break

    tax += bracketAmount * bracket.rate
    remaining -= bracketAmount
  }

  return tax
}

function evaluatePercentOf(
  node: PercentOfNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const base = resolveValue(node.base, context, functions)
  const rate = typeof node.rate === 'number' ? node.rate : resolveValue(node.rate, context, functions)
  const amount = base * rate

  // Check condition if present
  if (node.condition) {
    const conditionMet = evaluateCondition(node.condition, context, functions)
    return conditionMet ? amount : 0
  }

  return amount
}

function evaluateCredit(
  node: CreditNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  let amount = resolveValue(node.amount, context, functions)

  // Apply phaseout if present
  if (node.phaseout) {
    amount = applyPhaseout(amount, node.phaseout, context, functions)
  }

  return amount
}

function applyPhaseout(
  amount: number,
  phaseout: PhaseoutConfig,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const base = resolveValue(phaseout.base, context, functions)

  if (base <= phaseout.start) {
    return amount
  }

  if (base >= phaseout.end) {
    return 0
  }

  const reductionAmount = (base - phaseout.start) * phaseout.rate
  return Math.max(0, amount - reductionAmount)
}

function evaluateDeduction(
  node: DeductionNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  let amount = resolveValue(node.amount, context, functions)

  // Apply threshold if specified
  if (node.threshold) {
    const thresholdAmount = resolveValue(node.threshold.amount, context, functions)
    if (node.threshold.mode === 'above') {
      // Only amount above threshold is deductible
      amount = Math.max(0, amount - thresholdAmount)
    } else if (node.threshold.mode === 'below') {
      // Only amount below threshold is deductible
      amount = Math.min(amount, thresholdAmount)
    }
  }

  // Apply cap if specified
  if (node.cap !== undefined) {
    const cap = resolveValue(node.cap, context, functions)
    amount = Math.min(amount, cap)
  }

  // Apply phaseout if specified
  if (node.phaseout) {
    amount = applyPhaseout(amount, node.phaseout, context, functions)
  }

  return Math.max(0, amount) // Never negative
}

// Control flow evaluators
function evaluateSwitch(
  node: SwitchNode,
  context: CalculationContext,
  functions: Map<string, Function>
): any {
  // Get the switch value (could be string or number)
  const switchValue = resolveValue(node.on, context, functions)

  if (switchValue === undefined) {
    throw new Error(`Switch value not found: ${node.on}`)
  }

  // Try to find matching case
  for (const [caseKey, caseValue] of Object.entries(node.cases)) {
    if (caseKey === '_' || caseKey === 'default') continue

    // Compare as strings for string inputs, or as numbers for numeric inputs
    if (switchValue.toString() === caseKey) {
      return resolveValue(caseValue, context, functions)
    }
  }

  // Use default case
  if (node.cases._ !== undefined) {
    return resolveValue(node.cases._, context, functions)
  }
  if (node.default !== undefined) {
    return resolveValue(node.default, context, functions)
  }

  throw new Error(`No matching case for switch value: ${switchValue}`)
}

function evaluateLookup(
  node: LookupNode,
  context: CalculationContext,
  functions: Map<string, Function>
): any {
  const tableRef = node.table.startsWith('$') ? node.table.slice(1) : node.table
  const table = context.parameters[tableRef]

  if (!table || typeof table !== 'object') {
    throw new Error(`Lookup table not found: ${tableRef}`)
  }

  const key = resolveValue(node.key, context, functions).toString()

  let value: any
  if (node.subkey) {
    const subkey = resolveValue(node.subkey, context, functions).toString()
    value = (table as any)[key]?.[subkey]
  } else {
    value = (table as any)[key]
  }

  if (value === undefined) {
    if (node.default !== undefined) {
      return resolveValue(node.default, context, functions)
    }
    throw new Error(`Lookup key not found: ${key}${node.subkey ? '.' + node.subkey : ''}`)
  }

  return value
}

function evaluateConditional(
  node: ConditionalNode,
  context: CalculationContext,
  functions: Map<string, Function>
): any {
  const conditionMet = evaluateCondition(node.condition, context, functions)

  if (conditionMet) {
    return resolveValue(node.then, context, functions)
  } else {
    return resolveValue(node.else, context, functions)
  }
}

function evaluateCondition(
  condition: any,
  context: CalculationContext,
  functions: Map<string, Function>
): boolean {
  const left = resolveValue(condition.left, context, functions)
  const right = resolveValue(condition.right, context, functions)

  switch (condition.type) {
    case 'gt':
      return left > right
    case 'lt':
      return left < right
    case 'gte':
      return left >= right
    case 'lte':
      return left <= right
    case 'eq':
      return left === right
    case 'neq':
      return left !== right
    default:
      throw new Error(`Unknown condition type: ${condition.type}`)
  }
}

// Utility evaluators
function evaluateRound(
  node: RoundNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const value = resolveValue(node.value, context, functions)
  const precision = node.precision || 0
  const multiplier = Math.pow(10, precision)

  switch (node.mode) {
    case 'floor':
      return Math.floor(value * multiplier) / multiplier
    case 'ceil':
      return Math.ceil(value * multiplier) / multiplier
    case 'half_down':
      return Math.floor(value * multiplier + 0.5) / multiplier
    case 'half_up':
    default:
      return Math.round(value * multiplier) / multiplier
  }
}

// Function evaluator (escape hatch)
function evaluateFunction(
  node: FunctionNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const fn = functions.get(node.name)

  if (!fn) {
    throw new Error(`Function not found: ${node.name}`)
  }

  // Resolve all inputs
  const resolvedInputs: Record<string, any> = {}
  for (const [key, value] of Object.entries(node.inputs)) {
    resolvedInputs[key] = resolveValue(value as any, context, functions)
  }

  return fn(resolvedInputs, context)
}
