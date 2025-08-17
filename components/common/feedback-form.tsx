"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { CaretLeft, SealCheck, Spinner } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

const TRANSITION_CONTENT = {
  ease: "easeOut",
  duration: 0.2,
}

type FeedbackFormProps = {
  onClose: () => void
}

export function FeedbackForm({ onClose }: FeedbackFormProps) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle")
  const [feedback, setFeedback] = useState("")

  return null

  const handleClose = () => {
    setFeedback("")
    setStatus("idle")
    onClose()
  }

  const handleSubmit = async (_e: React.FormEvent<HTMLFormElement>) => {}

  return null
}
