import { APP_DOMAIN } from "@/lib/config"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Article from "./article"

export const dynamic = "force-static"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chatId: string }>
}): Promise<Metadata> {
  const { chatId } = await params
  const title = "Chat"
  const description = "A chat in Yurie"

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `${APP_DOMAIN}/share/${chatId}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function ShareChat({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params
  return notFound()
}
