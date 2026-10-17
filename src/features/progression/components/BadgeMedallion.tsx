import { createElement } from "react"
import { cn } from "cn"
import {
  tierColorOf,
  type BadgeFamily,
  type BadgeTier,
} from "../domain/progression"
import { badgeIcon } from "./family-icon"

interface BadgeMedallionProps {
  family: BadgeFamily
  tier: BadgeTier
  /** Code du badge : les exploits ponctuels portent leur **propre** emblème. */
  code?: string
  /** Diamètre en pixels (défaut 40). */
  size?: number
  /** Verrouillé : disque **teinté** (aplat du palier à 15 %) et icône dans la couleur du palier. */
  locked?: boolean
  className?: string
}

/**
 * Médaille d'un badge : **aplat uni** de la couleur de son palier (bronze → diamant) portant
 * l'emblème de son **échelle** (famille, ou exploit pour un fait ponctuel) — aucun dégradé, aucun
 * halo, aucun anneau, aucun fond translucide. Acquis, l'aplat est **plein** (icône à l'encre du
 * palier) ; verrouillé, il est **teinté** et l'icône prend la couleur du palier : la rareté reste
 * lisible dans les deux états.
 */
export function BadgeMedallion({
  family,
  tier,
  code,
  size = 40,
  locked = false,
  className,
}: BadgeMedallionProps) {
  const icon = badgeIcon(code ?? "", family)
  const color = tierColorOf(tier)

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full",
        className
      )}
      style={{
        width: size,
        height: size,
        background: locked ? color.soft : color.fill,
      }}
      aria-hidden
    >
      {createElement(icon, {
        style: {
          width: size * 0.46,
          height: size * 0.46,
          color: locked ? color.fill : color.onFill,
        },
        strokeWidth: 2.2,
      })}
    </span>
  )
}
