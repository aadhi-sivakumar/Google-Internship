// lib/cloud-function.ts
import { prompts } from "./prompts"

// Use the environment variable for the Cloud Function URL
const CLOUD_FUNCTION_URL =
  process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL || "https://geminitest-995440237525.us-central1.run.app"

// Define the response type from the Cloud Function
export interface CloudFunctionResponse {
  results: {
    prompt: string
    response: any
  }[]
  error?: string
}

/**
 * Tests if the cloud function URL is accessible
 */
async function testCloudFunctionAccess(): Promise<{ accessible: boolean; error?: string }> {
  try {
    console.log(`Testing access to: ${CLOUD_FUNCTION_URL}`)

    // Try a simple OPTIONS request first to check CORS
    const optionsResponse = await fetch(CLOUD_FUNCTION_URL, {
      method: "OPTIONS",
      headers: {
        Origin: window.location.origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    })

    console.log(`OPTIONS request status: ${optionsResponse.status}`)

    return { accessible: true }
  } catch (error) {
    console.error("Cloud function access test failed:", error)
    return {
      accessible: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Calls the Cloud Function to analyze a company using Gemini
 * @param companyName The name of the company to analyze
 * @param promptList Optional list of prompts to use (defaults to all prompts)
 * @returns The response from the Cloud Function
 */
export async function callCloudFunction(companyName: string, promptList?: string[]): Promise<CloudFunctionResponse> {
  console.log(`🚀 Starting Cloud Function call for ${companyName}`)
  console.log(`📍 Cloud Function URL: ${CLOUD_FUNCTION_URL}`)
  console.log(`🌐 Current origin: ${window.location.origin}`)

  // First test if the cloud function is accessible
  const accessTest = await testCloudFunctionAccess()
  if (!accessTest.accessible) {
    console.error("❌ Cloud function is not accessible:", accessTest.error)
    return {
      results: [],
      error: `Cloud function not accessible: ${accessTest.error}`,
    }
  }

  const maxRetries = 2 // Reduced retries since the issue is likely CORS
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📞 Calling Cloud Function (attempt ${attempt}/${maxRetries})...`)

      // Get all available prompts from the prompts object, excluding generateChartImage
      const allPromptKeys = Object.keys(prompts).filter((key) => key !== "generateChartImage")

      // Use all prompts if no specific list is provided
      const promptsToUse = promptList || allPromptKeys

      console.log(`📝 Using ${promptsToUse.length} prompts: ${promptsToUse.join(", ")}`)

      // Create an array of prompt strings
      const promptStrings = promptsToUse.map((key) => {
        if (typeof prompts[key as keyof typeof prompts] === "function") {
          const promptFn = prompts[key as keyof typeof prompts] as (company: string) => string
          return promptFn(companyName)
        }
        return `Tell me about ${companyName}`
      })

      // Prepare the payload
      const payload = {
        company: companyName,
        prompts: promptStrings,
        promptTypes: promptsToUse,
        timestamp: new Date().toISOString(),
        origin: window.location.origin,
      }

      console.log(`📦 Payload size: ${JSON.stringify(payload).length} characters`)

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log("⏰ Request timeout - aborting")
        controller.abort()
      }, 120000) // 2 minute timeout for all prompts

      try {
        console.log(`🌐 Making POST request to ${CLOUD_FUNCTION_URL}`)

        // Make the POST request to the Cloud Function
        const response = await fetch(CLOUD_FUNCTION_URL, {
          method: "POST",
          mode: "cors", // Explicitly set CORS mode
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: window.location.origin,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log(`📡 Response status: ${response.status}`)
        console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ HTTP Error ${response.status}:`, errorText)
          throw new Error(`Cloud Function HTTP error (${response.status}): ${errorText}`)
        }

        const data = await response.json()
        console.log(`✅ Received response with ${data.results?.length || 0} results`)

        // Validate response structure
        if (!data.results || !Array.isArray(data.results)) {
          throw new Error("Invalid response structure from Cloud Function")
        }

        return data
      } catch (fetchError) {
        clearTimeout(timeoutId)

        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            throw new Error("Request timeout - Cloud Function took too long to respond")
          }
          if (fetchError.message.includes("Failed to fetch")) {
            throw new Error(
              "Network error - Unable to reach Cloud Function. This may be due to CORS policy or network connectivity issues.",
            )
          }
        }

        throw fetchError
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`❌ Attempt ${attempt} failed:`, lastError.message)

      // If this is the last attempt, don't wait
      if (attempt === maxRetries) {
        break
      }

      // Wait before retrying
      const waitTime = 2000 // 2 seconds
      console.log(`⏳ Waiting ${waitTime}ms before retry...`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  console.error("💥 All Cloud Function call attempts failed:", lastError?.message)

  // Provide more specific error messages
  let errorMessage = lastError?.message || "Unknown error"
  if (errorMessage.includes("Failed to fetch")) {
    errorMessage =
      "Unable to connect to Cloud Function. This may be due to CORS configuration or network issues. Using fallback data instead."
  }

  return {
    results: [],
    error: errorMessage,
  }
}

/**
 * Processes the Cloud Function response and stores results in localStorage
 * @param companyName The company name
 * @param response The response from the Cloud Function
 */
