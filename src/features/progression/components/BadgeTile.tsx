import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { cn } from "cn"
import {
  badgeProgressPercent,
  TIER_COLORS,
  type BadgeFamily,
  type BadgeItem,
} from "../domain/progression"
import { BadgeMedallion } from "./BadgeMedallion"
import { badgeLabelKey, TIER_KEYS } from "./labels"

interface BadgeTileProps {
  badge: BadgeItem
  /** Famille du badge (portée par le groupe) : icône de la médaille. */
  family: BadgeFamily
  /** Ouvre la fiche détaillée (critère d'obtention et progression) — sans lui, tuile inerte. */
  onOpen?: (badge: BadgeItem) => void
}

/**
 * Tuile de badge — **à plat** : aplat du palier sur la médaille, bordure simple, **aucune ombre**.
 * Verrouillée : disque teinté, barre de progression au aplat du palier. Acquise : disque plein et
 * accent **vert** (`success-600`) sur la bordure et le fond, coche et « Débloqué » verts — le
 * palier garde sa couleur (rareté), le vert porte l'état. Le nom réserve deux lignes pour que
 * toutes les tuiles d'une rangée aient la même hauteur.
 */
export function BadgeTile({ badge, family, onOpen }: BadgeTileProps) {
  const { t } = useTranslation()
  const labelKey = badgeLabelKey(badge.code)
  const label = labelKey ? t(labelKey) : badge.label
  const tier = t(TIER_KEYS[badge.tier])
  const percent = badgeProgressPercent(badge)
  const color = TIER_COLORS[badge.tier]

  const body = (
    <>
      <BadgeMedallion
        family={family}
        tier={badge.tier}
        locked={!badge.earned}
        size={44}
      />

      <span className="line-clamp-2 min-h-8 text-xs leading-tight font-semibold">
        {label}
      </span>

      {/* État ancré au bas de la tuile : les rangées restent alignées quelle que soit la longueur
          du libellé. */}
      <span className="mt-auto flex w-full flex-col gap-1.5">
        <span className="flex items-center justify-center gap-1 text-2xs">
          {badge.earned && (
            <Check className="size-3 shrink-0 text-success-600" />
          )}
          <span className="truncate text-muted-foreground">{tier}</span>
          <span className="text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <span
            className={cn(
              "truncate",
              badge.earned
                ? "font-semibold text-success-600"
                : "text-muted-foreground"
            )}
          >
            {badge.earned
              ? t("progression.badgeUnlocked")
              : t("progression.badgeProgress", {
                  progress: badge.progress,
                  target: badge.target,
                })}
          </span>
        </span>

        {!badge.earned && (
          <span className="block h-1 w-full overflow-hidden rounded-full bg-foreground/10">
            <span
              className="block h-full rounded-full"
              style={{ width: `${percent}%`, background: color.fill }}
            />
          </span>
        )}
      </span>
    </>
  )

  const className = cn(
    "flex h-full w-full flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-colors",
    badge.earned
      ? "border-success-600/40 bg-success-600/8"
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
