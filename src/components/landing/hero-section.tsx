import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Globe, TrendingUp, Share2, Lock } from "lucide-react"
import { LayoutTextFlip } from "@/components/ui/layout-text-flip"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-block mb-4 px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            For Geographically Mobile Professionals
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-3">
            <LayoutTextFlip
              text="If I move to"
              words={["Amsterdam", "Berlin", "Zurich", "London", "Barcelona", "Lisbon", "Paris", "Dubai", "Singapore", "Toronto", "Dublin", "Tallinn"]}
              duration={2200}
            />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            what would I actually take home?
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Tax-advisor-level accuracy for EU free movers, expats, remote workers, and consultants.
            Compare real after-tax income across countries and regions—all in one place.
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
            <TrendingUp className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Tax Advisor Depth</h3>
            <p className="text-xs text-muted-foreground text-center">
              Canton + municipality level, expat regimes, deductions
            </p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <Globe className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-sm">All Countries, One Place</h3>
            <p className="text-xs text-muted-foreground text-center">
              Side-by-side comparison vs. scattered estimates
            </p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <Lock className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Free & Community-Maintained</h3>
            <p className="text-xs text-muted-foreground text-center">
              Open source, no tracking, no paywalls
            </p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-lg bg-card border">
            <Share2 className="w-8 h-8 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Share & Collaborate</h3>
            <p className="text-xs text-muted-foreground text-center">
              Shareable links for team decisions
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
