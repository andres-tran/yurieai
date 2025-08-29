"use client"

// Chat session removed
import type { Message } from "@/lib/chat/types"
import { createContext, useContext, useEffect, useState } from "react"
 

interface MessagesContextType {
  messages: Message[]
  isLoading: boolean
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  refresh: () => Promise<void>
  saveAllMessages: (messages: Message[]) => Promise<void>
  cacheAndAddMessage: (message: Message) => Promise<void>
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
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const cacheAndAddMessage = async (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const saveAllMessages = async (newMessages: Message[]) => {
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
