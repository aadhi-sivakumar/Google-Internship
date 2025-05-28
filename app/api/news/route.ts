import { NextResponse } from "next/server"

const NEWS_API_KEY = "338b55ef191344e6bb8da9208d6b5b6f"
const NEWS_API_BASE_URL = "https://newsapi.org/v2"

export async function GET(request: Request) {
  console.log("NewsAPI route called")

  const { searchParams } = new URL(request.url)
  const companyName = searchParams.get("company")

  if (!companyName) {
    console.log("No company name provided")
    return NextResponse.json({ error: "Company name is required" }, { status: 400 })
  }

  console.log(`Fetching news for company: ${companyName}`)

  try {
    // Create a simple query that searches for the company name in the title
    // We'll use the 'q' parameter with the company name
    const url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(companyName)}&sortBy=relevancy&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`

    console.log(`Making request to: ${url.replace(NEWS_API_KEY, "API_KEY_HIDDEN")}`)

    // Make the request server-side
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`NewsAPI request failed with status ${response.status}`)
      return NextResponse.json(
        { error: `NewsAPI request failed with status ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log(`Received ${data.articles?.length || 0} articles from NewsAPI`)

    // Return the data from our API route
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching news:", error)
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}
