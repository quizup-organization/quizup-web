import { useTranslation } from "react-i18next"
import { Check, Lock } from "lucide-react"
import { cn } from "cn"
import {
  badgeProgressPercent,
  type BadgeItem,
} from "../domain/progression"
import { badgeLabelKey, TIER_KEYS } from "./labels"

interface BadgeTileProps {
  badge: BadgeItem
}

/**
 * Un badge de la collection : acquis (palier + coche) ou verrouillé, avec sa **progression**
 * (« 7 sur 10 ») — un palier verrouillé montre l'objectif, pas seulement une case grise.
 */
export function BadgeTile({ badge }: BadgeTileProps) {
  const { t } = useTranslation()
  const labelKey = badgeLabelKey(badge.code)
  const label = labelKey ? t(labelKey) : badge.label
  const tier = t(TIER_KEYS[badge.tier])
  const percent = badgeProgressPercent(badge)

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
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full",
            badge.earned
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
          aria-hidden
        >
          {badge.earned ? (
            <Check className="size-3.5" />
          ) : (
            <Lock className="size-3" />
          )}
        </span>
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

      {!badge.earned && (
        <span className="block h-1 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-primary/60"
            style={{ width: `${percent}%` }}
          />
        </span>
      )}
    </div>
  )
}
