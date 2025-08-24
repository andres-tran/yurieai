"use client"

import { Header } from "@/components/layout/header"
import { useUserPreferences } from "@/lib/user-preference-store/provider"

export function LayoutApp({ children }: { children: React.ReactNode }) {
  useUserPreferences()

  return (
    <div className="bg-background flex h-dvh w-full overflow-hidden">
      <main className="@container relative h-dvh w-0 flex-shrink flex-grow overflow-y-auto">
        <Header />
        {children}
      </main>
    </div>
  )
}
