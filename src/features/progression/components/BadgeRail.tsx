import { ScrollArea } from "@/components/arc/scroll-area/scroll-area"
import { useDevice } from "@/shared/hooks/use-device"
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
 * Les paliers d'une famille sont des **cartes carrées à taille fixe** (132 px, `BadgeTile`) :
 * **rail horizontal** en compact (Arc `ScrollArea`, ~2,5 tuiles puis débordement — la tuile
 * suivante dépasse, comme les carrousels de l'Accueil) et **flex-wrap** dès la tablette (sept
 * cartes par rangée quand la place le permet, retour à la ligne sinon). `EXPLOIT` n'a que quatre
 * paliers mais garde exactement la même taille de carte que les autres.
 */
export function BadgeRail({ family, badges, onOpen, label }: BadgeRailProps) {
  const compact = useDevice() === "compact"

  if (!compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <BadgeTile
            key={badge.code}
            family={family}
            badge={badge}
            onOpen={onOpen}
          />
        ))}
      </div>
    )
  }

  return (
    <ScrollArea
      orientation="horizontal"
      label={label}
      viewportClassName="flex items-stretch gap-2 pb-1"
    >
      {badges.map((badge) => (
        <div key={badge.code} className="shrink-0">
          <BadgeTile family={family} badge={badge} onOpen={onOpen} />
        </div>
      ))}
    </ScrollArea>
  )
}
