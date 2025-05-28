"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Building, Calendar, FileBarChart, Search, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CompanyFinancials } from "@/components/company-financials"
import { CompanyNews } from "@/components/company-news"
import { CompanyOverview } from "@/components/company-overview"
import { CompanyExecutives } from "@/components/company-executives"
import { RecentFilings } from "@/components/recent-filings"
import { mockCompanyData } from "@/lib/mock-data"
import { fetchCompanyData, getCompanyInfo } from "@/lib/gemini"
import { askGemini } from "@/lib/gemini"
// Add the import for the news API
import { type NewsArticle, convertNewsApiToCompanyNews, fetchCompanyNews } from "@/lib/news-api"
// Add the import for the SEC API
import type { SECFiling } from "@/lib/sec-api"
// Add the import for the Alpha Vantage API
import {
  fetchStockTimeSeries,
  fetchCompanyOverview,
  fetchIncomeStatement,
  generateStockPerformanceChart,
  generateRevenueBreakdownChart,
  generateRevenueGrowthChart,
  generateProfitMarginsChart,
  generateExpenseBreakdownChart,
  getStockSymbol,
} from "@/lib/alpha-vantage"

// Define priority sections that should be loaded first
const PRIORITY_SECTIONS = ["companyOverview", "keyMetrics", "stockPerformance", "revenueBreakdown"]

// Define secondary sections that can be loaded after priority sections
const SECONDARY_SECTIONS = [
  "swotAnalysis",
  "sentiment",
  "keyTopics",
  "executives",
  "structure",
  "geography",
  "aiSuggestions",
  "financialHighlights",
  "revenueGrowth",
  "profitMargins",
  "expenseBreakdown",
]

// Define competitor sections that should be loaded separately
const COMPETITOR_SECTIONS = ["competitorLandscape"]

