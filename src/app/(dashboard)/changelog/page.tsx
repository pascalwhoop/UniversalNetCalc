import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { changelog } from "@/data/changelog"
import { getCountryFlag } from "@/lib/country-metadata"
import type { ChangelogEntry } from "@/types/changelog"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function VersionCard({ entry, isLatest }: { entry: ChangelogEntry; isLatest: boolean }) {
  return (
    <Card
      className={
        isLatest
          ? "ring-2 ring-primary/30 bg-primary/5"
          : undefined
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={isLatest ? "default" : "secondary"} className="text-sm font-mono">
              v{entry.version}
            </Badge>
            {isLatest && (
              <Badge variant="outline" className="text-xs">
                Latest
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatDate(entry.date)}
          </span>
        </div>

        {entry.highlight && (
          <p className="text-sm text-foreground/80 leading-relaxed pt-1">
            {entry.highlight}
          </p>
        )}
      </CardHeader>

      {(entry.new_countries ||
        entry.new_variants ||
        entry.new_year_data ||
        entry.improvements ||
        entry.fixes) && (
        <CardContent className="space-y-4 pt-0">
          {entry.new_countries && entry.new_countries.length > 0 && (
            <div>
              <CardTitle className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                New Countries
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {entry.new_countries.map((c) => (
                  <Badge key={c.code} variant="outline" className="text-sm gap-1">
                    <span>{getCountryFlag(c.code)}</span>
                    <span>{c.name}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {entry.new_variants && entry.new_variants.length > 0 && (
            <div>
              <CardTitle className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                New Variants
              </CardTitle>
              <ul className="space-y-1">
                {entry.new_variants.map((v, i) => (
                  <li key={i} className="text-sm flex items-center gap-1.5">
                    <span>{getCountryFlag(v.country_code)}</span>
                    <span className="text-foreground/80">
                      {v.country} — {v.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.new_year_data && entry.new_year_data.length > 0 && (
            <div>
              <CardTitle className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Tax Year Data
              </CardTitle>
              <ul className="space-y-1">
                {entry.new_year_data.map((yd) => (
                  <li key={yd.year} className="text-sm">
                    <span className="font-medium">{yd.year}:</span>{" "}
                    <span className="text-foreground/80">
                      {yd.countries
                        .map((c) => `${getCountryFlag(c.code)} ${c.name}`)
                        .join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.improvements && entry.improvements.length > 0 && (
            <div>
              <CardTitle className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Improvements
              </CardTitle>
              <ul className="space-y-1 list-disc list-inside ml-1">
                {entry.improvements.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.fixes && entry.fixes.length > 0 && (
            <div>
              <CardTitle className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Fixes
              </CardTitle>
              <ul className="space-y-1 list-disc list-inside ml-1">
                {entry.fixes.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default function ChangelogPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">What&apos;s New</h1>
          <p className="text-muted-foreground">
            Latest updates to the salary calculator
          </p>
        </div>

        <div className="space-y-4">
          {changelog.versions.map((entry, index) => (
            <VersionCard key={entry.version} entry={entry} isLatest={index === 0} />
          ))}
        </div>
      </div>
    </div>
  )
}
