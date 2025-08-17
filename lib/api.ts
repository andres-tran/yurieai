import type { UserProfile } from "@/lib/user/types"
import { fetchClient } from "./fetch"
import { API_ROUTE_UPDATE_CHAT_MODEL } from "./routes"

export class UsageLimitError extends Error {}


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
    localStorage.setItem("guest_user_id", guestId)
    return guestId
  } catch (error) {
    console.error("Error ensuring guest user id:", error)
    return null
  }
}
