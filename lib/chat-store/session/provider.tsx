"use client"

import { createContext, useContext } from "react"

const ChatSessionContext = createContext<{ chatId: string | null }>({
  chatId: null,
})

export const useChatSession = () => useContext(ChatSessionContext)

export function ChatSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ChatSessionContext.Provider value={{ chatId: null }}>
      {children}
    </ChatSessionContext.Provider>
  )
}
