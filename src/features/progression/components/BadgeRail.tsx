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
 * Les paliers d'une famille : **rail horizontal** en compact (Arc `ScrollArea`, ~3 tuiles puis
 * débordement — la tuile suivante dépasse, comme les carrousels de l'Accueil) et **grille de sept
 * colonnes** dès la tablette (l'échelle des paliers visible d'un coup, sans défilement) — quatre
 * colonnes pour la famille `EXPLOIT`, qui ne porte que ses quatre faits ponctuels. Dans les deux
 * cas les tuiles s'étirent à la hauteur de la rangée.
 */
export function BadgeRail({ family, badges, onOpen, label }: BadgeRailProps) {
  const compact = useDevice() === "compact"

  if (!compact) {
    return (
      <div
        className={
          family === "EXPLOIT" ? "grid grid-cols-4 gap-2" : "grid grid-cols-7 gap-2"
        }
      >
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
        <div key={badge.code} className="w-[30vw] shrink-0">
          <BadgeTile family={family} badge={badge} onOpen={onOpen} />
        </div>
      ))}
    </ScrollArea>
  )
}
