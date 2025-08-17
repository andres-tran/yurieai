"use client"

import { useUserPreferences } from "@/lib/user-preference-store/provider"

export function InteractionPreferences() {
  const { preferences } = useUserPreferences()

  return (
    <div className="space-y-6 pb-12">
      {/* Prompt suggestions always enabled */}
      
      
      
    </div>
  )
}
