import { useChatDraft } from "@/lib/hooks/use-chat-draft"
import { toast } from "@/components/ui/toast"
import { MESSAGE_MAX_LENGTH, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { Attachment } from "@/lib/file-handling"
import { API_ROUTE_CHAT } from "@/lib/routes"
import type { UserProfile } from "@/lib/user/types"
import type { Message } from "@/lib/chat/types"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type UseChatCoreProps = {
  initialMessages: Message[]
  draftValue: string
  cacheAndAddMessage: (message: Message) => void
  chatId: string | null
  user: UserProfile | null
  files: File[]
  createOptimisticAttachments: (
    files: File[]
  ) => Array<{ name: string; contentType: string; url: string }>
  setFiles: (files: File[]) => void
  cleanupOptimisticAttachments: (attachments?: Array<{ url?: string }>) => void
  handleFileUploads: (
    uid: string,
    chatId: string
  ) => Promise<Attachment[] | null>
  selectedModel: string
  clearDraft: () => void
}

export function useChatCore({
  initialMessages,
  draftValue,
  cacheAndAddMessage,
  chatId,
  user,
  files,
  createOptimisticAttachments,
  setFiles,
  cleanupOptimisticAttachments,
  handleFileUploads,
  selectedModel,
  clearDraft,
}: UseChatCoreProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState(draftValue)
  const [status, setStatus] = useState<"ready" | "submitted" | "error">(
    "ready"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const [enableSearch, setEnableSearch] = useState(true)

  const hasSentFirstMessageRef = useRef(false)
  const prevChatIdRef = useRef<string | null>(chatId)
  const isAuthenticated = false
  const systemPrompt = useMemo(
    () => user?.system_prompt || SYSTEM_PROMPT_DEFAULT,
    [user?.system_prompt]
  )

  const searchParams = useSearchParams()
  const prompt = searchParams.get("prompt")

  useEffect(() => {
    if (prompt && typeof window !== "undefined") {
      requestAnimationFrame(() => setInput(prompt))
    }
  }, [prompt])

  const { setDraftValue } = useChatDraft(chatId)

  useEffect(() => {
    const handleClear = () => {
      setMessages([])
      setInput("")
      setFiles([])
      clearDraft()
    }
    if (typeof window !== "undefined") {
      window.addEventListener("clear-chat", handleClear)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("clear-chat", handleClear)
      }
    }
  }, [setMessages, setInput, setFiles, clearDraft])

  useEffect(() => {
    if (
      prevChatIdRef.current !== null &&
      chatId === null &&
      messages.length > 0
    ) {
      setMessages([])
    }
    prevChatIdRef.current = chatId
  }, [chatId, messages.length])

  const submit = useCallback(
    async (overrideInput?: string) => {
      setIsSubmitting(true)
      setStatus("submitted")

      const messageContent = overrideInput ?? input
      const optimisticId = `optimistic-${Date.now().toString()}`
      const optimisticAttachments =
        files.length > 0 ? createOptimisticAttachments(files) : []

      const optimisticMessage: Message = {
        id: optimisticId,
        content: messageContent,
        role: "user",
        experimental_attachments:
          optimisticAttachments.length > 0 ? optimisticAttachments : undefined,
      }

      setMessages((prev) => [...prev, optimisticMessage])
      setInput("")

      const submittedFiles = [...files]
      setFiles([])

      try {
        const currentChatId =
          chatId ||
          localStorage.getItem("guestChatId") ||
          (() => {
            const newId = crypto.randomUUID()
            localStorage.setItem("guestChatId", newId)
            return newId
          })()

        if (messageContent.length > MESSAGE_MAX_LENGTH) {
          toast({
            title: `The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`,
            status: "error",
          })
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
          cleanupOptimisticAttachments(
            optimisticMessage.experimental_attachments
          )
          setStatus("error")
          return
        }

        let attachments: Attachment[] | null = []
        if (submittedFiles.length > 0) {
          attachments = await handleFileUploads("local", currentChatId)
          if (attachments === null) {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
            cleanupOptimisticAttachments(
              optimisticMessage.experimental_attachments
            )
            setStatus("error")
            return
          }
        }

        const payload = {
          chatId: currentChatId,
          model: selectedModel,
          systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
          enableSearch,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: messageContent },
          ],
          attachments: attachments || undefined,
        }

        const res = await fetch(API_ROUTE_CHAT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          throw new Error("Request failed")
        }

        const data = (await res.json()) as { content: string }
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.content,
        }

        setMessages((prev) =>
          prev
            .filter((msg) => msg.id !== optimisticId)
            .concat(optimisticMessage, assistantMessage)
        )
        cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        cacheAndAddMessage(optimisticMessage)
        cacheAndAddMessage(assistantMessage)
        clearDraft()
        setStatus("ready")
      } catch (err) {
        console.error(err)
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
        toast({ title: "Failed to send message", status: "error" })
        setStatus("error")
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      files,
      createOptimisticAttachments,
      input,
      setMessages,
      setInput,
      setFiles,
      cleanupOptimisticAttachments,
      handleFileUploads,
      selectedModel,
      systemPrompt,
      enableSearch,
      cacheAndAddMessage,
      clearDraft,
      messages,
      chatId,
    ]
  )

  const handleReload = useCallback(async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (!lastUser) return
    // remove last assistant message if it's the last entry
    setMessages((prev) =>
      prev[prev.length - 1]?.role === "assistant"
        ? prev.slice(0, -1)
        : prev
    )
    await submit(lastUser.content)
  }, [messages, submit])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setDraftValue(value)
    },
    [setInput, setDraftValue]
  )

  return {
    messages,
    input,
    status,
    stop: () => {},
    setMessages,
    setInput,
    isAuthenticated,
    systemPrompt,
    hasSentFirstMessageRef,
    isSubmitting,
    setIsSubmitting,
    hasDialogAuth,
    setHasDialogAuth,
    enableSearch,
    setEnableSearch,
    submit,
    handleReload,
    handleInputChange,
  }
}
