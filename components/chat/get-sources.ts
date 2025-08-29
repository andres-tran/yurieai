import type { Message } from "@/lib/chat/types"

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getSources(parts: Message["parts"]) {
  const sources = (parts as any[])
    ?.filter(
      (part: any) => part.type === "source" || part.type === "tool-invocation"
    )
    .map((part: any) => {
      if (part.type === "source") {
        return part.source
      }

      if (
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "result"
      ) {
        const result = part.toolInvocation.result

        if (
          part.toolInvocation.toolName === "summarizeSources" &&
          result?.result?.[0]?.citations
        ) {
          return result.result.flatMap((item: { citations?: unknown[] }) => item.citations || [])
        }

        return Array.isArray(result) ? result.flat() : result
      }

      return null
    })
    .filter(Boolean)
    .flat()

  const validSources =
    sources?.filter(
      (source) =>
        source && typeof source === "object" && source.url && source.url !== ""
    ) || []

  return validSources
}
