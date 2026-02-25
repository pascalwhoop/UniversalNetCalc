/**
 * Zod schemas for the Universal Salary Calculator configuration.
 * Source of truth for all config file structure.
 * TypeScript types are derived via z.infer<>.
 */
import { z } from 'zod'

// ============================================================================
// Meta
// ============================================================================

export const ConfigSourceSchema = z.object({
  url: z.string(),
  description: z.string(),
  retrieved_at: z.string(), // ISO 8601 date
})

export const ConfigMetaSchema = z.object({
  country: z.string(), // ISO 3166-1 alpha-2
  year: z.number().int(),
  currency: z.string(), // ISO 4217
  version: z.string(), // semver
  sources: z.array(ConfigSourceSchema),
  updated_at: z.string(), // ISO 8601 date
  notes: z.string().optional(),

  // Variant-only fields
  variant: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  base: z.string().optional(),
})

// ============================================================================
// Notices
// ============================================================================

export const NoticeSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  severity: z.enum(['info', 'warning', 'error']).optional(),
  show_for_variants: z.array(z.string()).optional(),
})

// ============================================================================
// Inputs
// ============================================================================

// EnumOption allows arbitrary extra properties (e.g. metadata)
export const EnumOptionSchema = z
  .object({
    label: z.string(),
    description: z.string().optional(),
  })
  .passthrough()

export const NumberInputSchema = z.object({
  type: z.literal('number'),
  required: z.boolean(),
  label: z.string().optional(),
  description: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  default: z.number().optional(),
  group: z.string().optional(),
})

export const EnumInputSchema = z.object({
  type: z.literal('enum'),
  required: z.boolean(),
  label: z.string().optional(),
  description: z.string().optional(),
  default: z.string().optional(),
  options: z.record(z.string(), EnumOptionSchema),
  depends_on: z.string().optional(),
  options_by_parent: z
    .record(z.string(), z.record(z.string(), EnumOptionSchema))
    .optional(),
})

export const BooleanInputSchema = z.object({
  type: z.literal('boolean'),
  required: z.boolean(),
  label: z.string().optional(),
  description: z.string().optional(),
  default: z.boolean().optional(),
})

export const InputSchema = z.discriminatedUnion('type', [
  NumberInputSchema,
  EnumInputSchema,
  BooleanInputSchema,
])

// Null entries allowed as a way to "unset" an inherited input in some configs.
// {$delete: true} entries allowed in variant configs to remove base inputs.
export const DeleteInputSchema = z.object({ $delete: z.literal(true) })
export const InputDefinitionsSchema = z.record(
  z.string(),
  z.union([InputSchema, DeleteInputSchema, z.null()])
)

// ============================================================================
// Parameters — flexible by design (scalars, arrays, nested objects)
// ============================================================================

export const BracketEntrySchema = z
  .object({
    threshold: z.number(),
    rate: z.number(),
    base_amount: z.number().optional(),
  })
  .passthrough() // Allow extra fields like 'max', 'base' in some country configs

export const ParametersSchema = z.record(z.string(), z.unknown())

// ============================================================================
// Inline Expressions
//
// Inline nodes can appear as values inside other nodes (no required `id`).
// We use a lazy passthrough schema to handle deep recursion without fighting
// Zod's type system — structural correctness is caught by the engine at runtime,
// while the schema ensures every top-level calc node is well-formed.
// ============================================================================

type AnyInlineExpr = { type: string; [key: string]: unknown }

export const AnyInlineExprSchema: z.ZodType<AnyInlineExpr> = z.lazy(() =>
  z.object({ type: z.string() }).passthrough()
)

// A value accepted wherever string | number | inline-expression is valid
export const ValueOrExprSchema: z.ZodType<string | number | AnyInlineExpr> =
  z.union([z.string(), z.number(), AnyInlineExprSchema])

// ============================================================================
// Shared sub-schemas
// ============================================================================

export const ConditionConfigSchema = z.object({
  type: z.enum(['gt', 'lt', 'gte', 'lte', 'eq', 'neq']),
  left: z.union([z.string(), z.number()]),
  right: z.union([z.string(), z.number()]),
})

export const PhaseoutConfigSchema = z.object({
  base: z.string(),
  start: z.number(),
  end: z.number(),
  rate: z.number(),
})

export const ThresholdConfigSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  mode: z.enum(['above', 'below']),
})

