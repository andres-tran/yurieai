import type { Message } from "@/lib/chat/types"
import { readFromIndexedDB, writeToIndexedDB } from "./persist"
import type { Chats } from "./types"

// Messages
type ChatMessageEntry = { id: string; messages: Message[] }

export async function getMessages(chatId: string): Promise<Message[]> {
  const entry = await readFromIndexedDB<ChatMessageEntry>("messages", chatId)
  if (!entry || Array.isArray(entry)) return []
  return (entry.messages || []).sort(
    (a, b) => +(a.createdAt || 0) - +(b.createdAt || 0)
  )
}

export async function setMessages(
  chatId: string,
  messages: Message[]
): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages })
}

export async function addMessage(
  chatId: string,
  message: Message
): Promise<void> {
  const current = await getMessages(chatId)
  const updated = [...current, message]
  await writeToIndexedDB("messages", { id: chatId, messages: updated })
}

export async function clearMessages(chatId: string): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages: [] })
}

// Chats
export async function getChats(): Promise<Chats[]> {
  const all = await readFromIndexedDB<Chats>("chats")
  return (all as Chats[]).sort(
    (a, b) => +new Date(b.created_at || "") - +new Date(a.created_at || "")
  )
}

export async function updateChatTitleLocal(id: string, title: string) {
  const all = await getChats()
  const updated = (all as Chats[]).map((c) => (c.id === id ? { ...c, title } : c))
  await writeToIndexedDB("chats", updated)
}

export async function deleteChatLocal(id: string) {
  const all = await getChats()
  await writeToIndexedDB(
    "chats",
    (all as Chats[]).filter((c) => c.id !== id)
  )
}

export async function updateChatModelLocal(chatId: string, model: string) {
  const all = await getChats()
  const updated = (all as Chats[]).map((c) => (c.id === chatId ? { ...c, model } : c))
  await writeToIndexedDB("chats", updated)
}


