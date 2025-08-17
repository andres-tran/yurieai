import { defaultPreferences } from "@/lib/user-preference-store/utils"
import type { UserProfile } from "./types"

// Supabase/auth not implemented in this build

export async function getUserProfile(): Promise<UserProfile | null> {
  // Return anonymous profile
  return {
    id: "anonymous",
    email: "",
    display_name: "",
    profile_image: "",
    anonymous: true,
    preferences: defaultPreferences,
  } as UserProfile
}
