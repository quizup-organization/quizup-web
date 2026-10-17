import type { PendingDuel } from "../domain/pending-duel"
import { PendingDuelCard } from "./PendingDuelCard"

/**
 * Pile verticale de cartes en attente (défis envoyés, salons) — pleine largeur, actions à
 * droite à partir de la tablette. `highlightedId` cible la carte d'un défi reçu depuis un toast.
 */
export function PendingDuelList({
  items,
  highlightedId,
}: {
  items: PendingDuel[]
  highlightedId?: string | null
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <PendingDuelCard
          key={`${item.kind}-${item.id}`}
          item={item}
          highlighted={item.kind === "received" && item.id === highlightedId}
        />
      ))}
    </div>
  )
}
