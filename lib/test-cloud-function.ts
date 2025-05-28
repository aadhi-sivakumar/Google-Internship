// lib/test-cloud-function.ts

/**
 * Tests the cloud function connection
 * @returns Promise<boolean> indicating if the cloud function is reachable
 */
export async function testCloudFunctionConnection(): Promise<boolean> {
  const CLOUD_FUNCTION_URL =
    process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL || "https://geminitest-995440237525.us-central1.run.app"

  try {
    console.log(`Testing cloud function connection to: ${CLOUD_FUNCTION_URL}`)

    // Simple health check with minimal payload
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        company: "Test",
        prompts: ["Tell me about Test company"],
        test: true,
      }),
    })

    if (response.ok) {
      console.log("✅ Cloud function is reachable")
      return true
    } else {
      console.warn(`⚠️ Cloud function returned status: ${response.status}`)
      return false
    }
  } catch (error) {
    console.error("❌ Cloud function connection test failed:", error)
    return false
  }
}

/**
 * Gets detailed information about the cloud function environment
 */
export function getCloudFunctionInfo() {
  const url = process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL

  return {
    url,
    isConfigured: !!url,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }
}
