/**
 * TypeScript types for the Universal Salary Calculator configuration schema
 * Based on DATA_SPEC.md v1
 */

// ============================================================================
// Meta Section
// ============================================================================

export interface ConfigMeta {
  country: string // ISO 3166-1 alpha-2
  year: number
  currency: string // ISO 4217
  version: string // Semver
  sources: ConfigSource[]
  updated_at: string // ISO 8601 date
  notes?: string

  // For variants only
  variant?: string
  label?: string
  description?: string
  base?: string // Path to base config
}

export interface ConfigSource {
  url: string
  description: string
  retrieved_at: string // ISO 8601 date
}

// ============================================================================
// Notices Section
// ============================================================================

export interface Notice {
  id: string
  title: string
  body: string
  severity?: 'info' | 'warning' | 'error'
  show_for_variants?: string[]
}

// ============================================================================
// Inputs Section
// ============================================================================

export type InputType = 'number' | 'enum' | 'boolean'

export interface BaseInput {
  type: InputType
  required: boolean
  label?: string
  description?: string
}

export interface NumberInput extends BaseInput {
  type: 'number'
  min?: number
  max?: number
  default?: number
}

export interface EnumOption {
  label: string
  description?: string
  [key: string]: any // Allow additional properties for metadata
}

export interface EnumInput extends BaseInput {
  type: 'enum'
  default?: string
  options: Record<string, EnumOption>
  depends_on?: string // Field that must be set first
  options_by_parent?: Record<string, Record<string, EnumOption>> // For cascading selects
}

export interface BooleanInput extends BaseInput {
  type: 'boolean'
  default?: boolean
}

export type Input = NumberInput | EnumInput | BooleanInput

export type InputDefinitions = Record<string, Input>

// ============================================================================
// Parameters Section
// ============================================================================

export interface BracketEntry {
  threshold: number
  rate: number
  base_amount?: number // German-style brackets
}

export interface PhaseoutConfig {
  base: string // Reference to income field
  start: number
  end: number
  rate: number
}

export type ParameterValue =
  | number
  | string
  | boolean
  | BracketEntry[]
  | Record<string, any>
  | any[]

export type Parameters = Record<string, ParameterValue>

// ============================================================================
// Calculations Section (DAG Nodes)
// ============================================================================

export type NodeCategory = 'income_tax' | 'contribution' | 'credit' | 'deduction' | 'surtax'

export interface BaseNode {
  id: string
  type: string
  category?: NodeCategory
  label?: string
  description?: string
}

// Arithmetic Nodes
export interface IdentityNode extends BaseNode {
  type: 'identity'
  value: string | number
}

export interface SumNode extends BaseNode {
  type: 'sum'
  values: (string | number | InlineNode)[]
}

export interface SubNode extends BaseNode {
  type: 'sub'
  values: (string | number | InlineNode)[]
}

export interface MulNode extends BaseNode {
  type: 'mul'
  values: (string | number | InlineNode)[]
}

export interface DivNode extends BaseNode {
  type: 'div'
  values: (string | number | InlineNode)[]
}

export interface MinNode extends BaseNode {
  type: 'min'
  values: (string | number | InlineNode)[]
}

export interface MaxNode extends BaseNode {
  type: 'max'
  values: (string | number | InlineNode)[]
}

export interface ClampNode extends BaseNode {
  type: 'clamp'
  value: string | number
  min: string | number
  max: string | number
}

// Tax Nodes
export interface BracketTaxNode extends BaseNode {
  type: 'bracket_tax'
  base: string | number
  brackets: string | BracketEntry[]
  category?: NodeCategory
  label?: string
}

export interface PercentOfNode extends BaseNode {
  type: 'percent_of'
  base: string | number
  rate: number
  category?: NodeCategory
  label?: string
  condition?: ConditionConfig
}

// Credit and Deduction Nodes
export interface CreditNode extends BaseNode {
  type: 'credit'
  amount: string | number
  refundable: boolean
  phaseout?: PhaseoutConfig
  category?: NodeCategory
  label?: string
}

export interface DeductionNode extends BaseNode {
  type: 'deduction'
  amount: string | number
  cap?: string | number
  category?: NodeCategory
  label?: string
}

// Control Flow Nodes
export interface SwitchNode extends BaseNode {
  type: 'switch'
  on: string // Input or parameter to switch on
  cases: Record<string, any>
  default?: any
}

export interface LookupNode extends BaseNode {
  type: 'lookup'
  table: string // Reference to parameter
  key: string // Input or calculated value
  subkey?: string // For nested lookups
  default?: any
}

export interface ConditionalNode extends BaseNode {
  type: 'conditional'
  condition: ConditionConfig
  then: string | number | InlineNode
  else: string | number | InlineNode
}

export interface ConditionConfig {
  type: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq'
  left: string | number
  right: string | number
}

// Utility Nodes
export interface RoundNode extends BaseNode {
  type: 'round'
  value: string | number
  precision: number
  mode: 'half_up' | 'half_down' | 'floor' | 'ceil'
}

// Function Node (Escape Hatch)
export interface FunctionNode extends BaseNode {
  type: 'function'
  name: string // Registered function name
  inputs: Record<string, string | number>
  category?: NodeCategory
  label?: string
}

// Inline nodes (can be nested in other nodes)
export type InlineNode =
  | Omit<SumNode, 'id' | 'category' | 'label'>
  | Omit<SubNode, 'id' | 'category' | 'label'>
  | Omit<MulNode, 'id' | 'category' | 'label'>
  | Omit<DivNode, 'id' | 'category' | 'label'>
  | Omit<MinNode, 'id' | 'category' | 'label'>
  | Omit<MaxNode, 'id' | 'category' | 'label'>

// Union of all node types
export type CalculationNode =
  | IdentityNode
  | SumNode
  | SubNode
  | MulNode
  | DivNode
  | MinNode
  | MaxNode
  | ClampNode
  | BracketTaxNode
  | PercentOfNode
  | CreditNode
  | DeductionNode
  | SwitchNode
  | LookupNode
  | ConditionalNode
  | RoundNode
  | FunctionNode

// ============================================================================
// Outputs Section
// ============================================================================

export interface OutputDefinition {
  gross: string | number
  net: string | number
  effective_rate: string | number | InlineNode
  breakdown: {
    taxes?: string[]
    contributions?: string[]
    credits?: string[]
    deductions?: string[]
    surtaxes?: string[]
  }
}

// ============================================================================
// Complete Config
// ============================================================================

export interface TaxConfig {
  meta: ConfigMeta
  notices?: Notice[]
  inputs: InputDefinitions
  parameters: Parameters
  calculations: CalculationNode[]
  outputs: OutputDefinition
}

// ============================================================================
// Calculation Context and Results
// ============================================================================

export interface CalculationContext {
  inputs: Record<string, any>
  parameters: Parameters
  nodes: Record<string, any> // Computed node values (can be number, string, array, etc.)
}

export interface BreakdownItem {
  id: string
  label: string
  amount: number
  category: NodeCategory
  description?: string
}

export interface CalculationResult {
  gross: number
  net: number
  effective_rate: number
  breakdown: BreakdownItem[]
  currency: string // ISO 4217 currency code
  config_version_hash: string
  config_last_updated: string
}

// ============================================================================
// Test Vectors
// ============================================================================

export interface TestVector {
  name: string
  description?: string
  inputs: Record<string, any>
  expected: {
    net: number
    effective_rate: number
    breakdown?: Record<string, number>
  }
  tolerance?: number
  tolerance_percent?: number
  sources?: ConfigSource[]
}
