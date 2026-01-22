"use client"

import { useState, useCallback } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountryColumn } from "./country-column"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { toast } from "sonner"

const MAX_COUNTRIES = 4

interface SharedGrossData {
  amount: string
  currency: string
}

export function ComparisonGrid() {
  const [countries, setCountries] = useState<number[]>([0])
  const [sharedGross, setSharedGross] = useState<SharedGrossData | null>(null)

  const addCountry = () => {
    if (countries.length < MAX_COUNTRIES) {
      setCountries([...countries, countries.length])
    }
  }

  const removeCountry = (index: number) => {
    if (countries.length > 1) {
      setCountries(countries.filter((_, i) => i !== index))
    }
  }

  const handleCopyGrossToAll = useCallback(async (gross: string, sourceCurrency: string) => {
    // Set shared gross with currency info for conversion
    setSharedGross({ amount: gross, currency: sourceCurrency })
    // Reset after a tick so columns can pick up the change
    setTimeout(() => setSharedGross(null), 0)
    toast.success("Salary copied to all countries (with currency conversion)")
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Grid Header */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h2 className="text-lg font-semibold">Compare Countries</h2>
          <p className="text-sm text-muted-foreground">
            Add up to {MAX_COUNTRIES} countries to compare side by side
          </p>
        </div>
        <Button
          onClick={addCountry}
          disabled={countries.length >= MAX_COUNTRIES}
          variant="outline"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Country
        </Button>
      </div>

      {/* Country Columns */}
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div
          className="grid gap-4 pb-4"
          style={{
            gridTemplateColumns: `repeat(${countries.length}, minmax(300px, 1fr))`,
          }}
        >
          {countries.map((_, index) => (
            <CountryColumn
              key={index}
              index={index}
              onRemove={() => removeCountry(index)}
              showRemove={countries.length > 1}
              showCopyToAll={countries.length > 1}
              onCopyGrossToAll={handleCopyGrossToAll}
              sharedGross={sharedGross}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
