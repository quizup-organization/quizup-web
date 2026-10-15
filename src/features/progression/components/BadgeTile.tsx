import { useTranslation } from "react-i18next"
import { cn } from "cn"
import {
  badgeProgressPercent,
  TIER_METAL,
  type BadgeFamily,
  type BadgeItem,
  type BadgeTier,
} from "../domain/progression"
import { BadgeMedallion } from "./BadgeMedallion"
import {
  badgeLabelKey,
  METRIC_ACTION_KEYS,
  METRIC_KEYS,
  TIER_KEYS,
} from "./labels"

interface BadgeTileProps {
  badge: BadgeItem
  /** Famille du badge (portée par le groupe) : icône de la médaille. */
  family: BadgeFamily
  /** Palier suivant de la même échelle (famille × métrique), s'il existe. */
  nextTier?: { tier: BadgeTier; label: string } | null
}

/**
 * Un badge de la collection : acquis (palier + coche) ou verrouillé, avec sa **progression**
 * (« 7 sur 10 ») — un palier verrouillé montre l'objectif, pas seulement une case grise.
 */
export function BadgeTile({ badge, family, nextTier = null }: BadgeTileProps) {
  const { t } = useTranslation()
  const labelKey = badgeLabelKey(badge.code)
  const label = labelKey ? t(labelKey) : badge.label
  const tier = t(TIER_KEYS[badge.tier])
  const percent = badgeProgressPercent(badge)
  const metal = TIER_METAL[badge.tier]
  const remaining = Math.max(0, badge.target - badge.progress)

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border p-2.5",
        badge.earned ? "border-primary/30 bg-primary/5" : "border-border"
      )}
      aria-label={t("progression.badgeAria", {
        name: label,
        tier,
        progress: `${badge.progress}/${badge.target}`,
      })}
    >
      <div className="flex items-center gap-2">
        <BadgeMedallion
          family={family}
          tier={badge.tier}
          locked={!badge.earned}
          size={28}
        />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
          {label}
        </span>
      </div>

      <span className="text-2xs text-muted-foreground">
        {badge.earned
          ? `${tier} · ${t("progression.badgeUnlocked")}`
          : `${tier} · ${t("progression.badgeProgress", {
              progress: badge.progress,
              target: badge.target,
            })}`}
      </span>

      {/* Acquisition explicite : ce qui est mesuré, combien il reste, quoi faire. */}
      <span className="text-2xs text-muted-foreground/80">
        {t(METRIC_KEYS[badge.metric])}
      </span>

      {!badge.earned && badge.metric !== "ONE_SHOT" && (
        <>
          <span
            className="text-2xs font-semibold"
            style={{ color: metal.ring }}
          >
            {t("progression.remaining", { count: remaining })}
          </span>
          <span className="text-2xs leading-snug text-muted-foreground">
            {t(METRIC_ACTION_KEYS[badge.metric], { count: remaining })}
          </span>
        </>
      )}

      <span className="text-2xs text-muted-foreground/80">
        {nextTier
          ? t("progression.nextTier", {
              tier: t(TIER_KEYS[nextTier.tier]),
              name: nextTier.label,
            })
          : t("progression.topTier")}
      </span>

      {!badge.earned && (
        <span className="block h-1 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full"
            style={{ width: `${percent}%`, background: metal.ring }}
          />
        </span>
      )}
    </div>
  )
}
