import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { SelectRow } from "@/shared/components/select-row"

interface ChoiceCardProps {
  icon: LucideIcon
  title: string
  desc: string
  selected: boolean
  onSelect: () => void
}

/**
 * Carte de choix radio (adversaire, source de recherche) — même anatomie que les lignes de
 * sélection (`SelectRow`) : visuel de tête, titre, description et radio.
 */
export function ChoiceCard({
  icon: Icon,
  title,
  desc,
  selected,
  onSelect,
}: ChoiceCardProps) {
  return (
    <SelectRow
      visual={
        <span
          className={cn(
            "grid size-9 place-items-center rounded-full",
            selected
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon size={20} aria-hidden />
        </span>
      }
      title={title}
      subtitle={desc}
      selected={selected}
      onSelect={onSelect}
    />
  )
}
