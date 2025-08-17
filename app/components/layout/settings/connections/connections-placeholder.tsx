import { PlugsConnected } from "@phosphor-icons/react"

export function ConnectionsPlaceholder() {
  return (
    <div className="py-8 text-center">
      <PlugsConnected className="text-muted-foreground mx-auto mb-2 size-12" />
      <h3 className="mb-1 text-sm font-medium">No connections available</h3>
      <p className="text-muted-foreground text-sm">Only OpenAI is enabled.</p>
    </div>
  )
}
