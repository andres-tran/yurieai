"use client"

import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react"
import { ArrowUpIcon, StopIcon, FileArrowUp, Paperclip, X } from "@phosphor-icons/react"
import Image from "next/image"
import { AnimatePresence, motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import { createPortal } from "react-dom"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const dynamic = "force-dynamic"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ChatMessage = {
  id: string
  role: "user" | "assistant" | "developer"
  content: string
  imageBase64?: string
  attachments?: Array<{
    name: string
    size: number
    type: string
    url?: string
  }>
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 dark:border-none",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

function Tooltip(props: React.PropsWithChildren<Record<string, unknown>>) { return <>{props.children}</> }
function TooltipTrigger(
  props: React.PropsWithChildren<{ asChild?: boolean; disabled?: boolean }>
) { return <>{props.children}</> }
function TooltipContent(_props: React.PropsWithChildren<Record<string, unknown>>) { return null }

function HoverCard({ ...props }: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}
function HoverCardTrigger({ ...props }: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
}
function HoverCardContent({ className, ...props }: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        className={cn("z-50 rounded-md border bg-popover p-2 text-popover-foreground shadow-md", className)}
        sideOffset={4}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

type FileUploadContextValue = {
  isDragging: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  multiple?: boolean
  disabled?: boolean
}
const FileUploadContext = createContext<FileUploadContextValue | null>(null)

type FileUploadProps = {
  onFilesAdded: (files: File[]) => void
  children: React.ReactNode
  multiple?: boolean
  accept?: string
  disabled?: boolean
}
function FileUpload({ onFilesAdded, children, multiple = true, accept, disabled = false }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleFiles = useCallback(
    (files: FileList) => {
      const newFiles = Array.from(files)
      if (multiple) onFilesAdded(newFiles)
      else onFilesAdded(newFiles.slice(0, 1))
    },
    [multiple, onFilesAdded]
  )

  useEffect(() => {
    const handleDrag = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    const handleDragIn = (e: DragEvent) => {
      handleDrag(e)
      dragCounter.current++
      if (e.dataTransfer?.items.length) setIsDragging(true)
    }
    const handleDragOut = (e: DragEvent) => {
      handleDrag(e)
      dragCounter.current--
      if (dragCounter.current === 0) setIsDragging(false)
    }
    const handleDrop = (e: DragEvent) => {
      handleDrag(e)
      setIsDragging(false)
      dragCounter.current = 0
      if (e.dataTransfer?.files.length) handleFiles(e.dataTransfer.files)
    }
    window.addEventListener("dragenter", handleDragIn)
    window.addEventListener("dragleave", handleDragOut)
    window.addEventListener("dragover", handleDrag)
    window.addEventListener("drop", handleDrop)
    return () => {
      window.removeEventListener("dragenter", handleDragIn)
      window.removeEventListener("dragleave", handleDragOut)
      window.removeEventListener("dragover", handleDrag)
      window.removeEventListener("drop", handleDrop)
    }
  }, [handleFiles, onFilesAdded, multiple])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files)
      e.target.value = ""
    }
  }

  return (
    <FileUploadContext.Provider value={{ isDragging, inputRef, multiple, disabled }}>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
        accept={accept}
        aria-hidden
        disabled={disabled}
      />
      {children}
    </FileUploadContext.Provider>
  )
}
type FileUploadTriggerProps = React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean }
function FileUploadTrigger({ asChild = false, className, children, ...props }: FileUploadTriggerProps) {
  const context = useContext(FileUploadContext)
  const handleClick = () => context?.inputRef.current?.click()
  if (asChild) {
    const child = (children as React.ReactElement<React.HTMLAttributes<HTMLElement>>)
    return (
      <child.type
        {...child.props}
        {...props}
        role="button"
        className={cn(className, child.props.className)}
        onClick={(e: React.MouseEvent) => {
          handleClick()
          child.props.onClick?.(e as React.MouseEvent<HTMLElement>)
        }}
      />
    )
  }
  return (
    <button type="button" className={className} onClick={handleClick} {...props}>
      {children}
    </button>
  )
}
function FileUploadContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(FileUploadContext)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  if (!context?.isDragging || !mounted || context?.disabled) return null
  const content = (
    <div
      className={cn(
        "bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm",
        "animate-in fade-in-0 slide-in-from-bottom-10 zoom-in-90 duration-150",
        className
      )}
      {...props}
    />
  )
  return createPortal(content, document.body)
}