export function processCloudFunctionResponse(companyName: string, response: CloudFunctionResponse): void {
  if (!response.results || response.results.length === 0) {
    console.warn("⚠️ No results received from Cloud Function")
    return
  }

  console.log(`🔄 Processing ${response.results.length} results from Cloud Function`)

  response.results.forEach((result, index) => {
    try {
      const promptText = result.prompt || ""
      const promptType = determinePromptType(promptText, index)

      if (!promptType) {
        console.warn(`⚠️ Could not determine prompt type for result ${index}`)
        console.log(`📝 Prompt text was: "${promptText}"`)
        return
      }

      const key = `${companyName.toLowerCase()}_${promptType}`
      let parsedResponse = result.response

      // Only attempt to parse if it's a string
      if (typeof parsedResponse === "string") {
        try {
          const jsonMatch =
            parsedResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
            parsedResponse.match(/```\s*([\s\S]*?)\s*```/) ||
            parsedResponse.match(/\{[\s\S]*\}/)

          if (jsonMatch) {
            const jsonText = jsonMatch[1] || jsonMatch[0]
            const cleanedText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim()
            parsedResponse = JSON.parse(cleanedText)
            console.log(`✅ Successfully parsed JSON for ${promptType}`)
          } else {
            console.log(`📄 No JSON found in string for ${promptType}, storing raw text`)
          }
        } catch (parseError) {
          console.warn(`⚠️ Could not parse JSON string for ${promptType}:`, parseError)
        }
      } else if (typeof parsedResponse === "object") {
        console.log(`📦 Response already parsed as object for ${promptType}`)
      } else {
        console.warn(`⚠️ Unexpected response type (${typeof parsedResponse}) for ${promptType}`)
      }

      // Store in localStorage
      localStorage.setItem(key, JSON.stringify(parsedResponse))
      localStorage.setItem(`${key}_timestamp`, Date.now().toString())

      console.log(`💾 Stored ${promptType} data for ${companyName}`)
      console.log(`🔍 Data preview:`, JSON.stringify(parsedResponse).substring(0, 200) + "...")
    } catch (error) {
      console.error(`❌ Error processing result ${index}:`, error)
    }
  })

  // Set cloud function status flags
  localStorage.setItem(`${companyName.toLowerCase()}_cloud_function_complete`, "true")
  localStorage.setItem(`${companyName.toLowerCase()}_cloud_function_timestamp`, Date.now().toString())

  console.log(`✅ Cloud Function processing complete for ${companyName}`)
}


/**
 * Attempts to determine the prompt type from the prompt text
 * @param promptText The prompt text
 * @param index The index of the result (fallback)
 * @returns The prompt type key or null if not found
 */
function determinePromptType(promptText: string, index?: number): string | null {
  console.log(`🔍 Determining prompt type for: "${promptText.substring(0, 100)}..."`)

  // Map of keywords to prompt types - updated with more specific keywords
  const keywordMap: Record<string, string> = {
    competitor: "competitorLandscape",
    competitive: "competitorLandscape",
    "market position": "competitorLandscape",
    "revenue breakdown": "revenueBreakdown",
    "revenue segments": "revenueBreakdown",
    "business segments": "revenueBreakdown",
    "stock performance": "stockPerformance",
    "key metrics": "keyMetrics",
    "company overview": "companyOverview",
    "SWOT analysis": "swotAnalysis",
    sentiment: "sentiment",
    "key topics": "keyTopics",
    executives: "executives",
    structure: "structure",
    geography: "geography",
    "financial highlights": "financialHighlights",
    "revenue growth": "revenueGrowth",
    "profit margins": "profitMargins",
    "expense breakdown": "expenseBreakdown",
  }

  // Check if the prompt contains any of the keywords
  const lowerPrompt = promptText.toLowerCase()
  for (const [keyword, promptType] of Object.entries(keywordMap)) {
    if (lowerPrompt.includes(keyword.toLowerCase())) {
      console.log(`✅ Matched keyword "${keyword}" to prompt type "${promptType}"`)
      return promptType
    }
  }

  // Fallback: try to match based on common patterns
  if (lowerPrompt.includes("compete") || lowerPrompt.includes("rival") || lowerPrompt.includes("market share")) {
    console.log(`✅ Fallback match to competitorLandscape`)
    return "competitorLandscape"
  }

  if (
    lowerPrompt.includes("revenue") &&
    (lowerPrompt.includes("segment") || lowerPrompt.includes("breakdown") || lowerPrompt.includes("division"))
  ) {
    console.log(`✅ Fallback match to revenueBreakdown`)
    return "revenueBreakdown"
  }

  console.warn(`⚠️ Could not determine prompt type for: "${promptText.substring(0, 50)}..."`)
  return null
}

// Add a new function to get all prompt types
export function getAllPromptTypes(): string[] {
  return Object.keys(prompts).filter((key) => key !== "generateChartImage")
}

// Add a function to check cloud function status
export function getCloudFunctionStatus() {
  return {
    url: CLOUD_FUNCTION_URL,
    configured: !!process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL,
    environment: process.env.NODE_ENV,
  }
}
