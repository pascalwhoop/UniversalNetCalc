"use client"

import { InfoIcon, AlertTriangle, XCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Notice } from "@/../../packages/schema/src/config-types"
import { cn } from "@/lib/utils"

interface NoticeTooltipProps {
  notice: Notice
  className?: string
}

export function NoticeTooltip({ notice, className }: NoticeTooltipProps) {
  const getSeverityIcon = (severity?: "info" | "warning" | "error") => {
    switch (severity) {
      case "warning":
        return <AlertTriangle className="h-3.5 w-3.5" />
      case "error":
        return <XCircle className="h-3.5 w-3.5" />
      default:
        return <InfoIcon className="h-3.5 w-3.5" />
    }
  }

  const getSeverityColor = (severity?: "info" | "warning" | "error") => {
    switch (severity) {
      case "warning":
        return "text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400"
      case "error":
        return "text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400"
      default:
        return "text-muted-foreground hover:text-foreground"
    }
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center transition-colors cursor-help",
              getSeverityColor(notice.severity),
              className
            )}
            aria-label={`Information: ${notice.title}`}
          >
            {getSeverityIcon(notice.severity)}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-1">
            <p className="font-semibold text-sm">{notice.title}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {notice.body}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface NoticeIconProps {
  notices: Notice[]
  noticeId: string
  variant?: string
  className?: string
}

export function NoticeIcon({ notices, noticeId, variant, className }: NoticeIconProps) {
  // Find the specific notice by ID
  const notice = notices.find(n => n.id === noticeId)

  if (!notice) {
    return null
  }

  // Check if notice should be shown for current variant
  if (notice.show_for_variants && notice.show_for_variants.length > 0) {
    if (!variant || !notice.show_for_variants.includes(variant)) {
      return null
    }
  }

  return <NoticeTooltip notice={notice} className={className} />
}
