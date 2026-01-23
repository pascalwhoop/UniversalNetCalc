"use client"

import { Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getCountryFlag } from "@/lib/country-metadata"
import { getCountryName } from "@/lib/api"

interface MobileCountrySelectorProps {
  countries: Array<{ index: number; country: string }>
  activeIndex: number
  onTabChange: (index: number) => void
  onAddCountry: () => void
  canAddMore: boolean
}

export function MobileCountrySelector({
  countries,
  activeIndex,
  onTabChange,
  onAddCountry,
  canAddMore,
}: MobileCountrySelectorProps) {
  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
      <Tabs
        value={String(activeIndex)}
        onValueChange={(value) => onTabChange(Number(value))}
        className="flex-1"
      >
        <TabsList className="w-full justify-start">
          {countries.map(({ index, country }) => (
            <TabsTrigger
              key={index}
              value={String(index)}
              className="min-w-[80px] gap-1.5"
            >
              <span className="text-base">
                {country ? getCountryFlag(country) : "🌍"}
              </span>
              <span className="text-xs">
                {country ? getCountryName(country) : `Country ${index + 1}`}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {canAddMore && (
        <Button
          onClick={onAddCountry}
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Add country"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
