import { useChatDraft } from "@/lib/hooks/use-chat-draft"
import { toast } from "@/components/ui/toast"
// Auth removed
import { MESSAGE_MAX_LENGTH, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { Attachment } from "@/lib/file-handling"
import { API_ROUTE_CHAT } from "@/lib/routes"
import type { UserProfile } from "@/lib/user/types"
import type { Message } from "@ai-sdk/react"
import { useChat } from "@ai-sdk/react"
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
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const [enableSearch, setEnableSearch] = useState(true)

  // Refs and derived state
  const hasSentFirstMessageRef = useRef(false)
  const prevChatIdRef = useRef<string | null>(chatId)
  const isAuthenticated = false
  const systemPrompt = useMemo(
    () => user?.system_prompt || SYSTEM_PROMPT_DEFAULT,
    [user?.system_prompt]
  )

  // Search params handling
  const searchParams = useSearchParams()
  const prompt = searchParams.get("prompt")

  // Handle errors directly in onError callback
  const handleError = useCallback((error: Error) => {
    console.error("Chat error:", error)
    console.error("Error message:", error.message)
    let errorMsg = error.message || "Something went wrong."

    if (errorMsg === "An error occurred" || errorMsg === "fetch failed") {
      errorMsg = "Something went wrong. Please try again."
    }

    toast({
      title: errorMsg,
      status: "error",
    })
  }, [])

  // Initialize useChat
  const {
    messages,
    input,
    handleSubmit,
    status,
    error,
    reload,
    stop,
    setMessages,
    setInput,
    append,
  } = useChat({
    api: API_ROUTE_CHAT,
    initialMessages,
    initialInput: draftValue,
    onFinish: cacheAndAddMessage,
    onError: handleError,
  })

  // Handle search params on mount
  useEffect(() => {
    if (prompt && typeof window !== "undefined") {
      requestAnimationFrame(() => setInput(prompt))
    }
  }, [prompt, setInput])

  // Clear chat when a global clear event is dispatched (e.g., clicking the logo)
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

  // Stop chat streaming when triggered globally
  useEffect(() => {
    const handleStop = () => {
      stop()
    }
    if (typeof window !== "undefined") {
      window.addEventListener("stop-chat", handleStop)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("stop-chat", handleStop)
      }
    }
  }, [stop])

  // Reset messages when navigating from a chat to home
  useEffect(() => {
    if (
      prevChatIdRef.current !== null &&
      chatId === null &&
      messages.length > 0
    ) {
      setMessages([])
    }
    prevChatIdRef.current = chatId
  }, [chatId, messages.length, setMessages])

  // Submit action
  const submit = useCallback(async () => {
    setIsSubmitting(true)

    // No user identity required

    const optimisticId = `optimistic-${Date.now().toString()}`
    const optimisticAttachments =
      files.length > 0 ? createOptimisticAttachments(files) : []

    const optimisticMessage = {
      id: optimisticId,
      content: input,
      role: "user" as const,
      createdAt: new Date(),
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

      if (input.length > MESSAGE_MAX_LENGTH) {
        toast({
          title: `The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`,
          status: "error",
        })
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
        cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
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
          return
        }
      }

      const options = {
        body: {
          chatId: currentChatId,
          model: selectedModel,
          systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
          enableSearch,
        },
        experimental_attachments: attachments || undefined,
      }

      append(
        {
          role: "user",
          content: optimisticMessage.content,
        },
        options
      )
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
      cacheAndAddMessage(optimisticMessage)
      clearDraft()
    } catch {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
      cleanupOptimisticAttachments(optimisticMessage.experimental_attachments)
      toast({ title: "Failed to send message", status: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    user,
    files,
    createOptimisticAttachments,
    input,
    setMessages,
    setInput,
    setFiles,
    cleanupOptimisticAttachments,
    handleFileUploads,
    selectedModel,
    isAuthenticated,
    systemPrompt,
    enableSearch,
    handleSubmit,
    append,
    cacheAndAddMessage,
    clearDraft,
    messages.length,
    chatId,
    setIsSubmitting,
    handleError,
  ])

  // Handle reload
  const handleReload = useCallback(async () => {
    const currentChatId =
      chatId ||
      localStorage.getItem("guestChatId") ||
      (() => {
        const newId = crypto.randomUUID()
        localStorage.setItem("guestChatId", newId)
        return newId
      })()

    if (!currentChatId) {
      return
    }

    const options = {
      body: {
        chatId: currentChatId,
        model: selectedModel,
        systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
        enableSearch,
      },
    }

    reload(options)
  }, [
    user,
    chatId,
    selectedModel,
    isAuthenticated,
    systemPrompt,
    enableSearch,
    reload,
  ])

  // Handle input change - now with access to the real setInput function!
  const { setDraftValue } = useChatDraft(chatId)
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setDraftValue(value)
    },
    [setInput, setDraftValue]
  )

  return {
    // Chat state
    messages,
    input,
    handleSubmit,
    status,
    error,
    reload,
    stop,
    setMessages,
    setInput,
    append,
    isAuthenticated,
    systemPrompt,
    hasSentFirstMessageRef,

    // Component state
    isSubmitting,
    setIsSubmitting,
    hasDialogAuth,
    setHasDialogAuth,
    enableSearch,
    setEnableSearch,

    // Actions
    submit,
    handleReload,
    handleInputChange,
  }
}
