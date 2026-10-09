import { useState } from "react"
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react"
import { Smile, Trash2 } from "lucide-react"
import { cn } from "cn"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  BottomSheet,
  BottomSheetClose,
} from "@/components/arc/bottom-sheet/bottom-sheet"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { SHEET_DETENTS } from "@/shared/theme/sheets"

const PICKER_HEIGHT = 380

interface EmojiPickerFieldProps {
  value: string | null
  onChange: (emoji: string | null) => void
  /** Thème suivi par le picker (`theme` du shell : light / dark / system). */
  theme?: "light" | "dark" | "system"
}

/**
 * Sélecteur d'emoji (emoji-picker-react) : popover ancré sur desktop, bottom sheet Arc UI
 * (hauteur quasi pleine, clavier de recherche compris) sur mobile. Bouton d'ouverture,
 * retrait explicite, thème aligné sur l'application.
 */
export function EmojiPickerField({
  value,
  onChange,
  theme = "system",
}: EmojiPickerFieldProps) {
  const [open, setOpen] = useState(false)
  const isTouch = useIsTouchLayout()

  const picker = (
    <EmojiPicker
      width="100%"
      height={isTouch ? "100%" : PICKER_HEIGHT}
      className={isTouch ? "qu-emoji-picker" : undefined}
      theme={
        theme === "dark"
          ? Theme.DARK
          : theme === "light"
            ? Theme.LIGHT
            : Theme.AUTO
      }
      lazyLoadEmojis
      emojiStyle={EmojiStyle.NATIVE}
      autoFocusSearch={!isTouch}
      searchPlaceholder="Rechercher un emoji…"
      previewConfig={{ showPreview: false }}
      onEmojiClick={(emoji) => {
        onChange(emoji.emoji)
        setOpen(false)
      }}
    />
  )

  if (isTouch) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          aria-label={value ? "Changer l'emoji" : "Choisir un emoji"}
          onClick={() => setOpen(true)}
        >
          {value ? (
            <span className="text-base leading-none">{value}</span>
          ) : (
            <Smile className="size-4" />
          )}
          <span>{value ? "Changer l'emoji" : "Choisir un emoji"}</span>
        </Button>

        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title="Choisir un emoji"
          detents={SHEET_DETENTS.picker}
          initialDetent={1}
          bodyStyle={{ padding: 0 }}
          footer={
            value ? (
              <BottomSheetClose asChild>
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "w-full"
                  )}
                  onClick={() => onChange(null)}
                >
                  <Trash2 className="size-4" /> Retirer l'emoji
                </button>
              </BottomSheetClose>
            ) : undefined
          }
        >
          <div className="h-full px-1">{picker}</div>
        </BottomSheet>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={value ? "Changer l'emoji" : "Choisir un emoji"}
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          {value ? (
            <span className="text-base leading-none">{value}</span>
          ) : (
            <Smile className="size-4" />
          )}
          <span>{value ? "Changer l'emoji" : "Choisir un emoji"}</span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(320px,calc(100vw-1rem))] overflow-hidden p-0"
        >
          {picker}
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Retirer
        </button>
      )}
    </div>
  )
}
