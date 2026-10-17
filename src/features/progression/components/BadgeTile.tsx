import { useTranslation } from "react-i18next"
import { Check, Lock } from "lucide-react"
import { cn } from "cn"
import {
  tierColorOf,
  type BadgeFamily,
  type BadgeItem,
} from "../domain/progression"
import { BadgeMedallion } from "./BadgeMedallion"
import { badgeLabelKey, tierKeyOf } from "./labels"

interface BadgeTileProps {
  badge: BadgeItem
  /** Famille du badge (portée par le groupe) : emblème de repli de la médaille. */
  family: BadgeFamily
  /** Ouvre la fiche détaillée (critère d'obtention et progression) — sans lui, tuile inerte. */
  onOpen?: (badge: BadgeItem) => void
}

/**
 * Tuile de badge — **à plat** : aplat du palier sur la médaille, bordure simple, **aucune ombre**,
 * **fond plein** (jamais translucide). Verrouillée : disque teinté et cadenas ; acquise : disque
 * plein, fond vert `success-600` (mélangé à la surface) et coche verte — le palier garde sa couleur
 * (rareté), le vert porte l'état. **Aucune progression ici** (compteur et barre vivent dans la
 * fiche) ; le nom réserve deux lignes pour que les tuiles d'une rangée aient la même hauteur.
 */
export function BadgeTile({ badge, family, onOpen }: BadgeTileProps) {
  const { t } = useTranslation()
  const labelKey = badgeLabelKey(badge.code)
  const label = labelKey ? t(labelKey) : badge.label
  const tier = t(tierKeyOf(badge.tier))
  const tierColor = tierColorOf(badge.tier)

  const body = (
    <>
      <BadgeMedallion
        family={family}
        tier={badge.tier}
        code={badge.code}
        locked={!badge.earned}
        size={44}
      />

      <span className="line-clamp-2 min-h-8 text-xs leading-tight font-semibold">
        {label}
      </span>

      {/* État ancré au bas de la tuile : le palier (rareté, **toujours** dans sa teinte) puis
          l'icône d'état. */}
      <span className="mt-auto flex items-center justify-center gap-1.5 text-2xs">
        <span className="truncate" style={{ color: tierColor.text }}>
          {tier}
        </span>
        <span className="text-muted-foreground" aria-hidden="true">
          ·
        </span>
        {badge.earned ? (
          <Check
            className="size-3.5 shrink-0 text-success-600"
            aria-label={t("progression.badgeUnlocked")}
          />
        ) : (
          <Lock
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-label={t("progression.badgeLocked")}
          />
        )}
      </span>
    </>
  )

  const className = cn(
    "flex h-full w-full flex-col items-center gap-2 rounded-card border p-3 text-center transition-colors",
    // Fond **plein** : vert mélangé à la surface de la carte (`--card`), jamais d'alpha.
    badge.earned
      ? "border-success-600/40 bg-[color-mix(in_oklab,var(--success-600)_12%,var(--card))]"
      : "border-border bg-card",
    onOpen &&
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  )
  const ariaLabel = t("progression.badgeAria", {
    name: label,
    tier,
    progress: `${badge.progress}/${badge.target}`,
  })

  if (!onOpen) {
    return (
      <div title={label} aria-label={ariaLabel} className={className}>
        {body}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(badge)}
      title={label}
      aria-label={ariaLabel}
      className={cn(
        className,
        badge.earned
          ? "hover:border-success-600/70"
          : "hover:border-foreground/20"
      )}
    >
      {body}
    </button>
  )
}
