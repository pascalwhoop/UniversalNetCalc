"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CostOfLiving } from "@/lib/types"

interface CostOfLivingSectionProps {
  value: CostOfLiving
  currencySymbol: string
  onChange: (col: CostOfLiving) => void
}

const FIELDS: { key: keyof CostOfLiving; label: string }[] = [
  { key: "rent", label: "Rent / Housing" },
  { key: "healthcare", label: "Healthcare" },
  { key: "food", label: "Food & Groceries" },
  { key: "mobility", label: "Transport / Mobility" },
  { key: "travel", label: "Travel & Leisure" },
]

export function CostOfLivingSection({ value, currencySymbol, onChange }: CostOfLivingSectionProps) {
  const [open, setOpen] = useState(false)

  const handleChange = (key: keyof CostOfLiving, raw: string) => {
    const num = parseFloat(raw)
    onChange({ ...value, [key]: isNaN(num) ? 0 : num })
  }

  const totalMonthly = Object.values(value).reduce((sum, v) => sum + v, 0)

  const label =
    totalMonthly > 0
      ? `${currencySymbol}${Math.round(totalMonthly).toLocaleString()}/mo`
      : "Add monthly costs"

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-between"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <span className="flex items-center gap-2">
          {totalMonthly === 0 && <Plus className="h-4 w-4" />}
          {label}
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {open && (
        <div className="space-y-2 pl-1">
          <p className="text-xs text-muted-foreground">Monthly costs in local currency</p>
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-0.5">
              <Label htmlFor={`col-${key}`} className="text-xs text-muted-foreground">
                {label}
              </Label>
              <div className="flex items-center h-8 rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="pl-3 pr-1 text-muted-foreground whitespace-nowrap shrink-0">
                  {currencySymbol}
                </span>
                <input
                  id={`col-${key}`}
                  type="number"
                  min={0}
                  step={50}
                  value={value[key] || ""}
                  onChange={e => handleChange(key, e.target.value)}
                  className="flex-1 min-w-0 bg-transparent py-1 pr-3 outline-none placeholder:text-muted-foreground"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
