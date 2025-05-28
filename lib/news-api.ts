// NewsAPI integration
export interface NewsArticle {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

export interface NewsApiResponse {
  status: string
  totalResults: number
  articles: NewsArticle[]
}

// Function to fetch company news
export async function fetchCompanyNews(companyName: string): Promise<NewsArticle[]> {
  try {
    console.log(`Fetching news for company: ${companyName}`)

    // Use our server-side API route
    const url = `/api/news?company=${encodeURIComponent(companyName)}`
    console.log(`Calling API route: ${url}`)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`News request failed with status ${response.status}: ${errorText}`)
      throw new Error(`News request failed with status ${response.status}`)
    }

    const data: NewsApiResponse = await response.json()
    console.log(`Received response from API route with ${data.articles?.length || 0} articles`)

    if (data.status !== "ok") {
      console.error(`News API returned status: ${data.status}`)
      throw new Error(`News API returned status: ${data.status}`)
    }

    // Filter articles to only include those with the company name in the title
    const filteredArticles = data.articles.filter((article) =>
      article.title.toLowerCase().includes(companyName.toLowerCase()),
    )

    console.log(`Filtered to ${filteredArticles.length} articles with company name in title`)
    return filteredArticles
  } catch (error) {
    console.error("Error fetching news:", error)
    return []
  }
}

// Function to format the date in a more readable format
export function formatNewsDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Function to create a summary from article content
export function createSummary(article: NewsArticle): string {
  // Use the description if available
  if (article.description) {
    return article.description
  }

  // Otherwise use the first part of the content if available
  if (article.content) {
    // The content field often has a character limit indicator at the end like "[+1234 chars]"
    // Remove this and any truncated sentence
    let content = article.content.replace(/\[\+\d+ chars\]$/, "")

    // Limit to 150 characters and add ellipsis
    if (content.length > 150) {
      content = content.substring(0, 150) + "..."
    }

    return content
  }

  // Fallback
  return "No description available for this article."
}

// Function to determine sentiment based on title and description
export function determineSentiment(title: string, description: string | null): "positive" | "negative" | "neutral" {
  const text = (title + " " + (description || "")).toLowerCase()

  const positiveWords = [
    "gain",
    "rise",
    "up",
    "growth",
    "profit",
    "success",
    "positive",
    "beat",
    "exceed",
    "improve",
    "increase",
    "higher",
    "boost",
    "strong",
    "opportunity",
    "innovation",
  ]

  const negativeWords = [
    "loss",
    "fall",
    "down",
    "decline",
    "drop",
    "fail",
    "negative",
    "miss",
    "below",
    "decrease",
    "lower",
    "weak",
    "struggle",
    "concern",
    "risk",
    "problem",
    "issue",
  ]

  let positiveScore = 0
  let negativeScore = 0

  positiveWords.forEach((word) => {
    if (text.includes(word)) positiveScore++
  })

  negativeWords.forEach((word) => {
    if (text.includes(word)) negativeScore++
  })

  if (positiveScore > negativeScore) return "positive"
  if (negativeScore > positiveScore) return "negative"
  return "neutral"
}

// Convert NewsAPI articles to the format expected by the CompanyNews component
export function convertNewsApiToCompanyNews(articles: NewsArticle[]) {
  return articles.map((article) => ({
    title: article.title,
    source: article.source.name,
    date: formatNewsDate(article.publishedAt),
    summary: createSummary(article),
    sentiment: determineSentiment(article.title, article.description),
    url: article.url,
    imageUrl: article.urlToImage || null,
  }))
}
