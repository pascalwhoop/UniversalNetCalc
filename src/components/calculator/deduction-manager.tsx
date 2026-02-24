"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { InputDefinition, CalcRequest, CalculationResult } from "@/lib/api"
import { calculateSalary } from "@/lib/api"
import { formatCurrency } from "@/lib/formatters"

interface DeductionManagerProps {
  inputDefs: Record<string, InputDefinition>
  formValues: Record<string, string>
  onUpdateFormValue: (key: string, value: string) => void
  columnIndex: number
  previewResult?: CalculationResult | null
  calcRequest: CalcRequest | null
}

interface DeductionInput {
  key: string
  def: InputDefinition
}

export function DeductionManager({
  inputDefs,
  formValues,
  onUpdateFormValue,
  columnIndex,
  previewResult,
  calcRequest,
}: DeductionManagerProps) {
  const [savings, setSavings] = useState<Record<string, number>>({})
  const abortRef = useRef<AbortController | null>(null)

  const deductionInputs: DeductionInput[] = Object.entries(inputDefs)
    .filter(([key, def]) => def.type === "number" && key !== "gross_annual")
    .map(([key, def]) => ({ key, def }))

  const primaryDeductions = deductionInputs.filter(({ def }) => !def.group)

  // Calculate per-field tax savings
  useEffect(() => {
    if (!calcRequest || !previewResult) {
      setSavings({})
      return
    }

    // Find deduction keys with non-zero values
    const activeKeys = deductionInputs
      .filter(({ key }) => {
        const val = parseFloat(formValues[key] || "0")
        return !isNaN(val) && val > 0
      })
      .map(({ key }) => key)

    if (activeKeys.length === 0) {
      setSavings({})
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const timer = setTimeout(async () => {
      const newSavings: Record<string, number> = {}

      for (const key of activeKeys) {
        if (controller.signal.aborted) return
        try {
          const withoutDeduction = { ...calcRequest, [key]: 0 }
          const result = await calculateSalary(withoutDeduction, controller.signal)
          // Savings = how much MORE net you get with the deduction
          newSavings[key] = previewResult.net - result.net
        } catch {
          // Aborted or failed — skip
        }
      }

      if (!controller.signal.aborted) {
        setSavings(newSavings)
      }
    }, 800)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcRequest, previewResult?.net])

  if (primaryDeductions.length === 0) return null

  const currency = previewResult?.currency || "EUR"

  return (
    <div className="space-y-3">
      {primaryDeductions.map(({ key, def }) => {
        const secondaryFields = deductionInputs.filter(({ def: d }) => d.group === key)
        const fieldSavings = savings[key]

        return (
          <div key={key} className="space-y-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${key}-${columnIndex}`} className="text-xs">
                {def.label || key}
              </Label>
              <Input
                id={`${key}-${columnIndex}`}
                type="text"
                inputMode="decimal"
                min={def.min ?? 0}
                max={def.max}
                placeholder="0"
                className="h-8"
                value={formValues[key] || ""}
                onChange={e => onUpdateFormValue(key, e.target.value)}
              />
              {fieldSavings != null && fieldSavings !== 0 && (
                <p className="text-[11px] font-medium text-green-600">
                  saves {formatCurrency(Math.abs(fieldSavings), currency)}/yr
                </p>
              )}
              {def.description && (
                <p className="text-[11px] text-muted-foreground">{def.description}</p>
              )}
            </div>

            {secondaryFields.length > 0 && (
              <div className="pl-3 border-l-2 border-muted space-y-2">
                {secondaryFields.map(({ key: sKey, def: sDef }) => (
                  <div key={sKey} className="space-y-1.5">
                    <Label htmlFor={`${sKey}-${columnIndex}`} className="text-xs text-muted-foreground">
                      {sDef.label || sKey}
                    </Label>
                    <Input
                      id={`${sKey}-${columnIndex}`}
                      type="text"
                      inputMode="decimal"
                      min={sDef.min ?? 0}
                      max={sDef.max}
                      placeholder="0"
                      className="h-8"
                      value={formValues[sKey] || ""}
                      onChange={e => onUpdateFormValue(sKey, e.target.value)}
                    />
                    {sDef.description && (
                      <p className="text-[11px] text-muted-foreground">{sDef.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
