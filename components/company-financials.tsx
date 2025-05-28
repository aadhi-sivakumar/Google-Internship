interface CompanyFinancialsProps {
  data: any
  type?: "line" | "bar" | "pie"
  company: string
  chartUrl?: string | null
}

export function CompanyFinancials({ data, type = "line", company, chartUrl }: CompanyFinancialsProps) {
  // If we have a chart URL from Alpha Vantage, use it
  if (chartUrl) {
    return (
      <div className="h-48 w-full">
        <img
          src={chartUrl || "/placeholder.svg"}
          alt={`${company} financial chart`}
          className="w-full h-full object-contain"
          onError={(e) => {
            console.error("Error loading chart:", e)
            // Fallback to placeholder if chart fails to load
            e.currentTarget.src = `/placeholder.svg?height=192&width=400&text=${encodeURIComponent(`${company} Chart`)}`
          }}
        />
      </div>
    )
  }

  // Fallback to existing chart logic if no chartUrl
  return (
    <div>
      {/* Add your default chart rendering logic here if needed */}
      <p>No chart available.</p>
    </div>
  )
}
