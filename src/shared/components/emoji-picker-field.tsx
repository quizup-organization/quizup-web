import { useState } from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { Smile } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PICKER_HEIGHT = 380;

interface EmojiPickerFieldProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
  /** Thème suivi par le picker (`theme` du shell : light / dark / system). */
  theme?: "light" | "dark" | "system";
}

/**
 * Sélecteur d'emoji (emoji-picker-react) dans un popover : bouton d'ouverture, retrait
 * explicite, thème aligné sur l'application. Le champ vit dans un formulaire contrôlé.
 */
export function EmojiPickerField({
  value,
  onChange,
  theme = "system",
}: EmojiPickerFieldProps) {
  const [open, setOpen] = useState(false);

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
          <EmojiPicker
            width="100%"
            height={PICKER_HEIGHT}
            theme={
              theme === "dark"
                ? Theme.DARK
                : theme === "light"
                  ? Theme.LIGHT
                  : Theme.AUTO
            }
            lazyLoadEmojis
            emojiStyle={EmojiStyle.NATIVE}
            searchPlaceholder="Rechercher un emoji…"
            previewConfig={{ showPreview: false }}
            onEmojiClick={(emoji) => {
              onChange(emoji.emoji);
              setOpen(false);
            }}
          />
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
