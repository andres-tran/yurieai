"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUser } from "@/lib/user-store/provider"
import { useState } from "react"
import { SettingsTrigger } from "./settings/settings-trigger"

export function UserMenu() {
  const { user } = useUser()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  if (!user) return null

  const handleSettingsOpenChange = (isOpen: boolean) => {
    setSettingsOpen(isOpen)
    if (!isOpen) {
      setMenuOpen(false)
    }
  }

  return (
    // fix shadcn/ui / radix bug when dialog into dropdown menu
    <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen} modal={false}>
      <DropdownMenuTrigger>
        <Avatar className="bg-background hover:bg-muted">
          <AvatarImage src={user?.profile_image ?? undefined} />
          <AvatarFallback>{user?.display_name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="end"
        forceMount
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (isSettingsOpen) {
            e.preventDefault()
            return
          }
          setMenuOpen(false)
        }}
      >
        <SettingsTrigger onOpenChange={handleSettingsOpenChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
