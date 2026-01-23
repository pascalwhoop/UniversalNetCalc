import { NextRequest, NextResponse } from "next/server"
import type { CalcRequest, CalculationResult } from "@/lib/api"

interface IssueRequest {
  description: string
  email?: string
  calculationData: {
    request: CalcRequest
    result: CalculationResult
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: IssueRequest = await request.json()

    // Validate required fields
    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      )
    }

    if (!body.calculationData?.request || !body.calculationData?.result) {
      return NextResponse.json(
        { error: "Calculation data is required" },
        { status: 400 }
      )
    }

    // Check if GitHub token is configured
    const githubToken = process.env.GITHUB_TOKEN

    if (!githubToken) {
      // If no token, return success but indicate no GitHub integration
      console.warn("GITHUB_TOKEN not configured - issue not posted to GitHub")

      // Log issue for manual review
      console.log("=== CALCULATION ISSUE REPORT ===")
      console.log("Description:", body.description)
      if (body.email) {
        console.log("Contact Email:", body.email)
      }
      console.log("Calculation:", JSON.stringify(body.calculationData, null, 2))
      console.log("================================")

      return NextResponse.json({
        success: true,
        message: "Issue received. GitHub integration not configured.",
      })
    }

    // Create GitHub issue
    const { request: calcRequest, result } = body.calculationData

    const issueTitle = `Calculation Issue: ${calcRequest.country.toUpperCase()} ${calcRequest.year}`

    const additionalInputs = Object.fromEntries(
      Object.entries(calcRequest).filter(
        ([key]) => !["country", "year", "variant", "gross_annual"].includes(key)
      )
    )

    const issueBody = `### Issue Description

${body.description}

${body.email ? `**Contact**: ${body.email}\n` : ""}

### Calculation Details

- **Country**: ${calcRequest.country.toUpperCase()}
- **Year**: ${calcRequest.year}
${calcRequest.variant ? `- **Variant**: ${calcRequest.variant}\n` : ""}- **Gross Annual**: ${result.currency} ${calcRequest.gross_annual.toLocaleString()}

**Result**: ${result.currency} ${result.net.toLocaleString()} net (${(result.effective_rate * 100).toFixed(1)}% effective rate)

${Object.keys(additionalInputs).length > 0 ? `### Additional Inputs

\`\`\`json
${JSON.stringify(additionalInputs, null, 2)}
\`\`\`
` : ""}
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
*Reported via calculator interface*`

    // Get GitHub repository from environment or use default
    const githubRepo =
      process.env.GITHUB_REPO || "pascalwhoop/universalNetCalc"

    const githubResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ["calculation-issue", "user-reported"],
        }),
      }
    )

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json()
      console.error("GitHub API error:", errorData)
      throw new Error(
        `GitHub API error: ${githubResponse.status} ${githubResponse.statusText}`
      )
    }

    const issueData = (await githubResponse.json()) as {
      html_url: string
      number: number
    }

    return NextResponse.json({
      success: true,
      issueUrl: issueData.html_url,
      issueNumber: issueData.number,
    })
  } catch (error) {
    console.error("Issue creation error:", error)

    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"

    return NextResponse.json(
      {
        error: "Failed to create issue",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