// ============================================================================
// Calculation Nodes (top-level, discriminated by `type`)
// ============================================================================

// Shared base fields for all named nodes
const baseNodeFields = {
  id: z.string(),
  category: z
    .enum(['income_tax', 'contribution', 'credit', 'deduction', 'surtax'])
    .optional(),
  label: z.string().optional(),
  description: z.string().optional(),
}

export const IdentityNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('identity'),
  value: z.union([z.string(), z.number()]),
})

export const SumNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('sum'),
  values: z.array(ValueOrExprSchema),
})

export const SubNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('sub'),
  values: z.array(ValueOrExprSchema),
})

export const MulNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('mul'),
  values: z.array(ValueOrExprSchema),
})

export const DivNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('div'),
  values: z.array(ValueOrExprSchema),
})

export const MinNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('min'),
  values: z.array(ValueOrExprSchema),
})

export const MaxNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('max'),
  values: z.array(ValueOrExprSchema),
})

export const ClampNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('clamp'),
  value: z.union([z.string(), z.number()]),
  min: z.union([z.string(), z.number()]),
  max: z.union([z.string(), z.number()]),
})

export const BracketTaxNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('bracket_tax'),
  base: z.union([z.string(), z.number()]),
  brackets: z.union([z.string(), z.array(BracketEntrySchema)]),
})

export const PercentOfNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('percent_of'),
  base: z.union([z.string(), z.number()]),
  rate: z.union([z.string(), z.number()]), // Allows references like "$rate_param"
  condition: ConditionConfigSchema.optional(),
})

export const CreditNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('credit'),
  amount: ValueOrExprSchema,
  refundable: z.boolean(),
  phaseout: PhaseoutConfigSchema.optional(),
})

export const DeductionNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('deduction'),
  amount: ValueOrExprSchema,
  cap: z.union([z.string(), z.number()]).optional(),
  threshold: ThresholdConfigSchema.optional(),
  phaseout: PhaseoutConfigSchema.optional(),
})

export const SwitchNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('switch'),
  on: z.string(),
  cases: z.record(z.string(), z.unknown()),
  default: z.unknown().optional(),
})

export const LookupNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('lookup'),
  table: z.string(),
  key: z.string(),
  subkey: z.string().optional(),
  default: z.unknown().optional(),
})

export const ConditionalNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('conditional'),
  condition: ConditionConfigSchema,
  then: ValueOrExprSchema,
  else: ValueOrExprSchema,
})

export const RoundNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('round'),
  value: z.union([z.string(), z.number()]),
  precision: z.number().int(),
  mode: z.enum(['half_up', 'half_down', 'floor', 'ceil']),
})

export const FunctionNodeSchema = z.object({
  ...baseNodeFields,
  type: z.literal('function'),
  name: z.string(),
  inputs: z.record(z.string(), z.union([z.string(), z.number()])),
})

export const CalculationNodeSchema = z.discriminatedUnion('type', [
  IdentityNodeSchema,
  SumNodeSchema,
  SubNodeSchema,
  MulNodeSchema,
  DivNodeSchema,
  MinNodeSchema,
  MaxNodeSchema,
  ClampNodeSchema,
  BracketTaxNodeSchema,
  PercentOfNodeSchema,
  CreditNodeSchema,
  DeductionNodeSchema,
  SwitchNodeSchema,
  LookupNodeSchema,
  ConditionalNodeSchema,
  RoundNodeSchema,
  FunctionNodeSchema,
])

// Variant configs may include $delete markers to remove base nodes
export const DeleteNodeSchema = z.object({
  id: z.string(),
  $delete: z.literal(true),
})

export const VariantCalculationNodeSchema = z.union([
  CalculationNodeSchema,
  DeleteNodeSchema,
])

// ============================================================================
// Outputs
// ============================================================================

export const BreakdownDefinitionSchema = z.object({
  taxes: z.array(z.string()).optional(),
  contributions: z.array(z.string()).optional(),
  credits: z.array(z.string()).optional(),
  deductions: z.array(z.string()).optional(),
  surtaxes: z.array(z.string()).optional(),
})

export const OutputDefinitionSchema = z.object({
  gross: ValueOrExprSchema,
  net: ValueOrExprSchema,
  effective_rate: ValueOrExprSchema,
  breakdown: BreakdownDefinitionSchema,
})

// ============================================================================
// Complete Base Config (all required sections present)
// ============================================================================

