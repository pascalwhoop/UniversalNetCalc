import { Metadata } from "next"
import { HeroSection } from "@/components/landing/hero-section"
import { PresetCards } from "@/components/landing/preset-cards"
import { FeaturesSection } from "@/components/landing/features-section"

export const metadata: Metadata = {
  title: "NetCalc - Compare Salaries Across Countries",
  description:
    "Accurate, transparent, and free tax calculations. Compare net salaries side-by-side with currency conversion and shareable links.",
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