export default function Dashboard({ params }: { params: { company: string } }) {
  const [companyData, setCompanyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aiQuestion, setAiQuestion] = useState("")
  const [animateIn, setAnimateIn] = useState(false)
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [isAsking, setIsAsking] = useState(false)
  const [sectionData, setSectionData] = useState<Record<string, any>>({})
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({})
  // Add a new state for news articles
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [isLoadingNews, setIsLoadingNews] = useState(true)
  // Add state for company info
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  // Add state for SEC filings
  const [secFilings, setSecFilings] = useState<SECFiling[]>([])
  const [isLoadingFilings, setIsLoadingFilings] = useState(true)
  // Add state to track API errors
  const [apiErrors, setApiErrors] = useState<Record<string, boolean>>({})
  // Add state to track initialization
  const [initialized, setInitialized] = useState(false)
  // Add state for Alpha Vantage data
  const [stockSymbol, setStockSymbol] = useState<string | null>(null)
  const [stockData, setStockData] = useState<any>(null)
  const [companyOverviewData, setCompanyOverviewData] = useState<any>(null)
  const [incomeStatementData, setIncomeStatementData] = useState<any>(null)
  const [chartUrls, setChartUrls] = useState<Record<string, string | null>>({
    stockPerformance: null,
    revenueBreakdown: null,
    revenueGrowth: null,
    profitMargins: null,
    expenseBreakdown: null,
  })
  // Add this new state near the other state declarations
  const [cloudFunctionStatus, setCloudFunctionStatus] = useState<"loading" | "complete" | "error" | "none">("none")

  // Format the company name (title case with acronyms preserved)
  const formatCompanyName = (name: string) => {
    if (!name) return name

    // Split the name into words
    return name
      .split(/\s+/)
      .map((word) => {
        // Check if the word is an acronym (all uppercase)
        if (word.toUpperCase() === word && word.length > 1) {
          return word.toUpperCase()
        }
        // Otherwise capitalize first letter, lowercase the rest
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(" ")
  }

  const companyName = formatCompanyName(decodeURIComponent(params.company))

  // Add debugging function to inspect localStorage
  const debugLocalStorage = useCallback(() => {
    console.log("🔍 DEBUG: Inspecting localStorage for", companyName)
    const keys = Object.keys(localStorage).filter((key) => key.includes(companyName.toLowerCase()))
    console.log("📦 Found keys:", keys)

    keys.forEach((key) => {
      const data = localStorage.getItem(key)
      console.log(`🔑 ${key}:`, data ? data.substring(0, 200) + "..." : "null")
    })

    // Specifically check for competitor and revenue data
    const competitorKey = `${companyName.toLowerCase()}_competitorLandscape`
    const revenueKey = `${companyName.toLowerCase()}_revenueBreakdown`

    console.log("🏢 Competitor data:", localStorage.getItem(competitorKey) ? "EXISTS" : "MISSING")
    console.log("💰 Revenue data:", localStorage.getItem(revenueKey) ? "EXISTS" : "MISSING")
  }, [companyName])

  // Improved fetchSectionData function with better error handling and logging
  const fetchSectionData = useCallback(
    async (section: string) => {
      setSectionLoading((prev) => ({ ...prev, [section]: true }))

      try {
        console.log(`🔍 Attempting to fetch ${section} data for ${companyName}...`)

        // First, check if we have data in localStorage from the Cloud Function
        const localStorageKey = `${companyName.toLowerCase()}_${section}`
        const cachedData = localStorage.getItem(localStorageKey)
        const cachedTimestamp = localStorage.getItem(`${localStorageKey}_timestamp`)

        console.log(`🔍 Checking localStorage for key: ${localStorageKey}`)
        console.log(`📦 Cached data exists: ${!!cachedData}`)
        console.log(`⏰ Cached timestamp: ${cachedTimestamp}`)

        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            console.log(`✅ Using Cloud Function data from localStorage for ${section}`)
            console.log(`📊 Data preview:`, JSON.stringify(parsedData).substring(0, 200) + "...")

            setSectionData((prev) => ({ ...prev, [section]: parsedData }))
            setApiErrors((prev) => ({ ...prev, [section]: false }))
            setSectionLoading((prev) => ({ ...prev, [section]: false }))
            return
          } catch (parseError) {
            console.error(`❌ Error parsing localStorage data for ${section}:`, parseError)
            console.log(`🔍 Raw cached data:`, cachedData.substring(0, 200) + "...")
            // Continue with regular fetch if parsing fails
          }
        } else {
          console.log(`📭 No cached data found for ${section}`)
        }

        // If no localStorage data, fetch from the Gemini API with a timeout
        console.log(`🌐 Fetching ${section} from Gemini API...`)
        const fetchPromise = fetchCompanyData(companyName, section as any)

        // Set a timeout for the fetch operation
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 10000) // 10 second timeout
        })

        // Race between the fetch and the timeout
        const data = await Promise.race([fetchPromise, timeoutPromise])

        if (data) {
          console.log(`✅ Successfully fetched ${section} data from Gemini`)
          setSectionData((prev) => ({ ...prev, [section]: data }))
          setApiErrors((prev) => ({ ...prev, [section]: false }))
        } else {
          console.warn(`⚠️ No data returned for ${section}`)
          setApiErrors((prev) => ({ ...prev, [section]: true }))
        }
      } catch (error) {
        console.error(`❌ Error fetching ${section} data:`, error)
        setApiErrors((prev) => ({ ...prev, [section]: true }))
      } finally {
        setSectionLoading((prev) => ({ ...prev, [section]: false }))
      }
    },
    [companyName],
  )

  // Special function to fetch competitor data using cloud function
  const fetchCompetitorData = useCallback(async () => {
    setSectionLoading((prev) => ({ ...prev, competitorLandscape: true }))

    try {
      console.log(`🏢 Fetching competitor landscape data for ${companyName}...`)

      // Check if we have cached data first
      const localStorageKey = `${companyName.toLowerCase()}_competitorLandscape`
      const cachedData = localStorage.getItem(localStorageKey)
      const cachedTimestamp = localStorage.getItem(`${localStorageKey}_timestamp`)

      console.log(`🔍 Checking localStorage for competitor data: ${localStorageKey}`)
      console.log(`📦 Cached data exists: ${!!cachedData}`)
      console.log(`⏰ Cached timestamp: ${cachedTimestamp}`)

      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData)
          console.log(`✅ Using cached competitor data for ${companyName}`)
          console.log(`📊 Competitor data preview:`, JSON.stringify(parsedData).substring(0, 300) + "...")

          setSectionData((prev) => ({ ...prev, competitorLandscape: parsedData }))
          setApiErrors((prev) => ({ ...prev, competitorLandscape: false }))
          setSectionLoading((prev) => ({ ...prev, competitorLandscape: false }))
          return
        } catch (parseError) {
          console.error(`❌ Error parsing cached competitor data:`, parseError)
          console.log(`🔍 Raw cached data:`, cachedData.substring(0, 200) + "...")
        }
      } else {
        console.log(`📭 No cached competitor data found`)
      }

      // Import cloud function utilities
      const { callCloudFunction, processCloudFunctionResponse } = await import("@/lib/cloud-function")

      // Call cloud function specifically for competitor landscape
      console.log(`☁️ Calling cloud function for competitor analysis...`)
      const response = await callCloudFunction(companyName, ["competitorLandscape"])

      if (response.error) {
        console.error("❌ Error from Cloud Function:", response.error)
        setApiErrors((prev) => ({ ...prev, competitorLandscape: true }))
      } else if (response.results && response.results.length > 0) {
        console.log(`✅ Received ${response.results.length} results from cloud function`)

        // Process and store the results
        processCloudFunctionResponse(companyName, response)

        // Wait a moment for localStorage to be updated, then get the processed data
        setTimeout(() => {
          const newCachedData = localStorage.getItem(localStorageKey)
          if (newCachedData) {
            try {
              const parsedData = JSON.parse(newCachedData)
              console.log(`✅ Successfully loaded processed competitor data`)
              setSectionData((prev) => ({ ...prev, competitorLandscape: parsedData }))
              setApiErrors((prev) => ({ ...prev, competitorLandscape: false }))
            } catch (parseError) {
              console.error(`❌ Error parsing processed competitor data:`, parseError)
              setApiErrors((prev) => ({ ...prev, competitorLandscape: true }))
            }
          } else {
            console.warn(`⚠️ No processed competitor data found in localStorage`)
            setApiErrors((prev) => ({ ...prev, competitorLandscape: true }))
          }
        }, 100)
      } else {
        console.warn(`⚠️ No competitor data received from cloud function`)
        setApiErrors((prev) => ({ ...prev, competitorLandscape: true }))
      }
    } catch (error) {
      console.error(`❌ Error fetching competitor data:`, error)
      setApiErrors((prev) => ({ ...prev, competitorLandscape: true }))
    } finally {
      setSectionLoading((prev) => ({ ...prev, competitorLandscape: false }))
    }
  }, [companyName])

  // Add this function after the other helper functions
  const checkCloudFunctionStatus = useCallback(() => {
    const completionFlag = localStorage.getItem(`${companyName.toLowerCase()}_cloud_function_complete`)
    const timestamp = localStorage.getItem(`${companyName.toLowerCase()}_cloud_function_timestamp`)

    if (completionFlag === "true") {
      setCloudFunctionStatus("complete")
      console.log("✅ Cloud function data is available")
    } else {
      // Check if we have any cloud function data at all
      const hasAnyCloudData = [...PRIORITY_SECTIONS, ...SECONDARY_SECTIONS].some((section) => {
        return localStorage.getItem(`${companyName.toLowerCase()}_${section}`)
      })

      if (hasAnyCloudData) {
        setCloudFunctionStatus("complete")
      } else {
        setCloudFunctionStatus("none")
      }
    }
  }, [companyName])

  // Function to fetch company info
  const loadCompanyInfo = useCallback(async () => {
    try {
      console.log(`Fetching company info for ${companyName}...`)

      // Set a timeout for the fetch operation
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 5000) // 5 second timeout
      })

      // Race between the fetch and the timeout
      const info = await Promise.race([getCompanyInfo(companyName), timeoutPromise])

      if (info) {
        console.log(`Successfully fetched company info:`, info)
        setCompanyInfo(info)

        // Update the company data with the new info
        setCompanyData((prevData: any) => ({
          ...prevData,
          sector: info.sector || prevData.sector,
          employees: info.employees || prevData.employees,
          founded: info.founded || prevData.founded,
        }))
      } else {
        console.warn(`No company info returned, using mock data`)
      }
    } catch (error) {
      console.error("Error loading company info:", error)
    }
  }, [companyName])

  // Function to fetch news directly
  const loadNewsData = useCallback(async () => {
    setIsLoadingNews(true)
    try {
      console.log(`Fetching news for company: ${companyName}`)

      // Try to load from localStorage first
      const savedNewsData = localStorage.getItem(`${companyName.toLowerCase()}_news`)
      if (savedNewsData) {
        const parsedNewsData = JSON.parse(savedNewsData) as NewsArticle[]
        console.log(`Loaded ${parsedNewsData.length} news articles from localStorage`)
        setNewsArticles(parsedNewsData)
        setIsLoadingNews(false)
        return
      }

      // If not in localStorage, fetch from API
      console.log("No news in localStorage, fetching from API")

      // Set a timeout for the fetch operation
      const timeoutPromise = new Promise<NewsArticle[]>((resolve) => {
        setTimeout(() => resolve([]), 5000) // 5 second timeout
      })

      // Race between the fetch and the timeout
      const newsData = await Promise.race([fetchCompanyNews(companyName), timeoutPromise])

      console.log(`Fetched ${newsData.length} news articles from API`)
      setNewsArticles(newsData)

      // Store in localStorage for future use
      if (newsData.length > 0) {
        localStorage.setItem(`${companyName.toLowerCase()}_news`, JSON.stringify(newsData))
      }
    } catch (error) {
      console.error("Error loading news data:", error)
    } finally {
      setIsLoadingNews(false)
    }
  }, [companyName])

  // Function to fetch SEC filings
  const loadSecFilings = useCallback(async () => {
    setIsLoadingFilings(true)
    try {
      console.log(`Fetching SEC filings for company: ${companyName}`)

      // Try to load from localStorage first to avoid rate limits
      const savedFilingsData = localStorage.getItem(`${companyName.toLowerCase()}_filings`)
      const savedFilingsTimestamp = localStorage.getItem(`${companyName.toLowerCase()}_filings_timestamp`)
      const oneHourAgo = Date.now() - 60 * 60 * 1000

      // Use cached data if it exists and is less than an hour old
      if (savedFilingsData && savedFilingsTimestamp && Number.parseInt(savedFilingsTimestamp) > oneHourAgo) {
        const parsedFilingsData = JSON.parse(savedFilingsData) as SECFiling[]
        console.log(`Loaded ${parsedFilingsData.length} SEC filings from localStorage`)
        setSecFilings(parsedFilingsData)
        setIsLoadingFilings(false)
        return
      }

      // If not in localStorage or too old, fetch from API
      console.log("No recent filings in localStorage, fetching from API")

      // Set a timeout for the fetch operation
      const timeoutPromise = new Promise<{ filings: SECFiling[] }>((resolve) => {
        setTimeout(() => resolve({ filings: [] }), 5000) // 5 second timeout
      })

      // Race between the fetch and the timeout
      const responsePromise = fetch(`/api/filings?company=${encodeURIComponent(companyName)}`).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch SEC filings: ${response.statusText}`)
        }
        return response.json()
      })

      const data = await Promise.race([responsePromise, timeoutPromise])

      console.log(`Fetched ${data.filings.length} SEC filings from API`)
      setSecFilings(data.filings)

      // Store in localStorage for future use
      if (data.filings.length > 0) {
        localStorage.setItem(`${companyName.toLowerCase()}_filings`, JSON.stringify(data.filings))
        localStorage.setItem(`${companyName.toLowerCase()}_filings_timestamp`, Date.now().toString())
      }
    } catch (error) {
      console.error("Error loading SEC filings:", error)
    } finally {
      setIsLoadingFilings(false)
    }
  }, [companyName])

  // Function to fetch data in parallel for faster loading
  const fetchDataInParallel = useCallback(
    async (sections: string[]) => {
      // Initialize loading states for all sections
      const initialLoadingState: Record<string, boolean> = {}
      sections.forEach((section) => {
        initialLoadingState[section] = true
      })
      setSectionLoading((prev) => ({ ...prev, ...initialLoadingState }))

      // Fetch all sections in parallel
      await Promise.all(
        sections.map((section) =>
          fetchSectionData(section).catch((error) => {
            console.error(`Error fetching ${section}:`, error)
            // Ensure loading state is set to false even if there's an error
            setSectionLoading((prev) => ({ ...prev, [section]: false }))
          }),
        ),
      )
    },
    [fetchSectionData],
  )

  // Add a function to load Alpha Vantage data
  const loadAlphaVantageData = useCallback(async () => {
    try {
      // First, get the stock symbol for the company
      const symbol = await getStockSymbol(companyName)
      if (!symbol) {
        console.warn(`Could not find stock symbol for ${companyName}`)
        return
      }

      setStockSymbol(symbol)

      // Fetch data in parallel
      const [timeSeriesData, overviewData, incomeData] = await Promise.all([
        fetchStockTimeSeries(symbol),
        fetchCompanyOverview(symbol),
        fetchIncomeStatement(symbol),
      ])

      setStockData(timeSeriesData)
      setCompanyOverviewData(overviewData)
      setIncomeStatementData(incomeData)

      // Generate chart URLs
      const urls = {
        stockPerformance: generateStockPerformanceChart(timeSeriesData),
        revenueBreakdown: generateRevenueBreakdownChart(incomeData),
        revenueGrowth: generateRevenueGrowthChart(incomeData),
        profitMargins: generateProfitMarginsChart(incomeData),
        expenseBreakdown: generateExpenseBreakdownChart(incomeData),
      }

      setChartUrls(urls)

      // Update company data with real information if available
      if (overviewData) {
        setCompanyData((prevData) => ({
          ...prevData,
          sector: overviewData.Sector || prevData.sector,
          employees: Number.parseInt(overviewData.FullTimeEmployees) || prevData.employees,
          founded: overviewData.IPODate?.split("-")[0] || prevData.founded,
          ticker: symbol,
        }))
      }
    } catch (error) {
      console.error("Error loading Alpha Vantage data:", error)
    }
  }, [companyName])

  // Update the useEffect to load data in stages for better performance
  useEffect(() => {
    const initializeDashboard = async () => {
      if (initialized) return
      setInitialized(true)

      // Check cloud function status
      checkCloudFunctionStatus()

      // Start with mock data for the basic structure
      const mockData = mockCompanyData(companyName)
      setCompanyData(mockData)

      // Start loading company info, news, and SEC filings in parallel
      const basicDataPromises = [loadCompanyInfo(), loadNewsData(), loadSecFilings(), loadAlphaVantageData()]

      // Start loading priority sections in parallel
      fetchDataInParallel(PRIORITY_SECTIONS)

      // Wait for basic data to load
      await Promise.all(basicDataPromises)

      // Show the dashboard after priority sections are loaded
      setLoading(false)

      // Add a slight delay before triggering animations
      setTimeout(() => setAnimateIn(true), 100)

      // Load secondary sections after the dashboard is visible
      fetchDataInParallel(SECONDARY_SECTIONS)

      // Load competitor data separately using cloud function
      fetchCompetitorData()
    }

    initializeDashboard()
  }, [
    companyName,
    fetchDataInParallel,
    initialized,
    loadCompanyInfo,
    loadNewsData,
    loadSecFilings,
    loadAlphaVantageData,
    checkCloudFunctionStatus,
    fetchCompetitorData,
    debugLocalStorage,
  ])

  // Call this function when the component mounts
  useEffect(() => {
    debugLocalStorage()
  }, [debugLocalStorage])

  // Function to ask AI a question with improved error handling
  const handleAskAI = useCallback(async () => {
  if (!aiQuestion.trim()) return

  setIsAsking(true)
  setAiAnswer(null)

  try {
    const questionToSend = aiQuestion.toLowerCase().includes(companyName.toLowerCase())
      ? aiQuestion
      : `About ${companyName}: ${aiQuestion}`

    const cloudFunctionUrl = "https://us-central1-sprinternship-dal-2025.cloudfunctions.net/agentspace-ui-backend-2"

    const payload = {
      queryText: questionToSend,
      sessionId: undefined,
      newSession: false,
    }

    console.log("📡 Sending AI question to cloud function:", payload)

    const timeoutPromise = new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("API timeout")), 30000),
    )

    const responsePromise = fetch(cloudFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const response = await Promise.race([responsePromise, timeoutPromise])

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Cloud function error (${response.status}):`, errorText)
      throw new Error(`Cloud function failed: ${errorText}`)
    }

    const data = await response.json()
    console.log("✅ AI response from cloud function:", data)

    let answer = "I'm sorry, I couldn't find a specific answer to your question."

    if (data.response?.text) {
      answer = data.response.text
    } else if (data.answer?.answerText) {
      answer = data.answer.answerText
    } else if (data.reply?.reply) {
      answer = data.reply.reply
    } else if (typeof data === "string") {
      answer = data
    }

    setAiAnswer(answer)
  } catch (err) {
    console.error("❌ Error contacting cloud function:", err)

    let errorMessage = "Sorry, there was an error contacting the AI."

    if (err instanceof Error) {
      if (err.message.includes("timeout")) {
        errorMessage = "The request timed out. Please try again with a shorter question."
      } else if (err.message.includes("Failed to fetch")) {
        errorMessage = "There was a network issue. Please check your connection and try again."
      }
    }

    setAiAnswer(errorMessage)
  } finally {
    setIsAsking(false)
  }
}, [aiQuestion, companyName])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-white shadow-lg shadow-blue-100/50 transition-all">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FileBarChart className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <p className="text-xl font-medium bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Analyzing {companyName}...
          </p>
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-gray-500">Fetching financial data, news, and reports</p>
            <div className="w-full max-w-xs h-2 mt-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-[progress_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50/30 to-white">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-md shadow-sm">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline-block">Back to Search</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search company data..."
                className="w-64 pl-8 md:w-80 border-blue-100 focus-visible:ring-blue-500/20 transition-all"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
            >
              Export
            </Button>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 shadow-sm hover:shadow transition-all">
              Save Report
            </Button>
          </div>
        </div>
      </header>

      <main
        className={`flex-1 p-4 md:p-6 space-y-6 transition-opacity duration-500 ease-in-out ${animateIn ? "opacity-100" : "opacity-0"}`}
      >
        {cloudFunctionStatus === "none" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-700">
              <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Using Fallback Data</span>
              <span className="text-xs text-yellow-600">Cloud function data not available</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 bg-clip-text text-transparent">
              {companyName}
            </h1>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
              {companyData.ticker}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3 mt-1">
            <div className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100">
              <Building className="mr-1 h-3.5 w-3.5" />
              {companyData.sector}
            </div>
            <div className="inline-flex items-center rounded-md border border-green-100 bg-green-50 px-2.5 py-0.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100">
              <Users className="mr-1 h-3.5 w-3.5" />
              {companyData.employees.toLocaleString()} Employees
            </div>
            <div className="inline-flex items-center rounded-md border border-yellow-100 bg-yellow-50 px-2.5 py-0.5 text-sm font-medium text-yellow-700 transition-colors hover:bg-yellow-100">
              <Calendar className="mr-1 h-3.5 w-3.5" />
              Founded {companyData.founded}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in animation-delay-100">
          <Card className="overflow-hidden border-blue-100 shadow-sm hover:shadow transition-all group">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white">
              <CardTitle className="text-white">Stock Performance</CardTitle>
              <CardDescription className="text-blue-100">Last 12 months</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 group-hover:translate-y-0 transition-transform">
              {sectionLoading.stockPerformance ? (
                <div className="flex items-center justify-center h-48">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : (
                <CompanyFinancials
                  data={{ ...companyData.stockPerformance, isStock: true, ...sectionData.stockPerformance }}
                  company={companyName}
                  chartUrl={chartUrls.stockPerformance}
                />
              )}
              {sectionData.stockPerformance && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>{sectionData.stockPerformance.analysis}</p>
                  <ul className="mt-2 space-y-1">
                    {sectionData.stockPerformance.keyPoints?.map((point: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-red-100 shadow-sm hover:shadow transition-all group">
            <CardHeader className="pb-2 bg-gradient-to-r from-red-500 to-red-400 text-white">
              <CardTitle className="text-white">Revenue Breakdown</CardTitle>
              <CardDescription className="text-red-100">By business segment</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {sectionLoading.revenueBreakdown ? (
                <div className="flex items-center justify-center h-48">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                </div>
              ) : (
                <CompanyFinancials
                  data={sectionData.revenueBreakdown || companyData.revenueBreakdown}
                  type="pie"
                  company={companyName}
                  chartUrl={chartUrls.revenueBreakdown}
                />
              )}
              {(sectionData.revenueBreakdown?.summary || companyData.revenueBreakdown?.summary) && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-700 mb-2">Revenue Summary</h4>
                  <p className="text-sm text-blue-600">
                    {sectionData.revenueBreakdown?.summary || companyData.revenueBreakdown?.summary}
                  </p>
                </div>
              )}
              <div className="mt-3 space-y-2">
                {(sectionData.revenueBreakdown?.segments || companyData.revenueBreakdown?.segments || []).map(
                  (segment: any, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <span>{segment.name}</span>
                      <span
                        className={`font-medium ${
                          segment.trend === "increasing"
                            ? "text-green-600"
                            : segment.trend === "decreasing"
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {segment.percentage}%{segment.trend === "increasing" && " ↑"}
                        {segment.trend === "decreasing" && " ↓"}
                      </span>
                    </div>
                  ),
                )}
              </div>
              {(sectionData.revenueBreakdown?.keyInsight || companyData.revenueBreakdown?.keyInsight) && (
                <p className="mt-3 font-medium text-blue-700">
                  {sectionData.revenueBreakdown?.keyInsight || companyData.revenueBreakdown?.keyInsight}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-green-100 shadow-sm hover:shadow transition-all group">
            <CardHeader className="pb-2 bg-gradient-to-r from-green-500 to-green-400 text-white">
              <CardTitle className="text-white">Key Metrics</CardTitle>
              <CardDescription className="text-green-100">Financial highlights</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {sectionLoading.keyMetrics ? (
                <div className="flex items-center justify-center h-48">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {(sectionData.keyMetrics?.metrics || companyData.keyMetrics).map((metric: any, index: number) => (
                    <div
                      key={index}
                      className="space-y-1 bg-white p-3 rounded-lg border border-gray-100 transition-transform hover:scale-[1.02]"
                    >
                      <p className="text-sm text-gray-500">{metric.name}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <div
                        className={`text-xs flex items-center gap-1 ${
                          metric.change > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {metric.change > 0 ? "+" : ""}
                        {metric.change}%
                        <ArrowUpRight className={`h-3 w-3 ${metric.change < 0 ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {sectionData.keyMetrics?.summary && (
                <p className="mt-4 text-sm text-gray-600">{sectionData.keyMetrics.summary}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="animate-fade-in animation-delay-200">
          <TabsList className="grid w-full grid-cols-5 md:w-auto md:grid-cols-none md:flex bg-blue-50 p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              Company Overview
            </TabsTrigger>
            <TabsTrigger
              value="competitors"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              Competitor Landscape
            </TabsTrigger>
            <TabsTrigger
              value="financials"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              Financial Reports
            </TabsTrigger>
            <TabsTrigger
              value="news"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              News & Analysis
            </TabsTrigger>
            <TabsTrigger
              value="organization"
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
            >
              Organization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
                <CardHeader>
                  <CardTitle className="text-blue-700">Company Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {sectionLoading.companyOverview ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <>
                      {console.log("CompanyOverview data:", sectionData.companyOverview || companyData.overview)}
                      <CompanyOverview data={sectionData.companyOverview || companyData.overview || {}} />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
                <CardHeader>
                  <CardTitle className="text-blue-700">SWOT Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {sectionLoading.swotAnalysis ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 bg-blue-50 p-3 rounded-lg">
                        <h3 className="font-medium text-blue-700 flex items-center gap-1">
                          <span className="bg-blue-600 text-white p-1 rounded-full text-xs">S</span>
                          Strengths
                        </h3>
                        <ul className="space-y-1 text-sm">
                          {(sectionData.swotAnalysis?.strengths || companyData.swot.strengths).map(
                            (item: string, i: number) => (
                              <li key={i} className="list-disc ml-4">
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div className="space-y-2 bg-red-50 p-3 rounded-lg">
                        <h3 className="font-medium text-red-700 flex items-center gap-1">
                          <span className="bg-red-600 text-white p-1 rounded-full text-xs">W</span>
                          Weaknesses
                        </h3>
                        <ul className="space-y-1 text-sm">
                          {(sectionData.swotAnalysis?.weaknesses || companyData.swot.weaknesses).map(
                            (item: string, i: number) => (
                              <li key={i} className="list-disc ml-4">
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div className="space-y-2 bg-green-50 p-3 rounded-lg">
                        <h3 className="font-medium text-green-700 flex items-center gap-1">
                          <span className="bg-green-600 text-white p-1 rounded-full text-xs">O</span>
                          Opportunities
                        </h3>
                        <ul className="space-y-1 text-sm">
                          {(sectionData.swotAnalysis?.opportunities || companyData.swot.opportunities).map(
                            (item: string, i: number) => (
                              <li key={i} className="list-disc ml-4">
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div className="space-y-2 bg-yellow-50 p-3 rounded-lg">
                        <h3 className="font-medium text-yellow-700 flex items-center gap-1">
                          <span className="bg-yellow-600 text-white p-1 rounded-full text-xs">T</span>
                          Threats
                        </h3>
                        <ul className="space-y-1 text-sm">
                          {(sectionData.swotAnalysis?.threats || companyData.swot.threats).map(
                            (item: string, i: number) => (
                              <li key={i} className="list-disc ml-4">
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-blue-700">Recent SEC Filings</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSecFilings}
                  disabled={isLoadingFilings}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  {isLoadingFilings ? (
                    <>
                      <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Loading...
                    </>
                  ) : (
                    "Refresh Filings"
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <RecentFilings
                  filings={
                    secFilings.length > 0 ? secFilings : sectionData.recentFilings?.filings || companyData.recentFilings
                  }
                  isLoading={isLoadingFilings}
                  onRefresh={loadSecFilings}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitors" className="space-y-6 pt-4">
            {sectionLoading.competitorLandscape ? (
              <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-blue-600 font-medium">Analyzing competitive landscape...</p>
                  <p className="text-sm text-gray-500">This may take a moment as we gather comprehensive market data</p>
                </div>
              </div>
            ) : apiErrors.competitorLandscape ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center max-w-md">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Competitor Data</h3>
                    <p className="text-red-600 mb-4">
                      We're having trouble fetching the latest competitive intelligence. This could be due to API
                      limitations or connectivity issues.
                    </p>
                    <Button onClick={fetchCompetitorData} className="bg-red-600 hover:bg-red-700 text-white">
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            ) : sectionData.competitorLandscape ? (
              <div className="space-y-6">
                {/* Header with Analysis Overview */}
                <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="text-purple-700 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Market Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-purple-800 font-medium">{sectionData.competitorLandscape.analysis}</p>
                  </CardContent>
                </Card>

                {/* Main Competitors Grid */}
                <Card className="border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-blue-700">Key Competitors</CardTitle>
                    <CardDescription>Main players in {companyName}'s market space</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {sectionData.competitorLandscape.mainCompetitors?.map((competitor: any, index: number) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-gray-900 text-lg">{competitor.name}</h4>
                            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                              {competitor.marketShare}
                            </span>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Focus Area:</p>
                            <p className="text-sm text-gray-600">{competitor.focus}</p>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Key Strengths:</p>
                            <div className="flex flex-wrap gap-1">
                              {competitor.strengths?.map((strength: string, i: number) => (
                                <span
                                  key={i}
                                  className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Competitive Position */}
                <Card className="border-green-100">
                  <CardHeader>
                    <CardTitle className="text-green-700">{companyName}'s Competitive Position</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-3">Market Position</h4>
                        <p className="text-2xl font-bold text-green-700 mb-2">
                          {sectionData.competitorLandscape.competitivePosition?.marketPosition}
                        </p>

                        <div className="mt-4">
                          <h5 className="font-medium text-green-800 mb-2">Key Differentiators:</h5>
                          <div className="flex flex-wrap gap-2">
                            {sectionData.competitorLandscape.competitivePosition?.keyDifferentiators?.map(
                              (diff: string, i: number) => (
                                <span
                                  key={i}
                                  className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full font-medium"
                                >
                                  {diff}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-3">Competitive Advantages</h4>
                        <ul className="space-y-2">
                          {sectionData.competitorLandscape.competitivePosition?.competitiveAdvantages?.map(
                            (advantage: string, i: number) => (
                              <li key={i} className="flex items-start text-sm">
                                <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                <span className="text-blue-800 font-medium">{advantage}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technology & Innovation */}
                <Card className="border-indigo-100">
                  <CardHeader>
                    <CardTitle className="text-indigo-700">Key Technologies & Innovation</CardTitle>
                    <CardDescription>Technologies driving competitive advantage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sectionData.competitorLandscape.keyTechnologies?.map((tech: any, index: number) => (
                        <div
                          key={index}
                          className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50 to-white p-4 rounded-r-lg"
                        >
                          <h4 className="font-bold text-indigo-900 mb-2 text-lg">{tech.technology}</h4>
                          <p className="text-indigo-700 mb-3">{tech.description}</p>
                          <div className="bg-indigo-100 rounded-lg p-3">
                            <p className="text-sm font-medium text-indigo-800">
                              <span className="font-bold">Competitive Impact:</span> {tech.competitiveImpact}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Market Trends & Threats */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-emerald-100">
                    <CardHeader>
                      <CardTitle className="text-emerald-700">Market Trends</CardTitle>
                      <CardDescription>Opportunities shaping the industry</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {sectionData.competitorLandscape.marketTrends?.map((trend: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-3 mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
                            <span className="text-emerald-800 font-medium">{trend}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-red-100">
                    <CardHeader>
                      <CardTitle className="text-red-700">Competitive Threats</CardTitle>
                      <CardDescription>Challenges to monitor closely</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {sectionData.competitorLandscape.threats?.map((threat: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-3 mt-1 h-2 w-2 rounded-full bg-red-500"></span>
                            <span className="text-red-800 font-medium">{threat}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">No competitor data available</p>
                  <Button onClick={fetchCompetitorData} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Load Competitor Analysis
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="financials" className="space-y-6 pt-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="overflow-hidden border-blue-100 shadow-sm hover:shadow transition-all">
                <CardHeader className="pb-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white">
                  <CardTitle className="text-white">Revenue Growth</CardTitle>
                  <CardDescription className="text-blue-100">Quarterly (in millions)</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {sectionLoading.revenueGrowth ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <>
                      <CompanyFinancials
                        data={sectionData.revenueGrowth || companyData.revenueGrowth}
                        company={companyName}
                        chartUrl={chartUrls.revenueGrowth}
                      />
                      {sectionData.revenueGrowth?.analysis && (
                        <p className="mt-4 text-sm text-gray-600">{sectionData.revenueGrowth.analysis}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-green-100 shadow-sm hover:shadow transition-all">
                <CardHeader className="pb-2 bg-gradient-to-r from-green-500 to-green-400 text-white">
                  <CardTitle className="text-white">Profit Margins</CardTitle>
                  <CardDescription className="text-green-100">Last 5 years</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {sectionLoading.profitMargins ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <>
                      <CompanyFinancials
                        data={sectionData.profitMargins || companyData.profitMargins}
                        company={companyName}
                        chartUrl={chartUrls.profitMargins}
                      />
                      {sectionData.profitMargins?.analysis && (
                        <p className="mt-4 text-sm text-gray-600">{sectionData.profitMargins.analysis}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-red-100 shadow-sm hover:shadow transition-all">
                <CardHeader className="pb-2 bg-gradient-to-r from-red-500 to-red-400 text-white">
                  <CardTitle className="text-white">Expense Breakdown</CardTitle>
                  <CardDescription className="text-red-100">Current fiscal year</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {sectionLoading.expenseBreakdown ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <>
                      <CompanyFinancials
                        data={sectionData.expenseBreakdown || companyData.expenseBreakdown}
                        type="pie"
                        company={companyName}
                        chartUrl={chartUrls.expenseBreakdown}
                      />
                      {sectionData.expenseBreakdown?.analysis && (
                        <p className="mt-4 text-sm text-gray-600">{sectionData.expenseBreakdown.analysis}</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
              <CardHeader>
                <CardTitle className="text-blue-700">Financial Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                {sectionLoading.financialHighlights ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(sectionData.financialHighlights?.highlights || companyData.financialHighlights).map(
                      (highlight: any, index: number) => (
                        <div
                          key={index}
                          className="space-y-2 bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100 transition-transform hover:scale-[1.01]"
                        >
                          <h3 className="font-medium text-blue-700">{highlight.title}</h3>
                          <p className="text-sm text-gray-600">{highlight.description}</p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news" className="space-y-6 pt-4">
            <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-blue-700">Recent News & Analysis</CardTitle>
                  <CardDescription>News articles about {companyName}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadNewsData}
                  disabled={isLoadingNews}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  {isLoadingNews ? (
                    <>
                      <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Refreshing...
                    </>
                  ) : (
                    "Refresh News"
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingNews ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <CompanyNews
                    news={
                      newsArticles.length > 0
                        ? convertNewsApiToCompanyNews(newsArticles)
                        : sectionData.news?.news || companyData.news
                    }
                  />
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
                <CardHeader>
                  <CardTitle className="text-blue-700">Market Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  {sectionLoading.sentiment ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                        <span className="text-sm font-medium">Analyst Ratings</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">
                            {sectionData.sentiment?.analystRating || companyData.sentiment.analystRating}/5
                          </span>
                          <div className="flex">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-2 w-8 first:rounded-l-full last:rounded-r-full transition-colors ${
                                    i <
                                    Math.floor(
                                      sectionData.sentiment?.analystRating || companyData.sentiment.analystRating,
                                    )
                                      ? "bg-blue-500"
                                      : "bg-gray-200"
                                  }`}
                                />
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                        <span className="text-sm font-medium">News Sentiment</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">
                            {sectionData.sentiment?.newsSentiment || companyData.sentiment.newsSentiment}%
                          </span>
                          <div className="h-2 w-40 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-green-500 transition-all duration-1000"
                              style={{
                                width: `${sectionData.sentiment?.newsSentiment || companyData.sentiment.newsSentiment}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                        <span className="text-sm font-medium">Social Media Sentiment</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">
                            {sectionData.sentiment?.socialSentiment || companyData.sentiment.socialSentiment}%
                          </span>
                          <div className="h-2 w-40 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all duration-1000"
                              style={{
                                width: `${sectionData.sentiment?.socialSentiment || companyData.sentiment.socialSentiment}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
                <CardHeader>
                  <CardTitle className="text-blue-700">Key Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  {sectionLoading.keyTopics ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(sectionData.keyTopics?.topics || companyData.keyTopics).map((topic: any, index: number) => {
                        // Assign colors based on index if not provided
                        const colors = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58", "#9E9E9E"]
                        const color = topic.color || colors[index % colors.length]

                        return (
                          <div
                            key={index}
                            className="rounded-full px-3 py-1 text-sm font-medium transition-all hover:scale-110 cursor-pointer"
                            style={{
                              backgroundColor: color + "20",
                              color: color,
                              fontSize: `${Math.max(0.75, Math.min(1.25, 0.75 + (topic.weight || 50) / 100))}rem`,
                              boxShadow: `0 0 0 1px ${color}30`,
                            }}
                          >
                            {topic.name}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="organization" className="space-y-6 pt-4">
            <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
              <CardHeader>
                <CardTitle className="text-blue-700">Key Executives</CardTitle>
              </CardHeader>
              <CardContent>
                {sectionLoading.executives ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <CompanyExecutives executives={sectionData.executives?.executives || companyData.executives} />
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
                <CardHeader>
                  <CardTitle className="text-blue-700">Company Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  {sectionLoading.structure ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 transition-transform hover:scale-[1.01]">
                        <h3 className="font-medium text-blue-700">Board of Directors</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {sectionData.structure?.boardSize || companyData.structure.boardSize} members,{" "}
                          {sectionData.structure?.independentDirectors || companyData.structure.independentDirectors}{" "}
                          independent
                        </p>
                      </div>

                      <div className="rounded-lg border border-green-100 bg-green-50 p-4 transition-transform hover:scale-[1.01]">
                        <h3 className="font-medium text-green-700">Business Units</h3>
                        <ul className="mt-2 space-y-1 text-sm">
                          {(sectionData.structure?.businessUnits || companyData.structure.businessUnits).map(
                            (unit: string, i: number) => (
                              <li key={i} className="list-disc ml-4">
                                {unit}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4 transition-transform hover:scale-[1.01]">
                        <h3 className="font-medium text-yellow-700">Subsidiaries</h3>
                        <ul className="mt-2 space-y-1 text-sm">
                          {(sectionData.structure?.subsidiaries || companyData.structure.subsidiaries).map(
                            (sub: string, i: number) => (
                              <li key={i} className="list-disc ml-4">
                                {sub}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-blue-100 shadow-sm hover:shadow transition-all">
                <CardHeader>
                  <CardTitle className="text-blue-700">Geographic Presence</CardTitle>
                </CardHeader>
                <CardContent>
                  {sectionLoading.geography ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-medium text-blue-700">Headquarters</h3>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <span className="inline-block w-4 h-4 rounded-full bg-blue-500"></span>
                          {sectionData.geography?.headquarters || companyData.geography.headquarters}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium text-blue-700">Major Locations</h3>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          {(sectionData.geography?.majorLocations || companyData.geography.majorLocations).map(
                            (location: string, i: number) => (
                              <div
                                key={i}
                                className="rounded-md bg-gradient-to-r from-blue-100 to-white px-3 py-2 border border-blue-200 transition-transform hover:scale-[1.02]"
                              >
                                {location}
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-blue-700">Revenue by Region</h3>
                        <div className="mt-3 space-y-3">
                          {Object.entries(
                            sectionData.geography?.revenueByRegion || companyData.geography.revenueByRegion,
                          ).map(([region, percentage]: [string, any]) => (
                            <div key={region} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{region}</span>
                                <span className="font-medium">{percentage}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className="h-2 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor:
                                      region === "North America"
                                        ? "#4285F4"
                                        : region === "Europe"
                                          ? "#DB4437"
                                          : region === "Asia Pacific"
                                            ? "#F4B400"
                                            : "#0F9D58",
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Card className="border-blue-100 shadow-sm hover:shadow transition-all overflow-hidden animate-fade-in animation-delay-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 rounded-full blur-2xl"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Ask AI Assistant
            </CardTitle>
            <CardDescription>
              Ask specific questions about {companyName}'s financials, strategy, or market position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder={`E.g., What are ${companyName}'s main growth drivers?`}
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="flex-1 border-blue-100 focus-visible:ring-blue-500/20"
                />
                <Button
                  className="bg-blue-500 hover:bg-blue-600 shadow-sm hover:shadow transition-all"
                  onClick={handleAskAI}
                  disabled={isAsking || !aiQuestion.trim()}
                >
                  {isAsking ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ask
                    </>
                  )}
                </Button>
              </div>

              {isAsking && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  <p className="text-sm">AI is analyzing your question...</p>
                </div>
              )}

              {aiAnswer && (
                <div className="mt-2 p-4 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
                  <p className="text-sm text-blue-700 whitespace-pre-line">{aiAnswer}</p>
                </div>
              )}

              {(sectionData.aiSuggestions || companyData.aiSuggestions) && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {(sectionData.aiSuggestions || companyData.aiSuggestions).map((suggestion: string, i: number) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => setAiQuestion(suggestion)}
                        className="text-xs bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
