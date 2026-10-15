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
  /** Verrouillé : disque atténué, sans halo (la cible reste lisible à côté). */
  locked?: boolean
  className?: string
}

/**
 * Médaille d'un badge : disque au **métal du palier** (bronze → diamant) portant l'icône de sa
 * **famille**. Même visuel dans la collection et dans la popup de célébration.
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
        background: `radial-gradient(circle at 50% 28%, ${metal.highlight}2e, ${metal.base})`,
        boxShadow: locked
          ? `inset 0 0 0 2px ${metal.ring}55`
          : `inset 0 0 0 2px ${metal.ring}, 0 0 ${size / 3}px ${metal.ring}66`,
        opacity: locked ? 0.6 : 1,
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
