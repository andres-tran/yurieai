import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
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
      variant="secondary"
      className={cn(
        "border-border dark:bg-secondary rounded-full border bg-transparent transition-all duration-150 has-[>svg]:px-1.75 md:has-[>svg]:px-3",
        isSelected &&
          "border-[#98a9f4]/20 bg-[#E5F3FE] text-[#98a9f4] hover:bg-[#E5F3FE] hover:text-[#98a9f4]"
      )}
      onClick={handleClick}
    >
      <GlobeIcon className="size-5" />
      <span className="hidden md:block">Search</span>
    </Button>
  )
}
