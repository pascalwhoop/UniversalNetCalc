"use client"

import { Plus, X, Edit2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { InputDefinition, CalcRequest, CalculationResult } from "@/lib/api"
import { calculateSalary, getCurrencySymbol } from "@/lib/api"

interface DeductionManagerProps {
  inputDefs: Record<string, InputDefinition>
  formValues: Record<string, string>
  onUpdateFormValue: (key: string, value: string) => void
  columnIndex: number
  result?: CalculationResult | null
  calcRequest: CalcRequest | null
}

// Fields that belong to a compound deduction group (primary key → all field keys)
const COMPOUND_DEDUCTIONS: Record<string, string[]> = {
  mortgage_interest_paid: ["mortgage_interest_paid", "mortgage_start_year"],
  pension_contributions: ["pension_contributions", "jaarruimte_available"],
}

interface DeductionInput {
  key: string
  def: InputDefinition
}

// Inner component that owns the baseline API call for exact saving calculation
function DeductionDialog({
  open,
  onOpenChange,
  selectedDeduction,
  onSelectDeduction,
  availableDeductions,
  inputDefs,
  formValues,
  onInputChange,
  onClose,
  isDeductionActive,
  calcRequest,
  result,
  columnIndex,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  selectedDeduction: string | null
  onSelectDeduction: (key: string) => void
  availableDeductions: DeductionInput[]
  inputDefs: Record<string, InputDefinition>
  formValues: Record<string, string>
  onInputChange: (key: string, value: string) => void
  onClose: () => void
  isDeductionActive: (key: string) => boolean
  calcRequest: CalcRequest | null
  result?: CalculationResult | null
  columnIndex: number
}) {
  const [baseline, setBaseline] = useState<CalculationResult | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // When dialog opens with a selected deduction, or when the primary amount changes,
  // fire a baseline calc with that deduction's fields zeroed out.
  useEffect(() => {
    if (!open || !selectedDeduction || !calcRequest) {
      setBaseline(null)
      return
    }

    const primaryAmount = parseFloat(formValues[selectedDeduction] || "0")
    if (primaryAmount <= 0) {
      setBaseline(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      // Build a request identical to the current one but with this deduction's fields zeroed
      const zeroedFields = COMPOUND_DEDUCTIONS[selectedDeduction] || [selectedDeduction]
      const baselineRequest: CalcRequest = { ...calcRequest }
      for (const field of zeroedFields) {
        baselineRequest[field] = 0
      }
      try {
        const baselineResult = await calculateSalary(baselineRequest)
        setBaseline(baselineResult)
      } catch {
        setBaseline(null)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [open, selectedDeduction, formValues, calcRequest])

  const currency = result?.currency ?? calcRequest?.country ?? "EUR"
  const currencySymbol = getCurrencySymbol(currency)

  // Exact saving = net with deduction (current result) minus net without (baseline)
  const exactSaving =
    result && baseline && selectedDeduction
      ? result.net - baseline.net
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selectedDeduction ? "Edit Tax Deduction" : "Add Tax Deduction"}
          </DialogTitle>
          <DialogDescription>
            {selectedDeduction
              ? "Update the deduction amount"
              : "Select a deduction type and enter the amount"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Deduction Type Selection (only when adding new) */}
          {!selectedDeduction && (
            <div className="space-y-2">
              <Label htmlFor={`deduction-type-${columnIndex}`}>Deduction Type</Label>
              <Select onValueChange={onSelectDeduction}>
                <SelectTrigger id={`deduction-type-${columnIndex}`}>
                  <SelectValue placeholder="Select a deduction type" />
                </SelectTrigger>
                <SelectContent>
                  {availableDeductions.map(({ key, def }) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{def.label || key}</span>
                        {def.description && (
                          <span className="text-xs text-muted-foreground">{def.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fields for selected deduction */}
          {selectedDeduction && (
            <>
              <div className="rounded-md bg-muted/50 p-3 space-y-1">
                <div className="font-medium">
                  {inputDefs[selectedDeduction]?.label || selectedDeduction}
                </div>
                {inputDefs[selectedDeduction]?.description && (
                  <div className="text-xs text-muted-foreground">
                    {inputDefs[selectedDeduction].description}
                  </div>
                )}
              </div>

              {(COMPOUND_DEDUCTIONS[selectedDeduction] || [selectedDeduction]).map(fieldKey => {
                const fieldDef = inputDefs[fieldKey]
                if (!fieldDef) return null

                const fieldValue = formValues[fieldKey]
                const displayValue =
                  fieldValue !== undefined && fieldValue !== ""
                    ? fieldValue
                    : fieldDef.default !== undefined
                      ? String(fieldDef.default)
                      : ""

                return (
                  <div key={fieldKey} className="space-y-2">
                    <Label htmlFor={`${fieldKey}-${columnIndex}`}>
                      {fieldDef.label || fieldKey}
                    </Label>
                    <Input
                      id={`${fieldKey}-${columnIndex}`}
                      type="number"
                      min={fieldDef.min ?? 0}
                      max={fieldDef.max}
                      placeholder="0"
                      value={displayValue}
                      onChange={e => onInputChange(fieldKey, e.target.value)}
                    />
                    {fieldDef.description && (
                      <p className="text-xs text-muted-foreground">{fieldDef.description}</p>
                    )}
                  </div>
                )
              })}

              {/* Exact tax saving — shown once baseline call completes */}
              {exactSaving !== null && exactSaving > 0 && (
                <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 px-3 py-2 text-sm">
                  <span className="font-medium text-green-800 dark:text-green-300">
                    Tax saving: {currencySymbol}
                    {Math.round(exactSaving).toLocaleString()}/yr
                  </span>
                  <span className="text-green-700 dark:text-green-400 ml-2">
                    ({currencySymbol}{Math.round(exactSaving / 12).toLocaleString()}/mo)
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose} disabled={!selectedDeduction}>
            {selectedDeduction && isDeductionActive(selectedDeduction) ? "Update" : "Add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function DeductionManager({
  inputDefs,
  formValues,
  onUpdateFormValue,
  columnIndex,
  result,
  calcRequest,
}: DeductionManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDeduction, setSelectedDeduction] = useState<string | null>(null)

  const deductionInputs: DeductionInput[] = Object.entries(inputDefs)
    .filter(([key, def]) => def.type === "number" && key !== "gross_annual")
    .map(([key, def]) => ({ key, def }))

  const primaryDeductionKeys = new Set(Object.keys(COMPOUND_DEDUCTIONS))

  const primaryDeductions = deductionInputs.filter(({ key }) => {
    if (primaryDeductionKeys.has(key)) return true
    const isSecondaryField = Object.values(COMPOUND_DEDUCTIONS).some(
      fields => fields.includes(key) && fields[0] !== key
    )
    return !isSecondaryField
  })

  const isDeductionActive = (primaryKey: string): boolean => {
    const relatedFields = COMPOUND_DEDUCTIONS[primaryKey] || [primaryKey]
    return relatedFields.every(field => parseFloat(formValues[field] || "0") > 0)
  }

  const activeDeductions = primaryDeductions.filter(({ key }) => isDeductionActive(key))
  const availableDeductions = primaryDeductions.filter(({ key }) => !isDeductionActive(key))

  const handleOpenEditDialog = (key: string) => {
    setSelectedDeduction(key)
    setDialogOpen(true)
  }

  const handleOpenAddDialog = () => {
    setSelectedDeduction(null)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedDeduction(null)
  }

  const handleRemoveDeduction = (key: string) => {
    const relatedFields = COMPOUND_DEDUCTIONS[key] || [key]
    relatedFields.forEach(field => onUpdateFormValue(field, "0"))
  }

  if (deductionInputs.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Active Deductions List */}
      {activeDeductions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tax Deductions</Label>
          <div className="space-y-1.5">
            {activeDeductions.map(({ key, def }) => {
              const value = parseFloat(formValues[key] || "0")
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 rounded-md border bg-muted/30 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{def.label || key}</div>
                    <div className="text-xs text-muted-foreground">{value.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenEditDialog(key)}
                    >
                      <Edit2 className="h-3 w-3" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveDeduction(key)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Deduction Button + Dialog */}
      {availableDeductions.length > 0 && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleOpenAddDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tax Deduction
          </Button>
        </>
      )}

      {/* Dialog is always mounted so it can manage its own baseline state */}
      <DeductionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDeduction={selectedDeduction}
        onSelectDeduction={setSelectedDeduction}
        availableDeductions={availableDeductions}
        inputDefs={inputDefs}
        formValues={formValues}
        onInputChange={onUpdateFormValue}
        onClose={handleCloseDialog}
        isDeductionActive={isDeductionActive}
        calcRequest={calcRequest}
        result={result}
        columnIndex={columnIndex}
      />
    </div>
  )
}
