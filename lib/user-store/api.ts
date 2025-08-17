import { toast } from "@/components/ui/toast"
import type { UserProfile } from "@/lib/user/types"

export async function fetchUserProfile(
  id: string
): Promise<UserProfile | null> {
  return null
}

export async function updateUserProfile(
  id: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  return false
}

export async function signOutUser(): Promise<boolean> {
  toast({ title: "Signed out", status: "info" })
  return true
}

export function subscribeToUserUpdates(
  userId: string,
  onUpdate: (newData: Partial<UserProfile>) => void
) {
  return () => {}
}
