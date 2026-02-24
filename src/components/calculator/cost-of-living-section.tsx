"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { CostOfLiving, LIVING_COST_CATEGORIES } from "@/lib/types"

interface CostOfLivingSectionProps {
  value: CostOfLiving
  currencySymbol: string
  onChange: (col: CostOfLiving) => void
  alwaysOpen?: boolean
}

export function CostOfLivingSection({ value, currencySymbol, onChange, alwaysOpen = false }: CostOfLivingSectionProps) {
  const [open, setOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const isOpen = alwaysOpen || open

  const activeIds = Object.keys(value)
  const available = LIVING_COST_CATEGORIES.filter(c => !activeIds.includes(c.id))

  const handleChange = (id: string, raw: string) => {
    const num = parseFloat(raw)
    onChange({ ...value, [id]: isNaN(num) ? 0 : num })
  }

  const handleAdd = (id: string) => {
    onChange({ ...value, [id]: 0 })
    setPopoverOpen(false)
  }

  const handleRemove = (id: string) => {
    const next = { ...value }
    delete next[id]
    onChange(next)
  }

  const totalMonthly = Object.values(value).reduce((sum, v) => sum + v, 0)

  const totalAnnual = totalMonthly * 12
  const label =
    totalMonthly > 0
      ? `${currencySymbol}${Math.round(totalMonthly).toLocaleString()}/mo  ·  ${currencySymbol}${Math.round(totalAnnual).toLocaleString()}/yr`
      : "Add monthly costs"

  const activeCategories = LIVING_COST_CATEGORIES.filter(c => activeIds.includes(c.id))

  return (
    <div className="space-y-1">
      {!alwaysOpen && (
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
      )}

      {isOpen && (
        <div className="space-y-2 pl-1">
          <p className="text-xs text-muted-foreground">Monthly costs — annual equivalent shown per item</p>

          {activeCategories.map(cat => {
            const monthly = value[cat.id] || 0
            const annual = monthly * 12
            return (
              <div key={cat.id} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`col-${cat.id}`} className="text-xs text-muted-foreground">
                    {cat.emoji} {cat.label}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(cat.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center h-8 rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="pl-3 pr-1 text-muted-foreground whitespace-nowrap shrink-0">
                    {currencySymbol}
                  </span>
                  <input
                    id={`col-${cat.id}`}
                    type="text"
                    inputMode="decimal"
                    min={0}
                    step={50}
                    value={value[cat.id] || ""}
                    onChange={e => handleChange(cat.id, e.target.value)}
                    className="flex-1 min-w-0 bg-transparent py-1 outline-none placeholder:text-muted-foreground"
                    placeholder="0"
                  />
                  <span className="pr-2.5 text-muted-foreground text-xs whitespace-nowrap shrink-0">/mo</span>
                </div>
                {monthly > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    = {currencySymbol}{Math.round(annual).toLocaleString()}/yr
                  </p>
                )}
              </div>
            )
          })}

          {available.length > 0 && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Add category
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[250px]" align="start">
                <Command>
                  <CommandInput placeholder="Search categories..." />
                  <CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    {available.map(cat => (
                      <CommandItem
                        key={cat.id}
                        value={`${cat.label}`}
                        onSelect={() => handleAdd(cat.id)}
                      >
                        <span className="mr-2">{cat.emoji}</span>
                        {cat.label}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  )
}
