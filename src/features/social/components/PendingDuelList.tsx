import type { PendingDuel } from "../domain/pending-duel"
import { PendingDuelCard } from "./PendingDuelCard"

/**
 * Pile verticale de cartes en attente (défis envoyés, salons) — pleine largeur, actions à
 * droite à partir de la tablette.
 */
export function PendingDuelList({ items }: { items: PendingDuel[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <PendingDuelCard key={`${item.kind}-${item.id}`} item={item} />
      ))}
    </div>
  )
}
