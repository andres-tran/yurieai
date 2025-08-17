// app/providers/user-provider.tsx
"use client"

import {
  fetchUserProfile,
  signOutUser,
  subscribeToUserUpdates,
  updateUserProfile,
} from "@/lib/user-store/api"
import type { UserProfile } from "@/lib/user/types"
import { createContext, useContext, useEffect, useState } from "react"

type UserContextType = {
  user: UserProfile | null
  isLoading: boolean
  updateUser: (updates: Partial<UserProfile>) => Promise<void>
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: UserProfile | null
}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)

  const refreshUser = async () => {}

  const updateUser = async (updates: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev))
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      const success = await signOutUser()
      if (success) setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Set up realtime subscription for user data changes
  useEffect(() => {}, [user?.id])

  return (
    <UserContext.Provider
      value={{ user, isLoading, updateUser, refreshUser, signOut }}
    >
      {children}
    </UserContext.Provider>
  )
}

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
