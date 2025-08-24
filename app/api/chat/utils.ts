/**
 * Extract a user-friendly error message from various error types
 * Used for streaming errors that need to be forwarded to the client
 * @param error - The error from AI SDK or other sources
 * @returns User-friendly error message string
 */
export function extractErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (error == null) {
    return "An unknown error occurred."
  }

  // Handle string errors
  if (typeof error === "string") {
    return error
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check for specific error patterns
    if (
      error.message.includes("invalid x-api-key") ||
      error.message.includes("authentication_error")
    ) {
      return "Invalid API key or authentication failed. Please check your API key in settings."
    } else if (
      error.message.includes("402") ||
      error.message.includes("payment") ||
      error.message.includes("credits")
    ) {
      return "Insufficient credits or payment required."
    } else if (
      error.message.includes("429")
    ) {
      return "Please try again later."
    }

    return error.message
  }

  // Handle AI SDK error objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aiError = (error as any)?.error
  if (aiError) {
    if (aiError.statusCode === 401) {
      return "Invalid API key or authentication failed. Please check your API key in settings."
    } else if (aiError.statusCode === 402) {
      return "Insufficient credits or payment required."
    } else if (aiError.statusCode === 429) {
      return "Rate limit exceeded. Please try again later."
    } else if (aiError.responseBody) {
      try {
        const parsed = JSON.parse(aiError.responseBody)
        if (parsed.error?.message) {
          return parsed.error.message
        }
      } catch {
        // Fall through to generic message
      }
    }

    return aiError.message || "Request failed"
  }

  return "An error occurred. Please try again."
}

/**
 * Create error response for API endpoints
 * @param error - Error object with optional statusCode and code
 * @returns Response object with proper status and JSON body
 */
export function createErrorResponse(error: {
  code?: string
  message?: string
  statusCode?: number
}): Response {
  // Handle daily limit first (existing logic)
  if (error.code === "DAILY_LIMIT_REACHED") {
    return new Response(
      JSON.stringify({ error: error.message, code: error.code }),
      { status: 403 }
    )
  }

  // Handle stream errors with proper status codes
  if (error.statusCode) {
    return new Response(
      JSON.stringify({
        error: error.message || "Request failed",
        code: error.code || "REQUEST_ERROR",
      }),
      { status: error.statusCode }
    )
  }

  // Fallback for other errors
  return new Response(
    JSON.stringify({ error: error.message || "Internal server error" }),
    { status: 500 }
  )
}

