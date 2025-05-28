// lib/gemini.ts
import { prompts } from "./prompts"

// Use the environment variable or fallback to the provided key
const API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyCPTIfFjLPpRetd9p_UZZqIYEBsiC1FVto"
// Update to use the correct model version
const GEMINI_MODEL = "gemini-2.0-flash"
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// Constants for performance optimization
const API_TIMEOUT = 5000 // 5 seconds timeout for API calls
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours cache expiry
const LOCALSTORAGE_PREFIX = "gemini_cache_"

// Cache for storing responses to avoid repeated API calls
const responseCache: Record<string, any> = {}

interface GeminiOptions {
  temperature?: number
  maxOutputTokens?: number
  attemptJsonParse?: boolean
  timeout?: number
  bypassCache?: boolean
}

// Helper function to get cached data from localStorage
function getFromLocalStorage(key: string) {
  try {
    const item = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${key}`)
    if (!item) return null

    const { data, timestamp } = JSON.parse(item)
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(`${LOCALSTORAGE_PREFIX}${key}`)
      return null
    }

    return data
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return null
  }
}

// Helper function to save data to localStorage
function saveToLocalStorage(key: string, data: any) {
  try {
    const item = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(`${LOCALSTORAGE_PREFIX}${key}`, JSON.stringify(item))
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

export async function askGemini(question: string, options: GeminiOptions = {}) {
  try {
    console.log(`Asking Gemini: ${question.substring(0, 50)}...`)
    const response = await fetchFromGemini(question, options)
    return response
  } catch (error) {
    console.error("Error in askGemini:", error)
    return "Sorry, there was an error contacting the AI."
  }
}

export async function fetchCompanyData(company: string, section: keyof typeof prompts) {
  // Skip chart image generation sections
  if (section === "generateChartImage") return null

  // Create cache key
  const cacheKey = `${company.toLowerCase()}_${section}`

  // Check memory cache first (fastest)
  if (responseCache[cacheKey]) {
    console.log(`Using memory cache for ${section}`)
    return responseCache[cacheKey]
  }

  // Then check localStorage cache (still fast)
  const cachedData = getFromLocalStorage(cacheKey)
  if (cachedData) {
    console.log(`Using localStorage cache for ${section}`)
    // Update memory cache
    responseCache[cacheKey] = cachedData
    return cachedData
  }

  // Get the appropriate prompt
  const promptFn = prompts[section]
  if (!promptFn || typeof promptFn !== "function") {
    console.error(`No prompt found for section: ${section}`)
    return getMockDataForSection(section, company)
  }

  const prompt = promptFn(company)

  try {
    // Different options based on section
    const options: GeminiOptions = {
      temperature: 0.2,
      maxOutputTokens: 1024,
      attemptJsonParse: true,
      timeout: API_TIMEOUT,
    }

    console.log(`Fetching ${section} data for ${company}...`)

    // Use Promise.race to implement timeout
    const result = await Promise.race([
      fetchFromGemini(prompt, options),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("API timeout")), options.timeout)),
    ]).catch((error) => {
      console.error(`Timeout or error fetching ${section} data:`, error)
      return null
    })

    if (result) {
      console.log(`Successfully fetched ${section} data for ${company}`)

      // Cache the result in memory
      responseCache[cacheKey] = result

      // Cache in localStorage for persistence
      saveToLocalStorage(cacheKey, result)

      return result
    } else {
      console.warn(`Failed to fetch ${section} data, using mock data`)
      return getMockDataForSection(section, company)
    }
  } catch (error) {
    console.error(`Error fetching data for ${section}:`, error)
    // Return mock data as fallback
    return getMockDataForSection(section, company)
  }
}

export async function getCompanyInfo(company: string) {
  const cacheKey = `${company.toLowerCase()}_companyInfo`

  // Check memory cache first
  if (responseCache[cacheKey]) {
    return responseCache[cacheKey]
  }

  // Then check localStorage cache
  const cachedData = getFromLocalStorage(cacheKey)
  if (cachedData) {
    // Update memory cache
    responseCache[cacheKey] = cachedData
    return cachedData
  }

  try {
    const options: GeminiOptions = {
      temperature: 0.1,
      maxOutputTokens: 1024,
      attemptJsonParse: true,
      timeout: API_TIMEOUT,
    }

    console.log(`Fetching company info for ${company}...`)

    // Use Promise.race to implement timeout
    const result = await Promise.race([
      fetchFromGemini(prompts.companyInfo(company), options),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("API timeout")), options.timeout)),
    ]).catch((error) => {
      console.error(`Timeout or error fetching company info:`, error)
      return null
    })

    if (result) {
      console.log(`Successfully fetched company info for ${company}`)

      // Cache the result
      responseCache[cacheKey] = result
      saveToLocalStorage(cacheKey, result)

      return result
    } else {
      console.warn(`Failed to fetch company info, using mock data`)
      return {
        sector: "Technology",
        employees: 150000,
        founded: "1976",
      }
    }
  } catch (error) {
    console.error(`Error fetching company info:`, error)
    // Return mock data as fallback
    return {
      sector: "Technology",
      employees: 150000,
      founded: "1976",
    }
  }
}

export async function generateChartImage(company: string, chartType: string, data: any = null) {
  const cacheKey = `${company.toLowerCase()}_${chartType}_chart`

  // Check cache first
  if (responseCache[cacheKey]) {
    return responseCache[cacheKey]
  }

  // Check localStorage cache
  const cachedData = getFromLocalStorage(cacheKey)
  if (cachedData) {
    // Update memory cache
    responseCache[cacheKey] = cachedData
    return cachedData
  }

  // For now, return a placeholder image URL since Gemini doesn't directly generate images
  const placeholderUrl = getPlaceholderChartUrl(chartType, company)

  // Cache the result
  responseCache[cacheKey] = placeholderUrl
  saveToLocalStorage(cacheKey, placeholderUrl)

  return placeholderUrl
}

function getPlaceholderChartUrl(chartType: string, company: string) {
  // Generate placeholder chart URLs based on chart type
  const baseUrl = "https://quickchart.io/chart?c="
  let chartConfig = {}

  if (chartType === "stock" || chartType === "line") {
    chartConfig = {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            label: `${company} Stock Price`,
            data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 50),
            borderColor: "#4285F4",
            backgroundColor: "rgba(66, 133, 244, 0.1)",
            fill: true,
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: `${company} Stock Performance`,
        },
      },
    }
  } else if (chartType === "pie") {
    chartConfig = {
      type: "pie",
      data: {
        labels: ["Product A", "Product B", "Product C", "Services", "Other"],
        datasets: [
          {
            data: [35, 25, 20, 15, 5],
            backgroundColor: ["#4285F4", "#DB4437", "#F4B400", "#0F9D58", "#9E9E9E"],
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: `${company} Revenue Breakdown`,
        },
      },
    }
  } else if (chartType === "bar") {
    chartConfig = {
      type: "bar",
      data: {
        labels: ["Q1", "Q2", "Q3", "Q4"],
        datasets: [
          {
            label: `${company} Quarterly Revenue`,
            data: Array.from({ length: 4 }, () => Math.floor(Math.random() * 100) + 50),
            backgroundColor: ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"],
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: `${company} Revenue`,
        },
      },
    }
  }

  return baseUrl + encodeURIComponent(JSON.stringify(chartConfig))
}

// Update the fetchFromGemini function with better error handling and timeouts
async function fetchFromGemini(prompt: string, options: GeminiOptions = {}) {
  const { temperature = 0.2, maxOutputTokens = 1024, attemptJsonParse = false } = options

  // Implement exponential backoff for retries
  let retries = 2 // Reduced retries for faster execution
  let delay = 500 // Start with 500ms delay (faster)

  while (retries >= 0) {
    try {
      console.log(`Calling Gemini API with prompt: ${prompt.substring(0, 50)}...`)

      // Check if API key is available
      if (!API_KEY) {
        throw new Error("Gemini API key is not configured")
      }

      // Use the structure from the provided callGemini function
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
        },
      }

      // Use AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || API_TIMEOUT)

      const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Gemini API error (${response.status}): ${errorText}`)

        // If we're out of retries, throw an error
        if (retries === 0) {
          throw new Error(`Gemini API error (${response.status}): ${errorText}`)
        }

        // Otherwise, continue to retry
        retries--
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
        continue
      }

      const data = await response.json()
      console.log("Gemini API response received successfully")

      // Extract text using the path from the provided function
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ""

      console.log("Raw Gemini response:", JSON.stringify(data, null, 2))

      if (!text) {
        console.error("No text content in Gemini response:", data)
        throw new Error("Empty response from Gemini API")
      }

      // If we expect JSON, try to parse it
      if (attemptJsonParse && text) {
        try {
          // Find JSON in the response (it might be surrounded by markdown code blocks or other text)
          const jsonMatch =
            text.match(/```json\s*([\s\S]*?)\s*```/) ||
            text.match(/```\s*([\s\S]*?)\s*```/) ||
            text.match(/\{[\s\S]*\}/)

          if (jsonMatch) {
            text = jsonMatch[1] || jsonMatch[0]
          }

          // Clean up any markdown or text artifacts
          text = text.replace(/```json/g, "").replace(/```/g, "")

          // Parse the JSON
          return JSON.parse(text)
        } catch (parseError) {
          console.error("Error parsing JSON from Gemini response:", parseError)
          console.log("Raw response:", text)
          // Return the raw text if parsing fails
          return text
        }
      }

      return text
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Gemini API call timed out")
        throw new Error("API request timed out")
      }

      console.error("Error in Gemini API call:", error)
      retries--
      if (retries < 0) {
        console.error("All retries failed for Gemini API call:", error)
        throw error
      }

      console.log(`Retrying Gemini API call in ${delay / 1000}s...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }

  // This should never be reached due to the throw in the catch block
  return null
}

// Fallback mock data for when API calls fail
function getMockDataForSection(section: string, company: string) {
  switch (section) {
    case "stockPerformance":
      return {
        analysis: `${company} stock has shown moderate volatility over the past year with an overall positive trend.`,
        chartDescription: "12-month stock price movement with key events marked",
        keyPoints: [
          "Outperformed sector index by 5.2%",
          "Highest price reached after Q3 earnings",
          "Recovered quickly from market-wide correction in March",
        ],
      }
    case "revenueBreakdown":
      return {
        analysis: `${company}'s revenue is well-diversified across multiple business segments.`,
        segments: [
          { name: "Product A", percentage: 35, trend: "increasing" },
          { name: "Product B", percentage: 25, trend: "stable" },
          { name: "Services", percentage: 20, trend: "increasing" },
          { name: "Digital", percentage: 15, trend: "increasing" },
          { name: "Other", percentage: 5, trend: "decreasing" },
        ],
        keyInsight: "Services and Digital segments show strongest growth potential",
      }
    case "keyMetrics":
      return {
        metrics: [
          { name: "Revenue", value: "$42.5B", change: 12.3 },
          { name: "Net Income", value: "$8.7B", change: 7.8 },
          { name: "EPS", value: "$3.45", change: 9.2 },
          { name: "P/E Ratio", value: "24.3", change: -2.1 },
        ],
        summary: `${company} maintains strong financial health with consistent growth in key metrics.`,
      }
    case "companyInfo":
      return {
        sector: "Technology",
        employees: 150000,
        founded: "1976",
      }
    case "companyOverview":
      return {
        description: `${company} is a leading technology company that specializes in innovative products and services.`,
        keyProducts: ["Flagship Product A", "Enterprise Solution B", "Consumer Service C", "Digital Platform D"],
      }
    case "swotAnalysis":
      return {
        strengths: [
          "Strong brand recognition",
          "Innovative product pipeline",
          "Robust financial position",
          "Global market presence",
        ],
        weaknesses: [
          "High dependency on key markets",
          "Product line concentration risk",
          "Increasing competition in core segments",
          "Regulatory challenges",
        ],
        opportunities: [
          "Expansion into emerging markets",
          "New product categories",
          "Strategic acquisitions",
          "Digital transformation initiatives",
        ],
        threats: [
          "Intense industry competition",
          "Changing consumer preferences",
          "Economic downturns",
          "Supply chain disruptions",
        ],
      }
    case "executives":
      return {
        executives: [
          {
            name: "John Smith",
            position: "Chief Executive Officer",
            background: "25+ years of industry experience, previously CEO at Tech Corp",
            education: "MBA, Harvard Business School",
            achievements: "Led company through 200% growth over 5 years",
          },
          {
            name: "Sarah Johnson",
            position: "Chief Financial Officer",
            background: "Former investment banker with 15 years in finance",
            education: "CFA, MBA from Stanford",
            achievements: "Restructured company finances, improved profit margins by 15%",
          },
          {
            name: "Michael Chen",
            position: "Chief Technology Officer",
            background: "Founded two successful tech startups",
            education: "PhD in Computer Science, MIT",
            achievements: "Led development of company's flagship AI platform",
          },
          {
            name: "Emily Rodriguez",
            position: "Chief Marketing Officer",
            background: "20 years in marketing at Fortune 500 companies",
            education: "MBA, Northwestern University",
            achievements: "Increased brand value by 45% in 3 years",
          },
        ],
      }
    case "sentiment":
      return {
        analystRating: 4.2,
        newsSentiment: 78,
        socialSentiment: 65,
        analysis: `${company} generally enjoys positive sentiment across analyst ratings, news coverage, and social media mentions.`,
      }
    case "keyTopics":
      return {
        topics: [
          { name: "Innovation", weight: 85, color: "#4285F4" },
          { name: "Market Share", weight: 75, color: "#DB4437" },
          { name: "Growth Strategy", weight: 70, color: "#F4B400" },
          { name: "Competition", weight: 65, color: "#0F9D58" },
          { name: "Product Launch", weight: 60, color: "#9E9E9E" },
          { name: "Earnings", weight: 55, color: "#4285F4" },
          { name: "Expansion", weight: 50, color: "#DB4437" },
          { name: "Leadership", weight: 45, color: "#F4B400" },
        ],
      }
    case "structure":
      return {
        boardSize: 12,
        independentDirectors: 9,
        businessUnits: ["Consumer Products", "Enterprise Solutions", "Digital Services", "Research & Development"],
        subsidiaries: [
          `${company} International Holdings`,
          `${company} Technologies Inc.`,
          `${company} Digital Ventures`,
          `${company} Research Labs`,
        ],
      }
    case "geography":
      return {
        headquarters: "San Francisco, California, USA",
        majorLocations: [
          "New York, USA",
          "London, UK",
          "Tokyo, Japan",
          "Singapore",
          "Berlin, Germany",
          "Sydney, Australia",
        ],
        revenueByRegion: {
          "North America": 45,
          Europe: 25,
          "Asia Pacific": 20,
          "Rest of World": 10,
        },
      }
    case "aiSuggestions":
      return [
        `What are ${company}'s main growth drivers?`,
        `How does ${company} compare to its competitors?`,
        `What are ${company}'s biggest challenges?`,
        `What is ${company}'s international expansion strategy?`,
        `How is ${company} addressing sustainability?`,
      ]
    case "financialHighlights":
      return {
        highlights: [
          {
            title: "Record Revenue Growth",
            description: `${company} achieved record revenue growth of 15% year-over-year, exceeding analyst expectations.`,
          },
          {
            title: "Margin Improvement",
            description: "Operating margins improved by 2.5 percentage points due to cost optimization initiatives.",
          },
          {
            title: "Strong Cash Position",
            description: `${company} ended the quarter with $12.5B in cash and cash equivalents, providing flexibility for investments.`,
          },
          {
            title: "Dividend Increase",
            description:
              "The board approved a 10% increase in quarterly dividend, reflecting confidence in future cash flows.",
          },
        ],
      }
    case "revenueGrowth":
      return {
        data: {
          labels: ["Q1", "Q2", "Q3", "Q4"],
          datasets: [
            {
              label: `${company} Revenue (in millions)`,
              data: [
                Math.floor(Math.random() * 500) + 1000,
                Math.floor(Math.random() * 500) + 1100,
                Math.floor(Math.random() * 500) + 1200,
                Math.floor(Math.random() * 500) + 1300,
              ],
              borderColor: "#4285F4",
              backgroundColor: "rgba(66, 133, 244, 0.1)",
            },
          ],
        },
        analysis: `${company} has demonstrated consistent revenue growth over the past four quarters, with particularly strong performance in Q3 and Q4.`,
      }
    case "profitMargins":
      return {
        data: {
          labels: ["2019", "2020", "2021", "2022", "2023"],
          datasets: [
            {
              label: "Gross Margin",
              data: [
                Math.floor(Math.random() * 10) + 60,
                Math.floor(Math.random() * 10) + 61,
                Math.floor(Math.random() * 10) + 62,
                Math.floor(Math.random() * 10) + 63,
                Math.floor(Math.random() * 10) + 64,
              ],
              borderColor: "#4285F4",
              backgroundColor: "rgba(66, 133, 244, 0.1)",
            },
            {
              label: "Operating Margin",
              data: [
                Math.floor(Math.random() * 10) + 25,
                Math.floor(Math.random() * 10) + 26,
                Math.floor(Math.random() * 10) + 27,
                Math.floor(Math.random() * 10) + 28,
                Math.floor(Math.random() * 10) + 29,
              ],
              borderColor: "#0F9D58",
              backgroundColor: "rgba(15, 157, 88, 0.1)",
            },
            {
              label: "Net Margin",
              data: [
                Math.floor(Math.random() * 5) + 15,
                Math.floor(Math.random() * 5) + 16,
                Math.floor(Math.random() * 5) + 17,
                Math.floor(Math.random() * 5) + 18,
                Math.floor(Math.random() * 5) + 19,
              ],
              borderColor: "#DB4437",
              backgroundColor: "rgba(219, 68, 55, 0.1)",
            },
          ],
        },
        analysis: `${company} has successfully improved all key margin metrics over the past five years, with gross margins showing the most significant gains.`,
      }
    case "expenseBreakdown":
      return {
        data: {
          labels: ["R&D", "Sales & Marketing", "G&A", "COGS", "Other"],
          datasets: [
            {
              data: [20, 30, 15, 25, 10],
              backgroundColor: ["#4285F4", "#DB4437", "#F4B400", "#0F9D58", "#9E9E9E"],
            },
          ],
        },
        analysis: `${company}'s expense structure reflects its commitment to innovation, with significant investments in R&D and sales & marketing activities.`,
      }
    case "competitorLandscape":
      return {
        analysis: `${company} operates in a highly competitive market with several major players vying for market share and technological leadership.`,
        mainCompetitors: [
          {
            name: "Competitor A",
            marketShare: "25%",
            strengths: ["Strong brand recognition", "Extensive distribution network"],
            focus: "Premium market segment",
          },
          {
            name: "Competitor B",
            marketShare: "20%",
            strengths: ["Cost leadership", "Operational efficiency"],
            focus: "Mass market penetration",
          },
          {
            name: "Competitor C",
            marketShare: "15%",
            strengths: ["Innovation leadership", "R&D capabilities"],
            focus: "Technology differentiation",
          },
        ],
        competitivePosition: {
          marketPosition: "Market leader",
          keyDifferentiators: ["Superior technology", "Customer service excellence", "Global reach"],
          competitiveAdvantages: ["First-mover advantage", "Scale economies", "Brand loyalty"],
        },
        keyTechnologies: [
          {
            technology: "AI/Machine Learning",
            description: "Advanced algorithms for predictive analytics and automation",
            competitiveImpact: "Enables superior customer insights and operational efficiency",
          },
          {
            technology: "Cloud Infrastructure",
            description: "Scalable cloud-based platform architecture",
            competitiveImpact: "Provides flexibility and cost advantages over legacy systems",
          },
          {
            technology: "Mobile Technology",
            description: "Native mobile applications with advanced features",
            competitiveImpact: "Better user experience and engagement compared to competitors",
          },
        ],
        marketTrends: [
          "Increasing demand for digital solutions",
          "Shift towards subscription-based models",
          "Growing importance of data analytics",
          "Rising customer expectations for personalization",
        ],
        threats: [
          "New entrants with disruptive technologies",
          "Price competition from low-cost providers",
          "Changing regulatory landscape",
        ],
      }
    default:
      return null
  }
}
