"use client"

import { toast } from "@/components/ui/toast"
// Chat session removed
import type { Message as MessageAISDK } from "ai"
import { createContext, useContext, useEffect, useState } from "react"
 

interface MessagesContextType {
  messages: MessageAISDK[]
  isLoading: boolean
  setMessages: React.Dispatch<React.SetStateAction<MessageAISDK[]>>
  refresh: () => Promise<void>
  saveAllMessages: (messages: MessageAISDK[]) => Promise<void>
  cacheAndAddMessage: (message: MessageAISDK) => Promise<void>
  resetMessages: () => Promise<void>
  deleteMessages: () => Promise<void>
}

const MessagesContext = createContext<MessagesContextType | null>(null)

export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context)
    throw new Error("useMessages must be used within MessagesProvider")
  return context
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<MessageAISDK[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const chatId = null

  useEffect(() => {
    setMessages([])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const refresh = async () => {
    setMessages([])
  }

  const cacheAndAddMessage = async (message: MessageAISDK) => {
    setMessages((prev) => [...prev, message])
  }

  const saveAllMessages = async (newMessages: MessageAISDK[]) => {
    setMessages(newMessages)
  }

  const deleteMessages = async () => {
    setMessages([])
  }

  const resetMessages = async () => {
    setMessages([])
  }

  return (
    <MessagesContext.Provider
      value={{
        messages,
        isLoading,
        setMessages,
        refresh,
        saveAllMessages,
        cacheAndAddMessage,
        resetMessages,
        deleteMessages,
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}
