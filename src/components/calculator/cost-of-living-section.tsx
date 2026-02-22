"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [open, setOpen] = useState(true)

  const handleChange = (key: keyof CostOfLiving, raw: string) => {
    const num = parseFloat(raw)
    onChange({ ...value, [key]: isNaN(num) ? 0 : num })
  }

  const totalMonthly = Object.values(value).reduce((sum, v) => sum + v, 0)

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <span>
          Living costs
          {totalMonthly > 0 && (
            <span className="ml-1 font-medium text-foreground">
              ({currencySymbol}{Math.round(totalMonthly).toLocaleString()}/mo)
            </span>
          )}
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
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  id={`col-${key}`}
                  type="number"
                  min={0}
                  step={50}
                  value={value[key] || ""}
                  onChange={e => handleChange(key, e.target.value)}
                  className="pl-7 h-8 text-sm"
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
