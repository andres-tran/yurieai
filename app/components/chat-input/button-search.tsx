import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GlobeIcon } from "@phosphor-icons/react"
import React from "react"

type ButtonSearchProps = {
  isSelected?: boolean
  onToggle?: (isSelected: boolean) => void
}

export function ButtonSearch({
  isSelected = false,
  onToggle,
}: ButtonSearchProps) {
  const handleClick = () => {
    const newState = !isSelected
    onToggle?.(newState)
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      className={cn(
        // Mobile: fixed circular icon button like file upload
        "border-border dark:bg-secondary size-9 rounded-full border bg-transparent transition-all duration-150",
        // Desktop: allow width for label
        "md:w-auto md:px-3",
        isSelected &&
          "border-[#98a9f4]/20 bg-[#E5F3FE] text-[#98a9f4] hover:bg-[#E5F3FE] hover:text-[#98a9f4]"
      )}
      onClick={handleClick}
    >
      <GlobeIcon className="size-4" />
      <span className="hidden md:block">Search</span>
    </Button>
  )
}
