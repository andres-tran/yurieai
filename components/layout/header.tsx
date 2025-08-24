"use client"

import { useChatDraft } from "@/lib/hooks/use-chat-draft"
import { useMessages } from "@/lib/chat-store/messages/provider"
import Link from "next/link"
import { DialogPublish } from "./dialog-publish"

export function Header() {
  const user = null
  const { resetMessages } = useMessages()
  const { clearDraft } = useChatDraft(null)

  const isLoggedIn = !!user

  return (
    <header className="h-app-header pointer-events-none fixed top-0 right-0 left-0 z-50">
      <div className="relative mx-auto flex h-full max-w-full items-center justify-between bg-transparent px-4 sm:px-6 lg:bg-transparent lg:px-8">
        <div className="flex flex-1 items-center justify-between">
          <div className="-ml-0.5 flex flex-1 items-center gap-2 lg:-ml-2.5">
            <div className="flex flex-1 items-center gap-2">
              <Link
                href="/"
                className="pointer-events-auto inline-flex items-center"
                onClick={() => {
                  resetMessages()
                  clearDraft()
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("stop-chat"))
                    window.dispatchEvent(new Event("clear-chat"))
                  }
                }}
              >
                <img src="/favicon.ico" alt="Yurie" width={32} height={32} />
              </Link>
            </div>
          </div>
          <div />
          {!isLoggedIn ? (
            <div className="pointer-events-auto flex flex-1 items-center justify-end gap-2" />
          ) : (
            <div className="pointer-events-auto flex flex-1 items-center justify-end gap-2">
              <DialogPublish />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
