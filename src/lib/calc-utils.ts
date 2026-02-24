import type { CalcRequest, InputDefinition } from "@/lib/api"

/**
 * Build a CalcRequest from form state + input definitions.
 * Shared between use-country-calculation and the destination wizard preview.
 */
export function buildCalcRequest(
  draft: {
    country: string
    year: string
    variant: string | undefined
    gross_annual: string
    formValues: Record<string, string>
  },
  inputDefs: Record<string, InputDefinition> | undefined
): CalcRequest | null {
  const { country, year, variant = "", gross_annual, formValues } = draft
  if (!country || !year || !gross_annual) return null

  const grossNum = parseFloat(gross_annual)
  if (isNaN(grossNum) || grossNum <= 0) return null

  const request: CalcRequest = { country, year, gross_annual: grossNum }
  if (variant) request.variant = variant

  for (const [key, value] of Object.entries(formValues)) {
    if (key === "gross_annual") continue
    const inputDef = inputDefs?.[key] as InputDefinition | undefined
    if (inputDef?.type === "boolean") {
      request[key] = value === "true"
    } else if (inputDef?.type === "number") {
      const numValue = parseFloat(value || "0")
      if (!isNaN(numValue)) request[key] = numValue
    } else if (value) {
      request[key] = value
    }
  }
  return request
}