type PromptInputContextType = {
  isLoading: boolean
  value: string
  setValue: (value: string) => void
  maxHeight: number | string
  onSubmit?: () => void
  disabled?: boolean
}
const PromptInputContext = createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
})
function usePromptInput() {
  const context = useContext(PromptInputContext)
  if (!context) throw new Error("usePromptInput must be used within a PromptInput")
  return context
}
type PromptInputProps = {
  isLoading?: boolean
  value?: string
  onValueChange?: (value: string) => void
  maxHeight?: number | string
  onSubmit?: () => void
  children: React.ReactNode
  className?: string
}
function PromptInput({ className, isLoading = false, maxHeight = 240, value, onValueChange, onSubmit, children }: PromptInputProps) {
  const [internalValue, setInternalValue] = useState(value || "")
  const handleChange = (newValue: string) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }
  return (
    <PromptInputContext.Provider
      value={{ isLoading, value: value ?? internalValue, setValue: onValueChange ?? handleChange, maxHeight, onSubmit }}
    >
      <div className={cn("border-input bg-background rounded-3xl border p-2 shadow-xs", className)}>
        {children}
      </div>
    </PromptInputContext.Provider>
  )
}
type PromptInputTextareaProps = { disableAutosize?: boolean } & React.ComponentProps<typeof Textarea>
function PromptInputTextarea({ className, onKeyDown, disableAutosize = false, ...props }: PromptInputTextareaProps) {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (disableAutosize || !textareaRef.current) return
    textareaRef.current.style.height = "auto"
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [value, disableAutosize])
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit?.()
    }
    onKeyDown?.(e)
  }
  const maxHeightStyle = typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight
  return (
    <Textarea
      ref={textareaRef}
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "text-primary min-h-[44px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
        "overflow-y-auto",
        className
      )}
      style={{ maxHeight: maxHeightStyle }}
      rows={1}
      disabled={disabled}
      {...props}
    />
  )
}
function PromptInputActions({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  )
}
function PromptInputAction({ tooltip, children, className, side = "top", ...props }: {
  className?: string
  tooltip: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
} & React.ComponentProps<typeof Tooltip>) {
  const { disabled } = usePromptInput()
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>{children}</TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

 

function FileItem({ file, onRemove }: { file: File; onRemove: (file: File) => void }) {
  const [isRemoving, setIsRemoving] = useState(false)
  const handleRemove = () => {
    setIsRemoving(true)
    onRemove(file)
  }
  return (
    <div className="relative mr-2 mb-0 flex items-center">
      <div className="bg-background hover:bg-accent border-input flex w-full items-center gap-3 rounded-2xl border p-2 pr-3 transition-colors">
        <div className="bg-accent-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md">
          {file.type.includes("image") ? (
            <Image src={URL.createObjectURL(file)} alt={file.name} width={40} height={40} className="h-full w-full object-cover" />
          ) : (
            <div className="text-center text-xs text-gray-400">{file.name.split(".").pop()?.toUpperCase()}</div>
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate text-xs font-medium">{file.name}</span>
          <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)}kB</span>
        </div>
      </div>
      {!isRemoving ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleRemove}
              className="border-background absolute top-1 right-1 z-10 inline-flex size-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] bg-black text-white shadow-none transition-colors"
              aria-label="Remove file"
            >
              <X className="size-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Remove file</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}
function FileList({ files, onFileRemove }: { files: File[]; onFileRemove: (file: File) => void }) {
  const TRANSITION = { type: "spring", duration: 0.2, bounce: 0 } as const
  return (
    <AnimatePresence initial={false}>
      {files.length > 0 && (
        <motion.div
          key="files-list"
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={TRANSITION}
          className="overflow-hidden"
        >
          <div className="flex flex-row overflow-x-auto pl-3">
            <AnimatePresence initial={false}>
              {files.map((file) => (
                <motion.div
                  key={file.name}
                  initial={{ width: 0 }}
                  animate={{ width: 180 }}
                  exit={{ width: 0 }}
                  transition={TRANSITION}
                  className="relative shrink-0 overflow-hidden pt-2"
                >
                  <FileItem key={file.name} file={file} onRemove={onFileRemove} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ButtonFileUpload({ onFileUpload }: { onFileUpload: (files: File[]) => void }) {
  return (
    <FileUpload onFilesAdded={onFileUpload} multiple disabled={false} accept=".txt,.md,image/jpeg,image/png,image/gif,image/webp,image/svg,image/heic,image/heif">
      <Tooltip>
        <TooltipTrigger asChild>
          <FileUploadTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className={cn("border-border dark:bg-secondary size-9 rounded-full border bg-transparent", false && "opacity-50")}
              type="button"
              disabled={false}
              aria-label="Add files"
            >
              <Paperclip className="size-4" />
            </Button>
          </FileUploadTrigger>
        </TooltipTrigger>
        <TooltipContent>Add files</TooltipContent>
      </Tooltip>
      <FileUploadContent>
        <div className="border-input bg-background flex flex-col items-center rounded-lg border border-dashed p-8">
          <FileArrowUp className="text-muted-foreground size-8" />
        </div>
      </FileUploadContent>
    </FileUpload>
  )
}

type ChatInputProps = {
  value: string
  onValueChange: (value: string) => void
  onSend: () => void
  isSubmitting?: boolean
  files: File[]
  onFileUpload: (files: File[]) => void
  onFileRemove: (file: File) => void
  stop: () => void
  status?: "submitted" | "streaming" | "ready" | "error"
}
function ChatInput({ value, onValueChange, onSend, isSubmitting, files, onFileUpload, onFileRemove, stop, status }: ChatInputProps) {
  const isOnlyWhitespace = (text: string) => !/[^\s]/.test(text)

  const handleSend = useCallback(() => {
    if (isSubmitting) return
    if (status === "streaming" || status === "submitted") {
      stop()
      return
    }
    onSend()
  }, [isSubmitting, onSend, status, stop])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isSubmitting) {
      e.preventDefault()
      return
    }
    if (e.key === "Enter" && (status === "streaming" || status === "submitted")) {
      e.preventDefault()
      return
    }
    if (e.key === "Enter" && !e.shiftKey) {
      if (isOnlyWhitespace(value) && files.length === 0) return
      e.preventDefault()
      onSend()
    }
  }, [files.length, isSubmitting, onSend, status, value])

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const hasImageContent = Array.from(items).some((item) => item.type.startsWith("image/"))
    if (hasImageContent) {
      const imageFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) {
            const newFile = new File([file], `pasted-image-${Date.now()}.${file.type.split("/")[1]}`, { type: file.type })
            imageFiles.push(newFile)
          }
        }
      }
      if (imageFiles.length > 0) onFileUpload(imageFiles)
    }
  }, [onFileUpload])

 

  return (
    <div className="relative flex w-full flex-col gap-4">
      <div className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1">
        <PromptInput className="bg-popover relative z-10 p-0 pt-1 shadow-xs" maxHeight={200} value={value} onValueChange={onValueChange}>
          <FileList files={files} onFileRemove={onFileRemove} />
          <PromptInputTextarea
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask anything"
            className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
          />
          <PromptInputActions className="mt-3 w-full justify-between p-2">
            <div className="flex flex-wrap gap-2">
              <ButtonFileUpload onFileUpload={onFileUpload} />
            </div>
            <PromptInputAction tooltip={status === "streaming" || status === "submitted" ? "Stop" : "Send"}>
              <Button
                size="sm"
                className="size-9 rounded-full transition-all duration-300 ease-out"
                disabled={
                  status !== "streaming" &&
                  status !== "submitted" &&
                  (isSubmitting || (isOnlyWhitespace(value) && files.length === 0))
                }
                type="button"
                onClick={handleSend}
                aria-label={status === "streaming" || status === "submitted" ? "Stop" : "Send message"}
              >
                {status === "streaming" || status === "submitted" ? <StopIcon className="size-4" /> : <ArrowUpIcon className="size-4" />}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  )
}

export default function Home() {
  const [input, setInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready" | "error">("ready")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputHeight, setInputHeight] = useState<number>(134)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const appendMessage = useCallback((msg: Omit<ChatMessage, "id">) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    setMessages((prev) => [...prev, { id, ...msg }])
    return id
  }, [])

  const updateMessageContent = useCallback((id: string, update: (prev: string) => string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: update(m.content) } : m)))
  }, [])

  const updateMessage = useCallback((id: string, update: (prev: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? update(m) : m)))
  }, [])

  const handleSend = useCallback(() => {
    if (!input.trim() && files.length === 0) return
    setIsSubmitting(true)
    setStatus("submitted")

    // Add user message
    const userText = input
    const currentFiles = files
    const userId = appendMessage({ role: "user", content: userText })

    // Clear input and attachments for next turn
    setInput("")
    setFiles([])

    // Add placeholder assistant message for streaming
    const assistantId = appendMessage({ role: "assistant", content: "" })

    const controller = new AbortController()
    abortRef.current = controller

    const run = async () => {
      try {
        const wantsImage =
          currentFiles.length === 0 &&
          (/^\s*\/(img|image)\b/i.test(userText) ||
            /\b(generate|draw|create|make|produce|render|paint|illustrate|design)\b[\s\S]*\b(image|picture|photo|logo|icon|art|illustration|sprite|graphic)\b/i.test(
              userText
            ))

        if (wantsImage) {
          const res = await fetch("/api/images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userText, size: "1024x1024" }),
            signal: controller.signal,
          })
          if (!res.ok) {
            const errText = await res.text()
            updateMessageContent(assistantId, () => `Image generation failed: ${errText}`)
            setStatus("error")
            setIsSubmitting(false)
            return
          }
          const data = (await res.json()) as { image?: string }
          if (data.image) {
            updateMessage(assistantId, (prev) => ({ ...prev, imageBase64: data.image, content: "" }))
            setStatus("ready")
            setIsSubmitting(false)
            return
          }
          updateMessageContent(assistantId, () => "No image returned.")
          setStatus("error")
          setIsSubmitting(false)
          return
        }

        setStatus("streaming")
        // Prepare multimodal input if images are attached
        const imageFiles = currentFiles.filter((f) => f.type.startsWith("image/"))
        const nonImageFiles = currentFiles.filter((f) => !f.type.startsWith("image/"))
        const dataUrls: string[] = await Promise.all(
          imageFiles.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(String(reader.result))
                reader.onerror = (e) => reject(e)
                reader.readAsDataURL(file)
              })
          )
        )

        // Update the previously appended user message to show their attachments (images + other files)
        const attachments = [
          ...imageFiles.map((file, idx) => ({ name: file.name, size: file.size, type: file.type, url: dataUrls[idx] })),
          ...nonImageFiles.map((file) => ({ name: file.name, size: file.size, type: file.type })),
        ]
        if (attachments.length > 0) {
          updateMessage(userId, (prev) => ({ ...prev, attachments }))
        }

        const multimodalContent: Array<
          | { type: "input_text"; text: string }
          | { type: "input_image"; image_url: string; detail?: "low" | "high" | "auto" }
        > = []

        const trimmed = userText.trim()
        if (trimmed) {
          multimodalContent.push({ type: "input_text", text: trimmed })
        }
        for (const url of dataUrls) {
          multimodalContent.push({ type: "input_image", image_url: url, detail: "auto" })
        }

        const prior = messages.map(({ role, content }) => ({ role, content }))
        const inputPayload =
          multimodalContent.length > 0
            ? [
                ...prior,
                {
                  role: "user" as const,
                  content: multimodalContent,
                },
              ]
            : prior.concat({ role: "user" as const, content: userText })

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-5",
            input: inputPayload,
          }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          setStatus("error")
          setIsSubmitting(false)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        const finalize = () => {
          setStatus("ready")
          setIsSubmitting(false)
        }

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let idx = buffer.indexOf("\n\n")
          while (idx !== -1) {
            const rawEvent = buffer.slice(0, idx)
            buffer = buffer.slice(idx + 2)

            let eventName = "message"
            const dataLines: string[] = []
            for (const line of rawEvent.split("\n")) {
              if (line.startsWith("event:")) eventName = line.slice(6).trim()
              else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim())
            }
            const data = dataLines.join("\n")

            if (data === "[DONE]" || eventName === "done") {
              finalize()
              break
            }

            try {
              const json = data ? JSON.parse(data) : null

              if (eventName === "response.output_text.delta") {
                const delta: string = json?.delta ?? ""
                if (delta) updateMessageContent(assistantId, (prev) => prev + delta)
              } else if (eventName === "response.output_text.done") {
                // no-op; final text already aggregated
              } else if (eventName === "response.error" || eventName === "error") {
                setStatus("error")
              } else if (eventName === "response.completed") {
                // Completed response
              }
            } catch {
              // Ignore non-JSON data lines
            }

            idx = buffer.indexOf("\n\n")
          }
        }

        // Flush any remaining buffered text
        if (buffer.length > 0) {
          try {
            const maybe = buffer.trim()
            if (maybe) {
              const json = JSON.parse(maybe)
              if (json?.delta) updateMessageContent(assistantId, (prev) => prev + String(json.delta))
            }
          } catch {}
        }

        finalize()
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setStatus("ready")
          setIsSubmitting(false)
          return
        }
        setStatus("error")
        setIsSubmitting(false)
      }
    }

    void run()
  }, [appendMessage, input, files, messages, updateMessage, updateMessageContent])

  const handleFileUpload = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleFileRemove = useCallback((file: File) => {
    setFiles((prev) => prev.filter((f) => f !== file))
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  useEffect(() => {
    const el = inputContainerRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    let raf = 0
    let last = inputHeight
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const h = Math.ceil(entry.contentRect.height)
      if (h === last) return
      last = h
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setInputHeight(h))
    })
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [inputHeight])

  // Track whether the user is near the bottom; only autoscroll in that case
  useEffect(() => {
    let ticking = false
    const scroller = scrollRef.current
    if (!scroller) return
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const distanceToBottom = scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight)
        setIsNearBottom(distanceToBottom < 120)
        ticking = false
      })
    }
    // initialize state based on current scroll
    handleScroll()
    scroller.addEventListener("scroll", handleScroll, { passive: true })
    return () => scroller.removeEventListener("scroll", handleScroll)
  }, [])

  // Autoscroll to bottom when new content arrives, but avoid smooth scrolling during streaming
  useEffect(() => {
    if (!isNearBottom) return
    const scroller = scrollRef.current
    if (!scroller) return
    if (status === "streaming") {
      scroller.scrollTop = scroller.scrollHeight
    } else {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" })
    }
  }, [messages, status, isNearBottom])

  return (
    <div className="bg-background w-full h-svh overflow-hidden">
      <div className="mx-auto w-full max-w-3xl h-full flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="px-4">
            <div className="mb-4 space-y-3 overflow-anchor-none">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "border-input bg-popover text-popover-foreground w-full rounded-2xl border p-3",
                    "border-muted"
                  )}
                >
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{m.role}</div>
                  {m.imageBase64 ? (
                    <img
                      alt="Generated image"
                      src={`data:image/png;base64,${m.imageBase64}`}
                      className="w-full h-auto rounded-lg border"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  )}
                  {Array.isArray(m.attachments) && m.attachments.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((att, idx) => {
                        const isImg = /^image\//.test(att.type)
                        if (isImg && att.url) {
                          return (
                            <img
                              key={`${att.name}-${idx}`}
                              src={att.url}
                              alt={att.name}
                              className="h-28 w-28 rounded-md border object-cover"
                            />
                          )
                        }
                        return (
                          <div
                            key={`${att.name}-${idx}`}
                            className="border-input bg-background text-xs rounded-md border px-2 py-1"
                            title={`${att.name} (${Math.ceil(att.size / 1024)}KB)`}
                          >
                            {att.name}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="sticky bottom-0 z-40 border-t border-border/50 bg-background/85 overflow-anchor-none gpu-layer">
            <div ref={inputContainerRef} className="mx-auto w-full max-w-3xl p-4 pb-[calc(env(safe-area-inset-bottom,0)+0px)]">
              <ChatInput
                value={input}
                onValueChange={setInput}
                onSend={handleSend}
                isSubmitting={isSubmitting}
                files={files}
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
                stop={stop}
                status={status}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
