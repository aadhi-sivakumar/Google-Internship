// SEC API utility functions

const headers = {
  "User-Agent": "Company Research Tool (example@example.com)",
}

export interface SECFiling {
  type: string
  date: string
  description: string
  summary: string
  url: string
  accessionNumber: string
}

/**
 * Get the CIK (Central Index Key) for a company by ticker
 */
export const getCIK = async (ticker: string): Promise<string | null> => {
  try {
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", { headers })
    const data = await res.json()

    for (const entry of Object.values(data) as any[]) {
      if (entry.ticker.toLowerCase() === ticker.toLowerCase()) {
        return entry.cik_str.toString().padStart(10, "0")
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching CIK:", error)
    return null
  }
}

/**
 * Generate a summary for a filing based on its type and date
 */
const generateFilingSummary = (type: string, date: string): string => {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  switch (type) {
    case "10-K":
      return `Annual report for the fiscal year ending ${formattedDate}. Contains audited financial statements, business overview, risk factors, and management discussion.`
    case "10-Q":
      return `Quarterly report for the period ending ${formattedDate}. Includes unaudited financial statements and operational updates.`
    case "8-K":
      return `Current report filed on ${formattedDate}. Discloses material events or corporate changes that are of importance to shareholders.`
    default:
      return `SEC filing submitted on ${formattedDate}.`
  }
}

/**
 * Get recent filings for a company by CIK (limited to last year)
 */
export const getFilings = async (cik: string, formTypes: string[] = ["10-K", "10-Q", "8-K"]): Promise<SECFiling[]> => {
  try {
    const res = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers })
    const data = await res.json()

    const recent = data.filings.recent
    const filings: SECFiling[] = []

    // Map of form types to descriptions
    const formDescriptions: Record<string, string> = {
      "10-K": "Annual Report",
      "10-Q": "Quarterly Report",
      "8-K": "Current Report",
    }

    // Calculate date one year ago
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    for (let i = 0; i < recent.form.length; i++) {
      if (formTypes.includes(recent.form[i])) {
        const filingDate = new Date(recent.filingDate[i])

        // Skip filings older than one year
        if (filingDate < oneYearAgo) continue

        const accNum = recent.accessionNumber[i].replace(/-/g, "")
        const fileName = recent.primaryDocument[i]
        const url = `https://www.sec.gov/Archives/edgar/data/${Number.parseInt(cik)}/${accNum}/${fileName}`
        const reportDate = recent.reportDate[i] || recent.filingDate[i]
        const summary = generateFilingSummary(recent.form[i], reportDate)

        filings.push({
          type: recent.form[i],
          date: reportDate,
          description: formDescriptions[recent.form[i]] || "SEC Filing",
          summary,
          url,
          accessionNumber: recent.accessionNumber[i],
        })
      }
    }

    return filings
  } catch (error) {
    console.error("Error fetching filings:", error)
    return []
  }
}

/**
 * Get company ticker from name (approximate match)
 */
export const getTickerFromName = async (companyName: string): Promise<string | null> => {
  try {
    const res = await fetch("https://www.sec.gov/files/company_tickers.json", { headers })
    const data = await res.json()

    // Normalize the company name for comparison
    const normalizedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, "")

    // Find the best match
    let bestMatch: { ticker: string; score: number } | null = null

    for (const entry of Object.values(data) as any[]) {
      const entryName = entry.title.toLowerCase().replace(/[^a-z0-9]/g, "")

      // Simple matching algorithm - can be improved
      if (entryName.includes(normalizedName) || normalizedName.includes(entryName)) {
        const score =
          Math.min(entryName.length, normalizedName.length) / Math.max(entryName.length, normalizedName.length)

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { ticker: entry.ticker, score }
        }
      }
    }

    return bestMatch?.ticker || null
  } catch (error) {
    console.error("Error finding ticker:", error)
    return null
  }
}

/**
 * Get recent SEC filings for a company by name
 */
export const getFilingsByCompanyName = async (companyName: string): Promise<SECFiling[]> => {
  // First try to get the ticker
  const ticker = await getTickerFromName(companyName)
  if (!ticker) return []

  // Then get the CIK
  const cik = await getCIK(ticker)
  if (!cik) return []

  // Finally get the filings
  return getFilings(cik)
}
