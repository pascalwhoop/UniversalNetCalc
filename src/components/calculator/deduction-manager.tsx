"use client"

import { Plus, X, Edit2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { InputDefinition } from "@/lib/api"

interface DeductionManagerProps {
  inputDefs: Record<string, InputDefinition>
  formValues: Record<string, string>
  onUpdateFormValue: (key: string, value: string) => void
  columnIndex: number
}

// Define compound deductions (deductions that require multiple fields)
const COMPOUND_DEDUCTIONS: Record<string, string[]> = {
  mortgage_interest_paid: ["mortgage_interest_paid", "mortgage_start_year"],
  pension_contributions: ["pension_contributions", "jaarruimte_available"],
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
}: DeductionManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDeduction, setSelectedDeduction] = useState<string | null>(null)

  // Get all number inputs except gross_annual (these are deductions)
  const deductionInputs: DeductionInput[] = Object.entries(inputDefs)
    .filter(([key, def]) => def.type === "number" && key !== "gross_annual")
    .map(([key, def]) => ({ key, def }))

  // Get primary deduction keys (the main field for each deduction group)
  const primaryDeductionKeys = new Set(Object.keys(COMPOUND_DEDUCTIONS))

  // Filter to only show primary deduction fields (not secondary fields like mortgage_start_year)
  const primaryDeductions = deductionInputs.filter(({ key }) => {
    // If it's a compound deduction primary key, show it
    if (primaryDeductionKeys.has(key)) return true

    // If it's not part of any compound deduction, show it
    const isSecondaryField = Object.values(COMPOUND_DEDUCTIONS).some(fields =>
      fields.includes(key) && fields[0] !== key
    )
    return !isSecondaryField
  })

  // Check if a deduction is active (all required fields are non-zero)
  const isDeductionActive = (primaryKey: string): boolean => {
    const relatedFields = COMPOUND_DEDUCTIONS[primaryKey] || [primaryKey]
    return relatedFields.every(field => {
      const value = parseFloat(formValues[field] || "0")
      return value > 0
    })
  }

  // Get active deductions
  const activeDeductions = primaryDeductions.filter(({ key }) => isDeductionActive(key))

  // Get available deductions
  const availableDeductions = primaryDeductions.filter(({ key }) => !isDeductionActive(key))

  const handleOpenAddDialog = () => {
    setSelectedDeduction(null)
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (key: string) => {
    setSelectedDeduction(key)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedDeduction(null)
  }

  const handleRemoveDeduction = (key: string) => {
    // Remove all related fields
    const relatedFields = COMPOUND_DEDUCTIONS[key] || [key]
    relatedFields.forEach(field => {
      onUpdateFormValue(field, "0")
    })
  }

  const handleSelectDeduction = (key: string) => {
    setSelectedDeduction(key)
  }

  // Inputs update parent formValues directly
  const handleInputChange = (key: string, value: string) => {
    onUpdateFormValue(key, value)
  }

  if (deductionInputs.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Active Deductions List */}
      {activeDeductions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Active Deductions</Label>
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
                    <div className="text-xs text-muted-foreground">
                      {value.toLocaleString()}
                    </div>
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

      {/* Add Deduction Button */}
      {availableDeductions.length > 0 && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleOpenAddDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Deduction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedDeduction ? "Edit Deduction" : "Add Deduction"}
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
                  <Label htmlFor={`deduction-type-${columnIndex}`}>
                    Deduction Type
                  </Label>
                  <Select onValueChange={handleSelectDeduction}>
                    <SelectTrigger id={`deduction-type-${columnIndex}`}>
                      <SelectValue placeholder="Select a deduction type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDeductions.map(({ key, def }) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{def.label || key}</span>
                            {def.description && (
                              <span className="text-xs text-muted-foreground">
                                {def.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Amount Input (shown when deduction is selected) */}
              {selectedDeduction && (
                <>
                  {/* Show deduction info */}
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

                  {/* Render all related input fields */}
                  {(COMPOUND_DEDUCTIONS[selectedDeduction] || [selectedDeduction]).map((fieldKey) => {
                    const fieldDef = inputDefs[fieldKey]
                    if (!fieldDef) return null

                    return (
                      <div key={fieldKey} className="space-y-2">
                        <Label htmlFor={`${fieldKey}-${columnIndex}`}>
                          {fieldDef.label || fieldKey}
                        </Label>
                        <Input
                          id={`${fieldKey}-${columnIndex}`}
                          type="number"
                          min={fieldDef.min || 0}
                          max={fieldDef.max}
                          placeholder="0"
                          value={formValues[fieldKey] || "0"}
                          onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                        />
                        {fieldDef.description && (
                          <p className="text-xs text-muted-foreground">
                            {fieldDef.description}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseDialog}
                disabled={!selectedDeduction}
              >
                {selectedDeduction && isDeductionActive(selectedDeduction)
                  ? "Update"
                  : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
