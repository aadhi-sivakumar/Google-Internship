"use client"

import { CalendarDays, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CompanyNewsProps {
  news: Array<{
    title: string
    source: string
    date: string
    summary: string
    sentiment: "positive" | "negative" | "neutral"
    url: string
    imageUrl?: string | null
  }>
}

export function CompanyNews({ news }: CompanyNewsProps) {
  if (!news || news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-blue-50 p-4 rounded-full mb-4">
          <svg
            className="h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"></path>
            <path d="M16 2v4"></path>
            <path d="M8 2v4"></path>
            <path d="M3 10h18"></path>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No news articles found</h3>
        <p className="text-gray-500">We couldn't find any recent news articles for this company.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {news.map((item, index) => (
        <div
          key={index}
          className="space-y-2 p-4 border rounded-lg last:border-0 transition-all hover:shadow-md hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white"
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-medium text-blue-800">{item.title}</h3>
            <Badge
              className={
                item.sentiment === "positive"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : item.sentiment === "negative"
                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {item.sentiment}
            </Badge>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">{item.source}</span>
            <span className="mx-2">•</span>
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            <span>{item.date}</span>
          </div>

          {item.imageUrl && (
            <div className="mt-2">
              <img
                src={item.imageUrl || "/placeholder.svg"}
                alt={`Image for ${item.title}`}
                className="rounded-md w-full h-40 object-cover"
                onError={(e) => {
                  // Hide the image if it fails to load
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
          )}

          <p className="text-sm text-gray-600 mt-2">{item.summary}</p>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1 transition-colors"
          >
            Read full article
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </a>
        </div>
      ))}
    </div>
  )
}
