import { Card } from "@/components/ui/card"
import {
  Globe,
  DollarSign,
  Share2,
  Database,
  Smartphone,
  Lock,
} from "lucide-react"

const features = [
  {
    icon: Globe,
    title: "10+ Countries",
    description: "Support for multiple countries with regional variations",
  },
  {
    icon: DollarSign,
    title: "Currency Conversion",
    description: "Real-time exchange rates for accurate comparisons",
  },
  {
    icon: Share2,
    title: "Shareable Links",
    description: "Generate and share comparison URLs with colleagues",
  },
  {
    icon: Database,
    title: "Save Calculations",
    description: "Store and track salary calculations over time",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Works seamlessly on desktop, tablet, and mobile devices",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "No tracking, no analytics, no data collection",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Features</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to understand your income worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="p-6">
                <div className="mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
