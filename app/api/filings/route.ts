import { NextResponse } from "next/server"
import { getCIK, getFilings, getTickerFromName } from "@/lib/sec-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")
  const company = searchParams.get("company")
  const types = searchParams.get("types")?.split(",") || ["10-K", "10-Q", "8-K"]

  try {
    let cik: string | null = null

    // If ticker is provided, use it directly
    if (ticker) {
      cik = await getCIK(ticker)
    }
    // Otherwise try to find ticker from company name
    else if (company) {
      const foundTicker = await getTickerFromName(company)
      if (foundTicker) {
        cik = await getCIK(foundTicker)
      }
    }

    if (!cik) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const filings = await getFilings(cik, types)
    return NextResponse.json({ filings })
  } catch (error) {
    console.error("Error fetching SEC filings:", error)
    return NextResponse.json({ error: "Failed to fetch SEC filings" }, { status: 500 })
  }
}
