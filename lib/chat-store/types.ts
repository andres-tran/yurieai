export type Chats = {
  id: string
  title: string
  created_at?: string
  updated_at?: string
  model: string
  user_id: string
  public?: boolean
  project_id?: string | null
}

export type Chat = Chats
export type Message = {
  id: string
  role: "user" | "assistant" | "system" | string
  content?: string
  parts?: unknown
}
