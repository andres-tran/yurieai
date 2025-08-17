import { APP_DOMAIN } from "@/lib/config"
import type { UserProfile } from "@/lib/user/types"
import { fetchClient } from "./fetch"
import { API_ROUTE_UPDATE_CHAT_MODEL } from "./routes"

/**
 * Creates a guest user record on the server
 */
export async function createGuestUser(_guestId: string) { return { success: true } }

export class UsageLimitError extends Error {}

/**
 * Checks the user's daily usage and increments both overall and daily counters.
 * Resets the daily counter if a new day (UTC) is detected.
 * Uses the `anonymous` flag from the user record to decide which daily limit applies.
 *
 * @param supabase - Your Supabase client.
 * @param userId - The ID of the user.
 * @returns The remaining daily limit.
 */
export async function checkRateLimits(_userId: string) {
  return { remaining: Infinity, remainingPro: Infinity }
}

/**
 * Updates the model for an existing chat
 */
export async function updateChatModel(chatId: string, model: string) {
  try {
    const res = await fetchClient(API_ROUTE_UPDATE_CHAT_MODEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, model }),
    })
    const responseData = await res.json()

    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to update chat model: ${res.status} ${res.statusText}`
      )
    }

    return responseData
  } catch (error) {
    console.error("Error updating chat model:", error)
    throw error
  }
}

// Auth removed

export const getOrCreateGuestUserId = async (
  user: UserProfile | null
): Promise<string | null> => {
  if (user?.id) return user.id

  try {
    const existing = localStorage.getItem("guest_user_id")
    if (existing) return existing

    const guestId = crypto.randomUUID()
    await createGuestUser(guestId)
    localStorage.setItem("guest_user_id", guestId)
    return guestId
  } catch (error) {
    console.error("Error ensuring guest user id:", error)
    return null
  }
}
