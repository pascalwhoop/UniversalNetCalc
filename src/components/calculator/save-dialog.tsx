"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { saveCalculation } from "@/lib/storage"
import { ComparisonState } from "@/lib/types"
import { CalculationResult } from "@/lib/api"
import { getCountryName } from "@/lib/api"

interface SaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: ComparisonState
  results?: Map<string, { country: string; year: string; result: CalculationResult }>
}

export function SaveDialog({ open, onOpenChange, state, results }: SaveDialogProps) {
  // Generate default name
  const generateDefaultName = () => {
    if (state.countries.length === 0) return "Untitled Comparison"

    const countryNames = state.countries
      .slice(0, 2)
      .map((c) => getCountryName(c.country))
      .join(" vs ")

    const gross = state.countries[0]?.gross_annual
    const grossFormatted = gross ? `${parseInt(gross).toLocaleString()}` : ""

    if (grossFormatted) {
      return `${countryNames} - ${grossFormatted}`
    }

    return countryNames
  }

  const [name, setName] = useState(generateDefaultName())
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name")
      return
    }

    setIsSaving(true)

    try {
      // Convert results map to array format
      const resultsArray = results
        ? Array.from(results.entries()).map(([_index, data]) => ({
            country: data.country,
            year: data.year,
            result: data.result,
          }))
        : undefined

      saveCalculation(name.trim(), state, resultsArray, notes.trim() || undefined)

      toast.success("Calculation saved", {
        description: "You can find it in your history",
      })

      onOpenChange(false)

      // Reset form
      setName(generateDefaultName())
      setNotes("")
    } catch (error) {
      console.error("Failed to save:", error)
      toast.error("Failed to save calculation")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Calculation</DialogTitle>
          <DialogDescription>
            Save this comparison to access it later from your history
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Netherlands vs Germany - €60k"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Add any notes about this comparison..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
