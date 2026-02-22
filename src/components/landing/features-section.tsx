import { Card } from "@/components/ui/card"
import {
  MapPin,
  FileText,
  Bot,
  Database,
  Smartphone,
  Lock,
} from "lucide-react"

const features = [
  {
    icon: MapPin,
    title: "Deep Regional Accuracy",
    description: "Not just country-level—canton/municipality tax rates, local deductions, expat regimes like Netherlands' 30% ruling",
  },
  {
    icon: FileText,
    title: "Beyond Cost-of-Living Calculators",
    description: "Real tax brackets and credits, not rough estimates. Compare actual after-tax income, not Numbeo approximations",
  },
  {
    icon: Database,
    title: "Config-Driven Tax Rules",
    description: "Every country's tax system defined in human-readable YAML configs. Transparent, verifiable, and version-controlled",
  },
  {
    icon: Bot,
    title: "Agentic Research",
    description: "Tax rules researched and implemented by AI agents, then verified by the community. Faster updates, fewer errors",
  },
  {
    icon: Lock,
    title: "Open Source & Private",
    description: "No tracking, no paywalls, no data collection. All calculations happen in your browser. Code is public on GitHub",
  },
  {
    icon: Smartphone,
    title: "Mobile-Friendly",
    description: "Compare salaries on the go. Responsive design works seamlessly on desktop, tablet, and mobile devices",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why This Beats Rough Cost-of-Living Tools</h2>
          <p className="text-lg text-muted-foreground">
            Tax-advisor-level depth meets config-driven transparency. Built by the community, for the community.
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