export const TaxConfigSchema = z.object({
  meta: ConfigMetaSchema,
  notices: z.array(NoticeSchema).optional(),
  inputs: InputDefinitionsSchema,
  parameters: ParametersSchema,
  calculations: z.array(CalculationNodeSchema),
  outputs: OutputDefinitionSchema,
})

// ============================================================================
// Variant Config (only override sections needed)
// ============================================================================

export const VariantConfigSchema = z.object({
  meta: ConfigMetaSchema.partial().extend({ variant: z.string() }),
  notices: z.array(NoticeSchema).optional(),
  inputs: InputDefinitionsSchema.optional(),
  parameters: ParametersSchema.optional(),
  calculations: z.array(VariantCalculationNodeSchema).optional(),
  outputs: OutputDefinitionSchema.partial().optional(),
})

// ============================================================================
// Exported TypeScript types (derived from schemas — single source of truth)
// ============================================================================

export type ConfigSource = z.infer<typeof ConfigSourceSchema>
export type ConfigMeta = z.infer<typeof ConfigMetaSchema>
export type Notice = z.infer<typeof NoticeSchema>
export type NumberInput = z.infer<typeof NumberInputSchema>
export type EnumInput = z.infer<typeof EnumInputSchema>
export type BooleanInput = z.infer<typeof BooleanInputSchema>
export type Input = z.infer<typeof InputSchema>
export type InputType = Input['type']
export type InputDefinitions = z.infer<typeof InputDefinitionsSchema>
export type BracketEntry = z.infer<typeof BracketEntrySchema>
export type Parameters = z.infer<typeof ParametersSchema>
export type ParameterValue = unknown
export type NodeCategory = z.infer<typeof baseNodeFields.category>
export type ConditionConfig = z.infer<typeof ConditionConfigSchema>
export type PhaseoutConfig = z.infer<typeof PhaseoutConfigSchema>
export type InlineNode = AnyInlineExpr
export type IdentityNode = z.infer<typeof IdentityNodeSchema>
export type SumNode = z.infer<typeof SumNodeSchema>
export type SubNode = z.infer<typeof SubNodeSchema>
export type MulNode = z.infer<typeof MulNodeSchema>
export type DivNode = z.infer<typeof DivNodeSchema>
export type MinNode = z.infer<typeof MinNodeSchema>
export type MaxNode = z.infer<typeof MaxNodeSchema>
export type ClampNode = z.infer<typeof ClampNodeSchema>
export type BracketTaxNode = z.infer<typeof BracketTaxNodeSchema>
export type PercentOfNode = z.infer<typeof PercentOfNodeSchema>
export type CreditNode = z.infer<typeof CreditNodeSchema>
export type DeductionNode = z.infer<typeof DeductionNodeSchema>
export type SwitchNode = z.infer<typeof SwitchNodeSchema>
export type LookupNode = z.infer<typeof LookupNodeSchema>
export type ConditionalNode = z.infer<typeof ConditionalNodeSchema>
export type RoundNode = z.infer<typeof RoundNodeSchema>
export type FunctionNode = z.infer<typeof FunctionNodeSchema>
export type CalculationNode = z.infer<typeof CalculationNodeSchema>
export type OutputDefinition = z.infer<typeof OutputDefinitionSchema>
export type TaxConfig = z.infer<typeof TaxConfigSchema>
export type VariantConfig = z.infer<typeof VariantConfigSchema>

// ============================================================================
// Runtime types (not part of the YAML schema — no Zod schema needed)
// ============================================================================

export interface CalculationContext {
  inputs: Record<string, unknown>
  parameters: Parameters
  nodes: Record<string, unknown>
  config?: {
    meta?: {
      year?: number
      country?: string
    }
  }
}

export interface BreakdownItem {
  id: string
  label: string
  amount: number
  category: NonNullable<NodeCategory>
  description?: string
}

export interface CalculationResult {
  gross: number
  net: number
  effective_rate: number
  breakdown: BreakdownItem[]
  currency: string
  config_version_hash: string
  config_last_updated: string
}

export interface TestVector {
  name: string
  description?: string
  variant?: string
  inputs: Record<string, unknown>
  expected: {
    net: number
    effective_rate: number
    breakdown?: Record<string, number>
  }
  tolerance?: number
  tolerance_percent?: number
  sources?: ConfigSource[]
}
