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
    title: "Deep Regional Accuracy",
    description: "Not just country-level estimates. We calculate down to canton and municipality level for Switzerland, state-level for the US, and handle expat regimes like the Dutch 30% ruling.",
  },
  {
    icon: DollarSign,
    title: "Beyond Cost-of-Living Calculators",
    description: "Unlike Numbeo or rough estimators, we model actual tax brackets, social contributions, credits, and deductions based on official government sources.",
  },
  {
    icon: Database,
    title: "Config-Driven & Agentic",
    description: "Tax rules are encoded in YAML configs researched by AI agents and verified by the community. Every country is maintained as code with test vectors.",
  },
  {
    icon: Share2,
    title: "Shareable & Collaborative",
    description: "Generate comparison links to share with recruiters, family, or colleagues considering the same move.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Works seamlessly on desktop, tablet, and mobile devices. Compare countries on the go.",
  },
  {
    icon: Lock,
    title: "Open Source & Private",
    description: "100% open source. No tracking, no analytics, no data collection. Your salary data never leaves your browser.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why This Beats Rough Cost-of-Living Tools</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We don&apos;t estimate. We calculate. Tax rules are encoded as config files, researched by AI agents,
            maintained by the community, and tested with real-world scenarios.
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
