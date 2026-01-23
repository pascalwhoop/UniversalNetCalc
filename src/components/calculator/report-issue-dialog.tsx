"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { CalculationResult, CalcRequest } from "@/lib/api"

interface ReportIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  calculationData: {
    request: CalcRequest
    result: CalculationResult
  }
}

export function ReportIssueDialog({
  open,
  onOpenChange,
  calculationData,
}: ReportIssueDialogProps) {
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please describe the issue")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          email: email.trim() || undefined,
          calculationData,
        }),
      })

      if (!response.ok) {
        const error = (await response.json()) as { error?: string }
        throw new Error(error.error || "Failed to submit issue")
      }

      const data = (await response.json()) as {
        success: boolean
        issueUrl?: string
        issueNumber?: number
      }
      toast.success("Issue reported successfully", {
        description: "Thank you for helping improve the calculator!",
      })

      // Reset and close
      setDescription("")
      setEmail("")
      onOpenChange(false)

      // Show GitHub link if available
      if (data.issueUrl) {
        toast.info("Track your issue on GitHub", {
          action: {
            label: "View Issue",
            onClick: () => window.open(data.issueUrl, "_blank"),
          },
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error("Failed to submit issue", {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenInGitHub = () => {
    const { request, result } = calculationData

    // Build GitHub issue URL with pre-filled data
    const title = encodeURIComponent(
      `Calculation Issue: ${request.country.toUpperCase()} ${request.year}`
    )

    const body = encodeURIComponent(`### Issue Description

${description.trim() || "[Please describe the issue]"}

### Calculation Details

- **Country**: ${request.country.toUpperCase()}
- **Year**: ${request.year}
${request.variant ? `- **Variant**: ${request.variant}` : ""}
- **Gross Annual**: ${result.currency} ${request.gross_annual.toLocaleString()}

**Result**: ${result.currency} ${result.net.toLocaleString()} net (${(result.effective_rate * 100).toFixed(1)}% effective rate)

### Additional Inputs

\`\`\`json
${JSON.stringify(
  Object.fromEntries(
    Object.entries(request).filter(
      ([key]) =>
        !["country", "year", "variant", "gross_annual"].includes(key)
    )
  ),
  null,
  2
)}
\`\`\`

### Full Calculation Context

<details>
<summary>Click to expand</summary>

**Breakdown**:
\`\`\`json
${JSON.stringify(result.breakdown, null, 2)}
\`\`\`

**Config**: ${result.config_version_hash} (updated: ${result.config_last_updated})
</details>

---
*Reported via calculator interface*`)

    const githubUrl = `https://github.com/pascalwhoop/universalNetCalc/issues/new?title=${title}&body=${body}&labels=calculation-issue`

    window.open(githubUrl, "_blank")
    onOpenChange(false)
    setDescription("")
    setEmail("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Calculation Issue</DialogTitle>
          <DialogDescription>
            Help us improve the calculator by reporting issues with calculations or
            incorrect tax rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Privacy Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This issue will be posted publicly on GitHub. Your calculation data will
              be included to help us reproduce the issue. Your email (if provided) will
              NOT be posted publicly.
            </AlertDescription>
          </Alert>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Issue Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what's wrong with the calculation. For example: 'The tax rate seems too high' or 'Missing deduction for health insurance'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Optional Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll use this internally to follow up. It won&apos;t be posted publicly.
            </p>
          </div>

          {/* Calculation Summary */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">Calculation to report:</p>
            <p className="text-muted-foreground text-xs">
              {calculationData.request.country.toUpperCase()}{" "}
              {calculationData.request.year}
              {calculationData.request.variant &&
                ` (${calculationData.request.variant})`}{" "}
              • {calculationData.result.currency}{" "}
              {calculationData.request.gross_annual.toLocaleString()} gross → {calculationData.result.currency}{" "}
              {calculationData.result.net.toLocaleString()} net
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleOpenInGitHub}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in GitHub
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
