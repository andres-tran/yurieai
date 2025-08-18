"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, ReactNode, useContext } from "react"
import {
  convertFromApiFormat,
  convertToApiFormat,
  defaultPreferences,
  type UserPreferences,
} from "./utils"

export { type UserPreferences, convertFromApiFormat, convertToApiFormat }

const PREFERENCES_STORAGE_KEY = "user-preferences"

interface UserPreferencesContextType {
  preferences: UserPreferences
  setShowToolInvocations: (enabled: boolean) => void
  setShowConversationPreviews: (enabled: boolean) => void
  toggleModelVisibility: (modelId: string) => void
  isModelHidden: (modelId: string) => boolean
  isLoading: boolean
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined)

// API routes removed; preferences are stored in localStorage only

function getLocalStoragePreferences(): UserPreferences {
  if (typeof window === "undefined") return defaultPreferences

  const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {}
  }
  return defaultPreferences
}

function saveToLocalStorage(preferences: UserPreferences) {
  if (typeof window === "undefined") return

  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
}

export function UserPreferencesProvider({
  children,
  userId,
  initialPreferences,
}: {
  children: ReactNode
  userId?: string
  initialPreferences?: UserPreferences
}) {
  const isAuthenticated = !!userId
  const queryClient = useQueryClient()

  // Merge initial preferences with defaults
  const getInitialData = (): UserPreferences => {
    if (initialPreferences && isAuthenticated) {
      return initialPreferences
    }

    if (!isAuthenticated) {
      return getLocalStoragePreferences()
    }

    return defaultPreferences
  }

  // Query for user preferences
  const { data: preferences = getInitialData(), isLoading } =
    useQuery<UserPreferences>({
      queryKey: ["user-preferences", userId],
      queryFn: async () => {
        return getLocalStoragePreferences()
      },
      enabled: typeof window !== "undefined",
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 0,
      // Use initial data if available to avoid unnecessary API calls
      initialData:
        initialPreferences && isAuthenticated ? getInitialData() : undefined,
    })

  // Mutation for updating preferences
  const mutation = useMutation({
    mutationFn: async (update: Partial<UserPreferences>) => {
      const updated = { ...preferences, ...update }
      saveToLocalStorage(updated)
      return updated
    },
    onMutate: async (update) => {
      const queryKey = ["user-preferences", userId]
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<UserPreferences>(queryKey)
      const optimistic = { ...previous, ...update }
      queryClient.setQueryData(queryKey, optimistic)

      return { previous }
    },
    onError: (_err, _update, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["user-preferences", userId], context.previous)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-preferences", userId], data)
    },
  })

  const updatePreferences = mutation.mutate

  const setShowToolInvocations = (enabled: boolean) => {
    updatePreferences({ showToolInvocations: enabled })
  }

  const setShowConversationPreviews = (enabled: boolean) => {
    updatePreferences({ showConversationPreviews: enabled })
  }

  

  const toggleModelVisibility = (modelId: string) => {
    const currentHidden = preferences.hiddenModels || []
    const isHidden = currentHidden.includes(modelId)
    const newHidden = isHidden
      ? currentHidden.filter((id) => id !== modelId)
      : [...currentHidden, modelId]

    updatePreferences({ hiddenModels: newHidden })
  }

  const isModelHidden = (modelId: string) => {
    return (preferences.hiddenModels || []).includes(modelId)
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        setShowToolInvocations,
        setShowConversationPreviews,
        toggleModelVisibility,
        isModelHidden,
        isLoading,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider"
    )
  }
  return context
}
