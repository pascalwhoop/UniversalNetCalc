import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HistoryPage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Calculation History</CardTitle>
          <CardDescription>
            Your saved calculations will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No saved calculations yet. Run a calculation and save it to see it
              here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
