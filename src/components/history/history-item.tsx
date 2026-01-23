"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SavedCalculation } from "@/lib/types"
import { getCountryName, getCurrencySymbol } from "@/lib/api"
import { getCountryFlag } from "@/lib/country-metadata"
import { Clock, Trash2, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { encodeState } from "@/lib/url-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface HistoryItemProps {
  calculation: SavedCalculation
  onDelete: (id: string) => void
  onRename?: (id: string, newName: string) => void
}

export function HistoryItem({ calculation, onDelete, onRename }: HistoryItemProps) {
  const router = useRouter()

  const handleRestore = () => {
    const encoded = encodeState({
      countries: calculation.countries,
      timestamp: Date.now(),
    })
    router.push(`/?${encoded}`)
  }

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch {
      return "Unknown date"
    }
  }

  // Get net salary preview if available
  const netPreview = calculation.results
    ?.map((r) => {
      const symbol = getCurrencySymbol(r.result.currency)
      return `${symbol}${Math.round(r.result.net).toLocaleString()}`
    })
    .join(" vs ")

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-lg">{calculation.name}</h3>
            {calculation.notes && (
              <p className="text-sm text-muted-foreground mt-1">{calculation.notes}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRestore}
              title="Restore calculation"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Delete calculation">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete calculation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{calculation.name}&quot;. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(calculation.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {calculation.countries.map((country, index) => (
            <Badge key={index} variant="secondary">
              {getCountryFlag(country.country)} {getCountryName(country.country)} {country.year}
            </Badge>
          ))}
        </div>

        {netPreview && (
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Net: {netPreview}
          </div>
        )}

        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {formatDate(calculation.timestamp)}
        </div>

        <div className="mt-3">
          <Button onClick={handleRestore} size="sm" className="w-full">
            Restore Calculation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
