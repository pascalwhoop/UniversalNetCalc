import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Globe, TrendingUp, Share2, Lock } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Compare Net Salaries Across Countries
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Accurate, transparent, and free tax calculations. Understand your
            real income worldwide.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/calculator">
              Start Comparing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <Globe className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Currency Conversion</h3>
            <p className="text-xs text-muted-foreground text-center">
              Compare across currencies
            </p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <TrendingUp className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Tax-Accurate</h3>
            <p className="text-xs text-muted-foreground text-center">
              Based on official tax rules
            </p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <Share2 className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Shareable Links</h3>
            <p className="text-xs text-muted-foreground text-center">
              Share comparisons easily
            </p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <Lock className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Privacy First</h3>
            <p className="text-xs text-muted-foreground text-center">
              No tracking or analytics
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
