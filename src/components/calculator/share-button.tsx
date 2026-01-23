"use client"

import { Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ShareButtonProps {
  disabled?: boolean
}

export function ShareButton({ disabled }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      const url = window.location.href

      // Always use clipboard (skip OS share flow)
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied to clipboard", {
        description: "Share this link to let others view your comparison",
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to share:", error)
      toast.error("Failed to copy link")
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={disabled}
            className="md:px-3"
          >
            {copied ? (
              <Check className="h-4 w-4 md:mr-2" />
            ) : (
              <Share2 className="h-4 w-4 md:mr-2" />
            )}
            <span className="hidden md:inline">{copied ? "Copied!" : "Share"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share this comparison via link</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
