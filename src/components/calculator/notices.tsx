"use client"

import { InfoIcon, AlertTriangle, XCircle } from "lucide-react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import type { Notice } from "@/../../packages/schema/src/config-types"
import { cn } from "@/lib/utils"

function getSeverityIcon(severity?: "info" | "warning" | "error", className = "h-3.5 w-3.5 shrink-0") {
  switch (severity) {
    case "warning":
      return <AlertTriangle className={className} />
    case "error":
      return <XCircle className={className} />
    default:
      return <InfoIcon className={className} />
  }
}

export function getSeverityColor(severity?: "info" | "warning" | "error") {
  switch (severity) {
    case "warning":
      return "text-yellow-600 dark:text-yellow-500"
    case "error":
      return "text-red-600 dark:text-red-500"
    default:
      return "text-muted-foreground"
  }
}

export { getSeverityIcon }

interface NoticeTooltipProps {
  notice: Notice
  className?: string
}

export function NoticeTooltip({ notice, className }: NoticeTooltipProps) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center transition-colors cursor-help",
            getSeverityColor(notice.severity),
            "hover:opacity-80",
            className
          )}
          aria-label={`Information: ${notice.title}`}
        >
          {getSeverityIcon(notice.severity)}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="max-w-sm">
        <div className="space-y-1">
          <p className="font-semibold text-sm">{notice.title}</p>
          <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
            {notice.body}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
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

export function filterNoticesForVariant(notices: Notice[], variant?: string): Notice[] {
  return notices.filter(n => {
    if (n.show_for_variants && n.show_for_variants.length > 0) {
      return !!variant && n.show_for_variants.includes(variant)
    }
    return true
  })
}

interface NoticeRowProps {
  notice: Notice
  className?: string
}

export function NoticeRow({ notice, className }: NoticeRowProps) {
  return (
    <div className={cn("flex gap-2 text-sm", className)}>
      <span className={cn("mt-0.5 shrink-0", getSeverityColor(notice.severity))}>
        {getSeverityIcon(notice.severity)}
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium text-foreground">{notice.title}</p>
        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
          {notice.body}
        </p>
      </div>
    </div>
  )
}
