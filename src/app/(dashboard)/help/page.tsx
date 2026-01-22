import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

export default function HelpPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Help & Documentation</h1>
          <p className="text-muted-foreground">
            Learn how to use the salary calculator
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Quick guide to calculating your net salary
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Select a country from the dropdown menu</li>
              <li>Choose the tax year for your calculation</li>
              <li>Enter your gross annual salary</li>
              <li>Optionally select a tax variant (e.g., expat regime)</li>
              <li>View the detailed breakdown of taxes and contributions</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="accuracy">
                <AccordionTrigger>
                  How accurate are these calculations?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Our calculations use community-maintained tax configurations
                    that are validated against official tax tables. However,
                    individual circumstances may vary. This tool provides
                    estimates for informational purposes only and should not be
                    considered tax advice.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="variants">
                <AccordionTrigger>What are tax variants?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Tax variants represent different tax regimes within a
                    country. For example, the Netherlands offers a &quot;30%
                    ruling&quot; for qualifying expats, which allows 30% of
                    salary to be tax-free. Switzerland has different tax rates
                    by canton and municipality.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="compare">
                <AccordionTrigger>
                  Can I compare multiple countries?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Yes! Click &quot;Add Country&quot; to add up to 4 countries for
                    side-by-side comparison. This is useful for expats
                    evaluating different relocation destinations.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="contribute">
                <AccordionTrigger>
                  How can I contribute or report errors?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Tax configurations are maintained on GitHub. You can submit
                    pull requests to add new countries, update tax rates, or fix
                    errors. Each configuration includes test vectors to ensure
                    accuracy.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Countries</CardTitle>
            <CardDescription>
              Countries currently available for calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                "Switzerland",
                "Netherlands",
                "Germany",
                "United Kingdom",
                "Ireland",
                "France",
                "Spain",
                "Portugal",
                "Italy",
                "UAE",
                "Singapore",
                "Hong Kong",
                "Canada",
                "Australia",
                "United States",
              ].map((country) => (
                <Badge key={country} variant="secondary">
                  {country}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This calculator provides informational estimates only and does not
              constitute tax, legal, or financial advice. Tax laws are complex
              and subject to change. Always consult a qualified tax professional
              for your specific situation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
