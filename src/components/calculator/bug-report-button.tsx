"use client"

import { Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const GITHUB_REPO = "pascalwhoop/universalNetCalc"

export function BugReportButton() {
  const handleClick = () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const title = encodeURIComponent("Bug report")
    const body = encodeURIComponent(
      `**Page / config**\n${url}\n\n---\nDescribe the issue below.`
    )
    window.open(
      `https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClick}
          >
            <Bug />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Open a GitHub issue</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
