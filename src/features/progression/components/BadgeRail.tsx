import { ScrollArea } from "@/components/arc/scroll-area/scroll-area"
import type { BadgeFamily, BadgeItem } from "../domain/progression"
import { BadgeTile } from "./BadgeTile"

interface BadgeRailProps {
  family: BadgeFamily
  /** Paliers de la famille, du plus modeste au plus rare. */
  badges: BadgeItem[]
  onOpen: (badge: BadgeItem) => void
  /** Nom accessible du rail (une région par famille). */
  label: string
}

/**
 * Les paliers d'une famille sont des **cartes carrées à taille fixe** (156 px, `BadgeTile`) dans
 * un **rail horizontal à toutes les tailles**, comme les carrousels de l'Accueil : Arc
 * `ScrollArea` (barre fine en surimpression, fondus d'extrémité ; la molette verticale fait
 * défiler la page). Le `pb-3` réserve la hauteur de la barre (11 px) sous les tuiles : elle ne
 * recouvre jamais leur pied (palier + état). `EXPLOIT` n'a que quatre paliers mais garde
 * exactement la même taille de carte que les autres.
 */
export function BadgeRail({ family, badges, onOpen, label }: BadgeRailProps) {
  return (
    <ScrollArea
      orientation="horizontal"
      label={label}
      viewportClassName="flex gap-2 pb-3"
    >
      {badges.map((badge) => (
        <div key={badge.code} className="shrink-0">
          <BadgeTile family={family} badge={badge} onOpen={onOpen} />
        </div>
      ))}
    </ScrollArea>
  )
}
