import type {
  CalculationNode,
  CalculationContext,
  BracketEntry,
  PhaseoutConfig,
  InlineNode,
} from '../../schema/src/config-types'

export function evaluateNode(
  node: CalculationNode | InlineNode,
  context: CalculationContext,
  functions: Map<string, Function>
): any {
  const type = node.type

  switch (type) {
    case 'identity':
      return evaluateIdentity(node as any, context)
    case 'sum':
      return evaluateSum(node as any, context, functions)
    case 'sub':
      return evaluateSub(node as any, context, functions)
    case 'mul':
      return evaluateMul(node as any, context, functions)
    case 'div':
      return evaluateDiv(node as any, context, functions)
    case 'min':
      return evaluateMin(node as any, context, functions)
    case 'max':
      return evaluateMax(node as any, context, functions)
    case 'clamp':
      return evaluateClamp(node as any, context, functions)
    case 'bracket_tax':
      return evaluateBracketTax(node as any, context, functions)
    case 'percent_of':
      return evaluatePercentOf(node as any, context, functions)
    case 'credit':
      return evaluateCredit(node as any, context, functions)
    case 'deduction':
      return evaluateDeduction(node as any, context, functions)
    case 'switch':
      return evaluateSwitch(node as any, context, functions)
    case 'lookup':
      return evaluateLookup(node as any, context, functions)
    case 'conditional':
      return evaluateConditional(node as any, context, functions)
    case 'round':
      return evaluateRound(node as any, context, functions)
    case 'function':
      return evaluateFunction(node as any, context, functions)
    default:
      throw new Error(`Unknown node type: ${type}`)
  }
}

// Helper to resolve a value (number, reference, or inline node)
function resolveValue(
  value: string | number | InlineNode,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return resolveReference(value, context)
  }

  // Inline node
  return evaluateNode(value as any, context, functions)
}

function resolveReference(ref: string, context: CalculationContext): number {
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

    return typeof value === 'number' ? value : parseFloat(String(value))
  }

  if (ref.startsWith('$')) {
    const name = ref.slice(1)

    if (context.nodes[name] !== undefined) {
      const nodeValue = context.nodes[name]
      return typeof nodeValue === 'number' ? nodeValue : Number(nodeValue)
    }

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

// Helper to resolve a reference that can be any type (not just number)
function resolveReferenceAny(ref: string, context: CalculationContext): any {
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

    return value
  }

  if (ref.startsWith('$')) {
    const name = ref.slice(1)

    if (context.nodes[name] !== undefined) {
      return context.nodes[name]
    }

    if (context.parameters[name] !== undefined) {
      return context.parameters[name]
    }

    throw new Error(`Reference not found: ${name}`)
  }

  throw new Error(`Invalid reference: ${ref}`)
}

// Arithmetic evaluators
function evaluateIdentity(node: any, context: CalculationContext): number {
  return resolveValue(node.value, context, new Map())
}

function evaluateSum(
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  return node.values.reduce(
    (sum: number, val: any) => sum + resolveValue(val, context, functions),
    0
  )
}

function evaluateSub(
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const values = node.values.map((v: any) => resolveValue(v, context, functions))
  if (values.length === 0) return 0
  if (values.length === 1) return values[0]

  return values.slice(1).reduce((result: number, val: number) => result - val, values[0])
}

function evaluateMul(
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  return node.values.reduce(
    (product: number, val: any) => product * resolveValue(val, context, functions),
    1
  )
}

function evaluateDiv(
  node: any,
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
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const values = node.values.map((v: any) => resolveValue(v, context, functions))
  return Math.min(...values)
}

function evaluateMax(
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const values = node.values.map((v: any) => resolveValue(v, context, functions))
  return Math.max(...values)
}

function evaluateClamp(
  node: any,
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
  node: any,
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

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i]
    const nextThreshold = i < brackets.length - 1 ? brackets[i + 1].threshold : Infinity

    const bracketAmount = Math.min(remaining, nextThreshold - bracket.threshold)

    if (bracketAmount <= 0) break

    tax += bracketAmount * bracket.rate

    // Add base_amount if this is first euro in bracket (German-style)
    if (bracket.base_amount && remaining > 0) {
      tax += bracket.base_amount
    }

    remaining -= bracketAmount
  }

  return tax
}

