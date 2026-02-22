import { Metadata } from "next"
import { HeroSection } from "@/components/landing/hero-section"
import { PresetCards } from "@/components/landing/preset-cards"
import { FeaturesSection } from "@/components/landing/features-section"

export const metadata: Metadata = {
  title: "NetCalc - Tax-Advisor-Level Salary Comparisons for Mobile Professionals",
  description:
    "Answer 'If I move to [country/city], how will I actually be standing financially?' with canton+municipality-level tax calculations, expat regimes, and real deductions. Free, open source, and community-maintained.",
}

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <PresetCards />
      <FeaturesSection />
    </>
  )
}
