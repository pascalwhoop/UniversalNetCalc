import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, BookOpen, Calculator, GitBranch } from "lucide-react"
import Link from "next/link"
import { getCountryName } from "@/lib/country-metadata"

// Read configs manifest to get actual country coverage
async function getCountryCoverage() {
  try {
    const manifest = await import("@/../configs-manifest.json")
    const countriesData = (manifest.default as unknown as { countries: Record<string, { years: Record<string, { variants: string[] }> }> }).countries
    const countries = Object.keys(countriesData).map((code) => ({
      code,
      name: getCountryName(code),
      years: Object.keys(countriesData[code].years),
      variants: Object.values(countriesData[code].years).flatMap(y => y.variants),
    }))
    return countries.sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

export default async function HelpPage() {
  const countries = await getCountryCoverage()

  return (
    <div className="p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Help & Documentation</h1>
          <p className="text-muted-foreground">
            Learn how to use the salary calculator and understand how it works
          </p>
        </div>

        {/* Getting Started */}
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
              <li>Enter your gross annual salary in the local currency</li>
              <li>Fill in any required inputs (e.g., filing status, region)</li>
              <li>Optionally select a tax variant (e.g., expat regime)</li>
              <li>View the detailed breakdown of taxes and contributions</li>
              <li>Add more countries to compare side-by-side (up to 4)</li>
              <li>Share your comparison with the shareable URL</li>
            </ol>
          </CardContent>
        </Card>

        {/* Methodology */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <CardTitle>How It Works</CardTitle>
            </div>
            <CardDescription>
              Understanding the calculation engine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Config-Driven Tax Calculations</h4>
              <p className="text-muted-foreground">
                Each country&apos;s tax rules are defined in YAML configuration files. These configs
                describe a <strong>directed acyclic graph (DAG)</strong> of calculations that
                process your inputs to produce the final net salary.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Calculation Flow</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                <li>Start with your gross annual salary</li>
                <li>Calculate taxable income (after deductions)</li>
                <li>Apply progressive tax brackets to determine tax owed</li>
                <li>Calculate social contributions (pension, healthcare, etc.)</li>
                <li>Apply tax credits to reduce final tax bill</li>
                <li>Compute net income: Gross - Taxes - Contributions + Credits</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Tax Rates Explained</h4>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>
                  <strong>Effective Rate:</strong> Average tax rate on your total income
                  (total tax / gross income)
                </li>
                <li>
                  <strong>Marginal Rate:</strong> Tax rate on your next earned amount
                  (shows what percentage of a raise you&apos;ll keep)
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <p className="text-muted-foreground text-xs">
                The calculation engine is pure TypeScript with no framework dependencies,
                allowing it to run efficiently in Cloudflare Workers. All configs are
                validated with test vectors to ensure accuracy.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
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
                  <p className="text-sm text-muted-foreground mb-3">
                    Our calculations use community-maintained tax configurations
                    that are validated against official tax tables. Each configuration
                    includes test vectors that verify calculations against known
                    correct values.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    However, individual circumstances vary widely. This tool provides
                    estimates for informational purposes only and should not be
                    considered tax advice. Always consult a qualified tax professional
                    for your specific situation.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="trust">
                <AccordionTrigger>
                  Can I trust these results for financial planning?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Our calculations are designed to be as accurate as possible and
                    are based on official tax tables. However:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>Tax laws are complex and change frequently</li>
                    <li>Personal circumstances affect final tax liability</li>
                    <li>Some deductions and credits may not be modeled</li>
                    <li>Regional variations may not be fully captured</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    Use these calculations as a starting point for understanding
                    potential tax liability, not as definitive tax advice.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="variants">
                <AccordionTrigger>What are tax variants?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tax variants represent different tax regimes or special rules
                    within a country. Examples include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>
                      <strong>Netherlands 30% Ruling:</strong> Qualifying expats can
                      receive 30% of salary tax-free
                    </li>
                    <li>
                      <strong>Italy Impatriate Regime:</strong> Reduced taxation for
                      workers relocating to Italy
                    </li>
                    <li>
                      <strong>Switzerland Cantons:</strong> Different tax rates by
                      canton and municipality
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="compare">
                <AccordionTrigger>
                  Can I compare multiple countries?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Yes! Click &quot;Add Country&quot; to add up to 4 countries for
                    side-by-side comparison. Currency conversion is handled
                    automatically using recent exchange rates.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This is particularly useful for expats evaluating relocation
                    options or digital nomads comparing cost of living across
                    countries.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="currency">
                <AccordionTrigger>
                  How does currency conversion work?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    When comparing countries with different currencies, we fetch
                    recent exchange rates and convert all values for fair comparison.
                    The &quot;Copy to All&quot; button automatically converts your
                    salary to each country&apos;s local currency.
                  </p>
                  <p className="text-sm text-muted-foreground text-xs">
                    Exchange rates are updated regularly but may not reflect
                    real-time values. For precise conversion, consult current
                    exchange rates from your bank or financial institution.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="missing-country">
                <AccordionTrigger>
                  Why is my country not listed?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    We&apos;re continuously adding new countries! The calculator is
                    open-source and community-driven. If your country isn&apos;t
                    available yet, you can:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>Request it by opening an issue on GitHub</li>
                    <li>Contribute a tax configuration for your country</li>
                    <li>Help verify existing configurations</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="share">
                <AccordionTrigger>
                  Can I share my comparison with others?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Yes! The URL automatically updates to include your configuration.
                    Simply copy the URL from your browser and share it. Others will
                    see the exact same countries, salaries, and settings you configured.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="contribute">
                <AccordionTrigger>
                  How can I contribute or report errors?
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Tax configurations are maintained on GitHub. Contributions
                      are welcome! You can:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Report calculation errors by opening an issue</li>
                      <li>Submit pull requests to fix tax rates or add features</li>
                      <li>Add new countries with complete tax configurations</li>
                      <li>Update configs when tax laws change</li>
                      <li>Improve test coverage and validation</li>
                    </ul>
                    <p className="text-xs">
                      Each configuration includes test vectors to ensure accuracy.
                      The CI pipeline automatically validates all configs before
                      deployment.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Country Coverage */}
        <Card>
          <CardHeader>
            <CardTitle>Country Coverage</CardTitle>
            <CardDescription>
              {countries.length} countries currently available for calculation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {countries.map((country) => (
                  <div
                    key={country.code}
                    className="flex items-start justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{country.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {country.years.map((year: string) => (
                          <Badge key={year} variant="outline" className="text-xs">
                            {year}
                          </Badge>
                        ))}
                      </div>
                      {country.variants.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {country.variants.length} variant
                          {country.variants.length !== 1 ? "s" : ""} available
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {countries.length === 0 && (
                <Alert>
                  <AlertDescription>
                    Country information could not be loaded. Please check back later.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contributing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <CardTitle>Contributing</CardTitle>
            </div>
            <CardDescription>
              Help make this calculator better for everyone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              This project is open-source and community-driven. Your contributions
              help make accurate tax information accessible to everyone.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Ways to Contribute
                </h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-6">
                  <li>Add tax configurations for new countries</li>
                  <li>Update existing configs when tax laws change</li>
                  <li>Report calculation errors or bugs</li>
                  <li>Improve documentation and help content</li>
                  <li>Add test vectors to validate accuracy</li>
                  <li>Enhance UI/UX and accessibility</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Getting Started
                </h4>
                <p className="text-muted-foreground mb-2">
                  Visit our GitHub repository for detailed contribution guidelines,
                  setup instructions, and documentation on how to create tax
                  configurations.
                </p>
                <Link
                  href="https://github.com/pascalwhoop/UniversalNetCalc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card>
          <CardHeader>
            <CardTitle>Disclaimer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This calculator provides informational estimates only and does not
              constitute tax, legal, or financial advice. Tax laws are complex,
              vary by jurisdiction, and are subject to change. Individual
              circumstances significantly affect final tax liability. Always
              consult a qualified tax professional or accountant for your specific
              situation before making financial decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
