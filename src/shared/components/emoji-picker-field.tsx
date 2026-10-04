import { useState } from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { Smile, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/shared/hooks/use-mobile";

const PICKER_HEIGHT = 380;

interface EmojiPickerFieldProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
  /** Thème suivi par le picker (`theme` du shell : light / dark / system). */
  theme?: "light" | "dark" | "system";
}

/**
 * Sélecteur d'emoji (emoji-picker-react) : popover ancré sur desktop, bottom sheet pleine
 * hauteur sur mobile (clavier de recherche compris, plafonné au `--vvh`). Bouton d'ouverture,
 * retrait explicite, thème aligné sur l'application.
 */
export function EmojiPickerField({
  value,
  onChange,
  theme = "system",
}: EmojiPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const picker = (
    <EmojiPicker
      width="100%"
      height={isMobile ? "100%" : PICKER_HEIGHT}
      className={isMobile ? "qu-emoji-picker" : undefined}
      theme={
        theme === "dark"
          ? Theme.DARK
          : theme === "light"
            ? Theme.LIGHT
            : Theme.AUTO
      }
      lazyLoadEmojis
      emojiStyle={EmojiStyle.NATIVE}
      autoFocusSearch={!isMobile}
      searchPlaceholder="Rechercher un emoji…"
      previewConfig={{ showPreview: false }}
      onEmojiClick={(emoji) => {
        onChange(emoji.emoji);
        setOpen(false);
      }}
    />
  );

  if (isMobile) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2"
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

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="h-[min(80dvh,var(--vvh,100dvh))]! gap-0 rounded-t-3xl p-0"
          >
            <div
              className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border"
              aria-hidden="true"
            />
            <SheetHeader className="px-6 pt-3 pb-2">
              <SheetTitle>Choisir un emoji</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 px-1 pb-1">{picker}</div>
            {value && (
              <SheetFooter className="border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 w-full"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <Trash2 className="size-4" /> Retirer l'emoji
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </div>
    );
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
  );
}
