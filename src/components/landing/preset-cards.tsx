"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

type PresetCountry = { label: string; param: string }

const presets: {
  id: string
  title: string
  description: string
  countries: PresetCountry[]
  variants?: string
  icon: string
}[] = [
  {
    id: "tech-hubs",
    title: "Tech Hubs",
    description: "Compare salaries in the world's top tech centers",
    countries: [
      { label: "US/CA", param: "us---state:california" },
      { label: "CH/ZH", param: "ch---region_level_1:zurich" },
      { label: "NL", param: "nl" },
    ],
    icon: "🏙️",
  },
  {
    id: "eu-comparison",
    title: "EU Comparison",
    description: "Navigate European tax systems side-by-side",
    countries: [
      { label: "DE", param: "de" },
      { label: "FR", param: "fr" },
      { label: "NL", param: "nl" },
      { label: "IT", param: "it" },
    ],
    icon: "🇪🇺",
  },
  {
    id: "expat-havens",
    title: "Expat Havens",
    description: "Explore tax-optimized destinations for international workers",
    countries: [
      { label: "CH", param: "ch" },
      { label: "NL", param: "nl" },
      { label: "PT", param: "pt" },
      { label: "AE", param: "ae" },
    ],
    variants: "nl:30-ruling",
    icon: "✈️",
  },
]

export function PresetCards() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Mobility Scenarios</h2>
          <p className="text-lg text-muted-foreground">
            Common comparisons for professionals considering a move
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {presets.map((preset) => {
            const cParam = preset.countries.map((c) => c.param).join(",")
            const href = `/calculator?c=${cParam}${preset.variants ? `&v=${preset.variants}` : ""}`
            return (
              <Card
                key={preset.id}
                className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <div className="p-6">
                  <div className="text-4xl mb-4">{preset.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{preset.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {preset.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {preset.countries.map((country) => (
                      <span
                        key={country.param}
                        className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
                      >
                        {country.label}
                      </span>
                    ))}
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full gap-2 group-hover:border-primary group-hover:text-primary"
                  >
                    <Link href={href}>
                      Compare
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
