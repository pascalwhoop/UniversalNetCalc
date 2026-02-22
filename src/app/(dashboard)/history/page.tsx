"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { HistoryItem } from "@/components/history/history-item"
import { loadHistory, deleteCalculation, clearHistory } from "@/lib/storage"
import { SavedCalculation } from "@/lib/types"
import { Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
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

export default function HistoryPage() {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCalculations, setFilteredCalculations] = useState<SavedCalculation[]>([])

  // Load calculations on mount
  useEffect(() => {
    const loaded = loadHistory()
    setCalculations(loaded)
    setFilteredCalculations(loaded)
  }, [])

  // Filter calculations when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCalculations(calculations)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = calculations.filter(
      (calc) =>
        calc.name.toLowerCase().includes(query) ||
        (calc.notes && calc.notes.toLowerCase().includes(query)) ||
        calc.countries.some((country) =>
          country.country.toLowerCase().includes(query)
        )
    )
    setFilteredCalculations(filtered)
  }, [searchQuery, calculations])

  const handleDelete = (id: string) => {
    deleteCalculation(id)
    const updated = calculations.filter((c) => c.id !== id)
    setCalculations(updated)
    toast.success("Calculation deleted")
  }

  const handleClearAll = () => {
    clearHistory()
    setCalculations([])
    setFilteredCalculations([])
    toast.success("History cleared")
  }

  return (
    <div className="container max-w-6xl py-4 md:py-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Calculation History</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          View and restore your saved salary comparisons
        </p>
      </div>

      {calculations.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search calculations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 md:h-9"
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="default" className="w-full md:w-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {calculations.length} saved calculations. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {filteredCalculations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border border-dashed p-8 md:p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {calculations.length === 0
                  ? "No saved calculations yet. Run a calculation and save it to see it here."
                  : "No calculations match your search."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          {filteredCalculations.map((calculation) => (
            <HistoryItem
              key={calculation.id}
              calculation={calculation}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
