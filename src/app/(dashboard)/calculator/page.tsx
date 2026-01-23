import { Suspense } from "react"
import { ComparisonGrid } from "@/components/calculator"

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <ComparisonGrid />
    </Suspense>
  )
}
