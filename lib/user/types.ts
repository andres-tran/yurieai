import type { UserPreferences } from "../user-preference-store/utils"

export type UserProfile = {
  id: string
  email?: string | null
  profile_image: string
  display_name: string
  preferences?: UserPreferences
  system_prompt?: string | null
  favorite_models?: string[]
  created_at?: string
  updated_at?: string
}