function evaluatePercentOf(
  node: any,
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
  node: any,
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
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  let amount = resolveValue(node.amount, context, functions)

  if (node.cap !== undefined) {
    const cap = resolveValue(node.cap, context, functions)
    amount = Math.min(amount, cap)
  }

  return amount
}

// Control flow evaluators
function evaluateSwitch(
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  // Get the switch value (could be string or number)
  let switchValue: any
  const ref = node.on

  if (ref.startsWith('@')) {
    // Input reference - can be string or number
    const inputName = ref.slice(1)
    const parts = inputName.split('.')

    switchValue = context.inputs[parts[0]]
    for (let i = 1; i < parts.length; i++) {
      switchValue = switchValue?.[parts[i]]
    }

    if (switchValue === undefined) {
      throw new Error(`Input not found: ${inputName}`)
    }
  } else if (ref.startsWith('$')) {
    // Parameter or node reference
    const name = ref.slice(1)

    if (context.nodes[name] !== undefined) {
      switchValue = context.nodes[name]
    } else if (context.parameters[name] !== undefined) {
      switchValue = context.parameters[name]
    } else {
      throw new Error(`Reference not found: ${name}`)
    }
  } else {
    throw new Error(`Invalid reference in switch: ${ref}`)
  }

  // Try to find matching case
  for (const [caseKey, caseValue] of Object.entries(node.cases)) {
    if (caseKey === '_' || caseKey === 'default') continue

    // Compare as strings for string inputs, or as numbers for numeric inputs
    if (switchValue.toString() === caseKey) {
      // Check if the case value is a reference to a non-numeric parameter
      if (typeof caseValue === 'string' && caseValue.startsWith('$')) {
        const param = resolveReferenceAny(caseValue, context)
        // If it's a number, return it; if it's an array/object, it will be used by a parent node
        return typeof param === 'number' ? param : param
      }
      return resolveValue(caseValue as any, context, functions)
    }
  }

  // Use default case
  if (node.cases._ !== undefined) {
    const defaultValue = node.cases._
    if (typeof defaultValue === 'string' && defaultValue.startsWith('$')) {
      const param = resolveReferenceAny(defaultValue, context)
      return typeof param === 'number' ? param : param
    }
    return resolveValue(defaultValue, context, functions)
  }
  if (node.default !== undefined) {
    return resolveValue(node.default, context, functions)
  }

  throw new Error(`No matching case for switch value: ${switchValue}`)
}

function evaluateLookup(
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const tableRef = node.table.startsWith('$') ? node.table.slice(1) : node.table
  const table = context.parameters[tableRef]

  if (!table || typeof table !== 'object') {
    throw new Error(`Lookup table not found: ${tableRef}`)
  }

  const key = resolveReference(node.key, context).toString()

  let value: any
  if (node.subkey) {
    const subkey = resolveReference(node.subkey, context).toString()
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

  return typeof value === 'number' ? value : parseFloat(value)
}

function evaluateConditional(
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): any {
  const conditionMet = evaluateCondition(node.condition, context, functions)

  const thenValue = node.then
  const elseValue = node.else

  if (conditionMet) {
    // If it's a plain string (not a reference), return it as-is
    if (typeof thenValue === 'string' && !thenValue.startsWith('@') && !thenValue.startsWith('$')) {
      return thenValue
    }
    return resolveValue(thenValue, context, functions)
  } else {
    // If it's a plain string (not a reference), return it as-is
    if (typeof elseValue === 'string' && !elseValue.startsWith('@') && !elseValue.startsWith('$')) {
      return elseValue
    }
    // Check if it's a nested conditional
    if (typeof elseValue === 'object' && elseValue.type === 'conditional') {
      return evaluateConditional(elseValue, context, functions)
    }
    return resolveValue(elseValue, context, functions)
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
  node: any,
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
  node: any,
  context: CalculationContext,
  functions: Map<string, Function>
): number {
  const fn = functions.get(node.name)

  if (!fn) {
    throw new Error(`Function not found: ${node.name}`)
  }

  // Resolve all inputs
  const resolvedInputs: Record<string, number> = {}
  for (const [key, value] of Object.entries(node.inputs)) {
    resolvedInputs[key] = resolveValue(value as any, context, functions)
  }

  return fn(resolvedInputs, context)
}
