"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { useQuery } from "@tanstack/react-query"

type DeveloperTool = {
  id: string
  name: string
  icon: string
  description: string
  envKeys: string[]
  connected: boolean
  maskedKey: string | null
  sampleEnv: string
}

type DeveloperToolsResponse = {
  tools: DeveloperTool[]
}

export function DeveloperTools() {
  const { data, isLoading } = useQuery<DeveloperToolsResponse>({
    queryKey: ["developer-tools"],
    queryFn: async () => {
      const res = await fetch("/api/developer-tools")
      if (!res.ok) throw new Error("Failed to fetch tools")
      return res.json()
    },
  })

  const tools = data?.tools ?? []

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        status: "success",
      })
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast({
        title: "Failed to copy to clipboard",
        status: "error",
      })
    }
  }

  if (isLoading) return null

  return null
}
