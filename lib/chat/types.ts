export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
  experimental_attachments?: Array<{ name: string; contentType: string; url: string }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts?: any[]
}
