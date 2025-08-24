import { Chat } from "@/components/chat/chat"
import { LayoutApp } from "@/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <MessagesProvider>
      <LayoutApp>
        <Chat />
      </LayoutApp>
    </MessagesProvider>
  )
}
