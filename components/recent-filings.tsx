"use client"

import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RecentFilingsProps {
  filings: Array<{
    type: string
    date: string
    description: string
    summary?: string
    url: string
  }>
  isLoading?: boolean
  onRefresh?: () => void
}

export function RecentFilings({ filings, isLoading = false, onRefresh }: RecentFilingsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (filings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <FileText className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500">No SEC filings found in the last year</p>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="mt-4 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            Refresh Filings
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filings.map((filing, index) => (
          <a
            key={index}
            href={filing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col h-full rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-blue-100 p-2 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{filing.type}</span>
                  <span className="text-xs text-gray-500">{filing.date}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{filing.description}</p>
              </div>
            </div>

            {filing.summary && <div className="mt-3 pt-3 border-t text-sm text-gray-600">{filing.summary}</div>}
          </a>
        ))}
      </div>
    </div>
  )
}
