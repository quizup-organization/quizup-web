import { cn } from "cn"
import {
  TIER_METAL,
  type BadgeFamily,
  type BadgeTier,
} from "../domain/progression"
import { FAMILY_ICONS } from "./family-icon"

interface BadgeMedallionProps {
  family: BadgeFamily
  tier: BadgeTier
  /** Diamètre en pixels (défaut 40). */
  size?: number
  /** Verrouillé : métal **désaturé** et disque atténué, sans halo. */
  locked?: boolean
  className?: string
}

/**
 * Médaille d'un badge : disque au **métal du palier** (bronze → diamant) portant l'icône de sa
 * **famille**, avec un reflet haut et un anneau. Acquis, le métal est pleinement saturé et
 * auréolé ; verrouillé, il est **désaturé** (l'état se lit sans lire le libellé). Même visuel
 * dans la collection, l'aperçu et la popup de célébration.
 */
export function BadgeMedallion({
  family,
  tier,
  size = 40,
  locked = false,
  className,
}: BadgeMedallionProps) {
  const Icon = FAMILY_ICONS[family]
  const metal = TIER_METAL[tier]

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 50% 26%, ${metal.highlight}55, ${metal.base})`,
        boxShadow: locked
          ? `inset 0 0 0 2px ${metal.ring}44`
          : `inset 0 0 0 2px ${metal.ring}, inset 0 1px 1px ${metal.highlight}66, 0 0 ${size / 2.5}px ${metal.ring}66`,
        filter: locked ? "grayscale(.85) brightness(.92)" : undefined,
        opacity: locked ? 0.7 : 1,
      }}
      aria-hidden
    >
      <Icon
        style={{
          width: size * 0.46,
          height: size * 0.46,
          color: metal.highlight,
        }}
        strokeWidth={2.2}
      />
    </span>
  )
}
