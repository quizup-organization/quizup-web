import { cn } from "cn"
import {
  TIER_COLORS,
  type BadgeFamily,
  type BadgeTier,
} from "../domain/progression"
import { FAMILY_ICONS } from "./family-icon"

interface BadgeMedallionProps {
  family: BadgeFamily
  tier: BadgeTier
  /** Diamètre en pixels (défaut 40). */
  size?: number
  /** Verrouillé : disque **teinté** (aplat du palier à 15 %) et icône dans la couleur du palier. */
  locked?: boolean
  className?: string
}

/**
 * Médaille d'un badge : **aplat uni** de la couleur de son palier (bronze → diamant) portant
 * l'icône de sa **famille** — aucun dégradé, aucun halo, aucun anneau. Acquis, l'aplat est
 * **plein** (icône à l'encre du palier) ; verrouillé, il est **teinté** et l'icône prend la
 * couleur du palier : la rareté reste lisible dans les deux états. Même disque dans la
 * collection, l'aperçu et la popup de célébration.
 */
export function BadgeMedallion({
  family,
  tier,
  size = 40,
  locked = false,
  className,
}: BadgeMedallionProps) {
  const Icon = FAMILY_ICONS[family]
  const color = TIER_COLORS[tier]

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
      <Icon
        style={{
          width: size * 0.46,
          height: size * 0.46,
          color: locked ? color.fill : color.onFill,
        }}
        strokeWidth={2.2}
      />
    </span>
  )
}
