"use client"

import { useCallback, useState } from "react"

export default function ImagesPage() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setIsLoading(true)
    setError(null)
    setImageBase64(null)
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size: "1024x1024" }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      const data = (await res.json()) as { image?: string }
      if (!data.image) throw new Error("No image in response")
      setImageBase64(data.image)
    } catch (e: any) {
      setError(e?.message || "Failed to generate image")
    } finally {
      setIsLoading(false)
    }
  }, [prompt])

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Generate Image</h1>
      <div className="flex gap-2 mb-4">
        <input
          className="w-full rounded-md border bg-transparent px-3 py-2"
          placeholder="Describe the image you want"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleGenerate()
            }
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 disabled:opacity-50"
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>
      {error ? <div className="text-red-500 mb-2">{error}</div> : null}
      {imageBase64 ? (
        <img
          alt="Generated image"
          src={`data:image/png;base64,${imageBase64}`}
          className="w-full h-auto rounded-lg border"
        />
      ) : null}
    </div>
  )
}


