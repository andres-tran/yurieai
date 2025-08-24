"use client"

import { useBreakpoint } from "@/lib/hooks/use-breakpoint"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMutation } from "@tanstack/react-query"

type ProModelDialogProps = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  currentModel: string
}

export function ProModelDialog({
  isOpen,
  setIsOpen,
  currentModel,
}: ProModelDialogProps) {
  const isMobile = useBreakpoint(768)
  const mutation = useMutation({
    mutationFn: async () => {
      // Supabase removed; accept without network
      return
    },
  })

  const renderContent = () => (
    <div className="flex max-h-[70vh] flex-col" key={currentModel}>
      <div className="h-32 w-full bg-muted" />

      <div className="px-6 pt-4 text-center text-lg leading-tight font-medium">
        This model is locked
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="px-6 py-4">
          <p className="text-muted-foreground">
            To use it, connect your own API key.
            <span className="text-primary inline-flex font-medium">
              OpenRouter
            </span>
            .
          </p>
          <p className="text-muted-foreground mt-1">
            Add your key securely in the{" "}
            <span className="text-primary inline-flex font-medium">
              API Keys
            </span>{" "}
            section.
          </p>
          <p className="text-muted-foreground mt-5">
            We don&apos;t support this model yet?
          </p>
          {mutation.isSuccess ? (
            <div className="mt-5 flex justify-center gap-3">
              <Badge className="bg-green-600 text-white">
                Thanks! We&apos;ll keep you updated
              </Badge>
            </div>
          ) : (
            <div className="mt-5 flex justify-center gap-3">
              <Button
                className="w-full"
                onClick={() => mutation.mutate()}
                size="sm"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Sending..." : "Ask for access"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="px-0">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Pro Model Access Required</DrawerTitle>
          </DrawerHeader>
          {renderContent()}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="[&>button:last-child]:bg-background gap-0 overflow-hidden rounded-3xl p-0 shadow-xs sm:max-w-md [&>button:last-child]:rounded-full [&>button:last-child]:p-1">
        <DialogHeader className="sr-only">
          <DialogTitle>Pro Model Access Required</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
