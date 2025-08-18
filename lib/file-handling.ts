import { toast } from "@/components/ui/toast"
import * as fileType from "file-type"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

export type Attachment = {
  name: string
  contentType: string
  url: string
}

export async function validateFile(
  file: File
): Promise<{ isValid: boolean; error?: string }> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    }
  }

  const buffer = await file.arrayBuffer()
  const type = await fileType.fileTypeFromBuffer(
    Buffer.from(buffer.slice(0, 4100))
  )

  if (!type || !ALLOWED_FILE_TYPES.includes(type.mime)) {
    return {
      isValid: false,
      error: "File type not supported or doesn't match its extension",
    }
  }

  return { isValid: true }
}

// Note: Persistent file uploads to external storage are intentionally disabled in this app.
// All file handling is performed client-side via data URLs for images only. Non-image files are skipped.

export function createAttachment(file: File, url: string): Attachment {
  return {
    name: file.name,
    contentType: file.type,
    url,
  }
}

export async function processFiles(
  files: File[],
  chatId: string,
  _userId: string
): Promise<Attachment[]> {
  const supabase = null
  const attachments: Attachment[] = []

  for (const file of files) {
    const validation = await validateFile(file)
    if (!validation.isValid) {
      console.warn(`File ${file.name} validation failed:`, validation.error)
      toast({
        title: "File validation failed",
        description: validation.error,
        status: "error",
      })
      continue
    }

    // Without storage, only inline image uploads are supported (per OpenAI image_url guidance)
    if (!supabase && !file.type.startsWith("image/")) {
      toast({
        title: "Only images are supported for inline upload",
        description: `${file.name} was skipped. Upload images (PNG/JPEG/GIF).`,
        status: "info",
      })
      continue
    }

    try {
      const url = file.type.startsWith("image/")
        ? await fileToDataUrl(file)
        : ""

      // No DB persistence

      if (url) {
        attachments.push(createAttachment(file, url))
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error)
    }
  }

  return attachments
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () =>
      reject(reader.error || new Error("Failed to read file as data URL"))
    reader.readAsDataURL(file)
  })
}

export class FileUploadLimitError extends Error {
  code: string
  constructor(message: string) {
    super(message)
    this.code = "DAILY_FILE_LIMIT_REACHED"
  }
}

export async function checkFileUploadLimit(_userId: string) {
  // No server-side tracking; enforce client-side guidance only
  return 0
}
