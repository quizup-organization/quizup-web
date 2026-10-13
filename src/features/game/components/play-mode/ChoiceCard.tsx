import type { LucideIcon } from "lucide-react"

interface ChoiceCardProps {
  icon: LucideIcon
  title: string
  desc: string
  selected: boolean
  onSelect: () => void
}

/** Carte de choix radio (adversaire, source de recherche) — état sélectionné teinté. */
export function ChoiceCard({
  icon: Icon,
  title,
  desc,
  selected,
  onSelect,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors"
      style={{
        borderColor: selected ? "var(--primary)" : "var(--border)",
        background: selected
          ? "color-mix(in srgb, var(--primary) 8%, transparent)"
          : "var(--card)",
      }}
    >
      <Icon
        size={20}
        className="mt-0.5 shrink-0"
        color={selected ? "var(--primary)" : "var(--muted-foreground)"}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {desc}
        </span>
      </span>
      <span
        aria-hidden
        className="mt-0.5 size-4 shrink-0 rounded-full border-2"
        style={{
          borderColor: selected ? "var(--primary)" : "var(--border)",
          background: selected ? "var(--primary)" : "transparent",
        }}
      />
    </button>
  )
}
