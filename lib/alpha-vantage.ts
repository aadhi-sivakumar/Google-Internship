// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = "HVUFV0WVNCWL9G3J."
const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query"

// Cache for API responses
const alphaVantageCache: Record<string, any> = {}
const CACHE_EXPIRY = 60 * 60 * 1000 // 1 hour

// Helper function to check cache
function getCachedData(key: string) {
  const cached = alphaVantageCache[key]
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data
  }
  return null
}

// Helper function to set cache
function setCachedData(key: string, data: any) {
  alphaVantageCache[key] = {
    data,
    timestamp: Date.now(),
  }
}

// Function to get stock symbol for a company name
export async function getStockSymbol(companyName: string): Promise<string | null> {
  // Simple mapping for common companies - in a real app, you'd use a symbol search API
  const symbolMap: Record<string, string> = {
    apple: "AAPL",
    microsoft: "MSFT",
    google: "GOOGL",
    alphabet: "GOOGL",
    amazon: "AMZN",
    tesla: "TSLA",
    meta: "META",
    facebook: "META",
    netflix: "NFLX",
    nvidia: "NVDA",
    intel: "INTC",
    ibm: "IBM",
    oracle: "ORCL",
    salesforce: "CRM",
    adobe: "ADBE",
    paypal: "PYPL",
    uber: "UBER",
    airbnb: "ABNB",
    zoom: "ZM",
    slack: "WORK",
    twitter: "TWTR",
    snapchat: "SNAP",
    pinterest: "PINS",
    spotify: "SPOT",
    shopify: "SHOP",
    square: "SQ",
    robinhood: "HOOD",
    coinbase: "COIN",
    palantir: "PLTR",
    snowflake: "SNOW",
  }

  const normalizedName = companyName.toLowerCase().replace(/[^a-z]/g, "")
  return symbolMap[normalizedName] || null
}

// Function to fetch stock time series data
export async function fetchStockTimeSeries(symbol: string) {
  const cacheKey = `timeseries_${symbol}`
  const cached = getCachedData(cacheKey)
  if (cached) return cached

  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data["Error Message"]) {
      throw new Error(data["Error Message"])
    }

    setCachedData(cacheKey, data)
    return data
  } catch (error) {
    console.error("Error fetching stock time series:", error)
    return null
  }
}

// Function to fetch company overview
export async function fetchCompanyOverview(symbol: string) {
  const cacheKey = `overview_${symbol}`
  const cached = getCachedData(cacheKey)
  if (cached) return cached

  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data["Error Message"]) {
      throw new Error(data["Error Message"])
    }

    setCachedData(cacheKey, data)
    return data
  } catch (error) {
    console.error("Error fetching company overview:", error)
    return null
  }
}

// Function to fetch income statement
export async function fetchIncomeStatement(symbol: string) {
  const cacheKey = `income_${symbol}`
  const cached = getCachedData(cacheKey)
  if (cached) return cached

  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (data["Error Message"]) {
      throw new Error(data["Error Message"])
    }

    setCachedData(cacheKey, data)
    return data
  } catch (error) {
    console.error("Error fetching income statement:", error)
    return null
  }
}

// Function to generate stock performance chart
export function generateStockPerformanceChart(timeSeriesData: any): string | null {
  if (!timeSeriesData || !timeSeriesData["Time Series (Daily)"]) {
    return null
  }

  const timeSeries = timeSeriesData["Time Series (Daily)"]
  const dates = Object.keys(timeSeries).slice(0, 30).reverse() // Last 30 days
  const prices = dates.map((date) => Number.parseFloat(timeSeries[date]["4. close"]))

  const chartConfig = {
    type: "line",
    data: {
      labels: dates.map((date) => new Date(date).toLocaleDateString()),
      datasets: [
        {
          label: "Stock Price",
          data: prices,
          borderColor: "#4285F4",
          backgroundColor: "rgba(66, 133, 244, 0.1)",
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Stock Performance (Last 30 Days)",
        },
      },
      scales: {
        y: {
          beginAtZero: false,
        },
      },
    },
  }

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`
}

// Function to generate revenue breakdown chart
export function generateRevenueBreakdownChart(incomeData: any): string | null {
  if (!incomeData || !incomeData.annualReports || incomeData.annualReports.length === 0) {
    return null
  }

  const latestReport = incomeData.annualReports[0]
  const totalRevenue = Number.parseFloat(latestReport.totalRevenue || "0")
  const costOfRevenue = Number.parseFloat(latestReport.costOfRevenue || "0")
  const grossProfit = totalRevenue - costOfRevenue

  const chartConfig = {
    type: "pie",
    data: {
      labels: ["Cost of Revenue", "Gross Profit"],
      datasets: [
        {
          data: [costOfRevenue, grossProfit],
          backgroundColor: ["#DB4437", "#0F9D58"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Revenue Breakdown",
        },
      },
    },
  }

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`
}

// Function to generate revenue growth chart
export function generateRevenueGrowthChart(incomeData: any): string | null {
  if (!incomeData || !incomeData.annualReports || incomeData.annualReports.length < 2) {
    return null
  }

  const reports = incomeData.annualReports.slice(0, 5).reverse() // Last 5 years
  const years = reports.map((report: any) => report.fiscalDateEnding.split("-")[0])
  const revenues = reports.map((report: any) => Number.parseFloat(report.totalRevenue || "0") / 1000000) // Convert to millions

  const chartConfig = {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        {
          label: "Revenue (Millions)",
          data: revenues,
          backgroundColor: "#4285F4",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Revenue Growth",
        },
      },
    },
  }

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`
}

// Function to generate profit margins chart
export function generateProfitMarginsChart(incomeData: any): string | null {
  if (!incomeData || !incomeData.annualReports || incomeData.annualReports.length < 2) {
    return null
  }

  const reports = incomeData.annualReports.slice(0, 5).reverse() // Last 5 years
  const years = reports.map((report: any) => report.fiscalDateEnding.split("-")[0])
  const grossMargins = reports.map((report: any) => {
    const revenue = Number.parseFloat(report.totalRevenue || "0")
    const cost = Number.parseFloat(report.costOfRevenue || "0")
    return revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0
  })

  const chartConfig = {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Gross Margin (%)",
          data: grossMargins,
          borderColor: "#0F9D58",
          backgroundColor: "rgba(15, 157, 88, 0.1)",
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Profit Margins",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  }

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`
}

// Function to generate expense breakdown chart
export function generateExpenseBreakdownChart(incomeData: any): string | null {
  if (!incomeData || !incomeData.annualReports || incomeData.annualReports.length === 0) {
    return null
  }

  const latestReport = incomeData.annualReports[0]
  const researchDevelopment = Number.parseFloat(latestReport.researchAndDevelopment || "0")
  const sellingGeneral = Number.parseFloat(latestReport.sellingGeneralAndAdministrative || "0")
  const operatingExpenses = Number.parseFloat(latestReport.operatingExpenses || "0")
  const other = Math.max(0, operatingExpenses - researchDevelopment - sellingGeneral)

  const chartConfig = {
    type: "pie",
    data: {
      labels: ["R&D", "SG&A", "Other Operating Expenses"],
      datasets: [
        {
          data: [researchDevelopment, sellingGeneral, other],
          backgroundColor: ["#4285F4", "#DB4437", "#F4B400"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Expense Breakdown",
        },
      },
    },
  }

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`
}
