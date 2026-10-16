import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { ExpandableCard } from "@/components/arc/expandable-card/expandable-card"
import {
  badgeProgressPercent,
  TIER_METAL,
  type BadgeFamily,
  type BadgeItem,
} from "../domain/progression"
import { BadgeMedallion } from "./BadgeMedallion"
import {
  badgeLabelKey,
  METRIC_ACTION_KEYS,
  METRIC_KEYS,
  TIER_KEYS,
} from "./labels"

interface BadgeCardProps {
  badge: BadgeItem
  /** Famille du badge (portée par le groupe) : icône de la médaille. */
  family: BadgeFamily
  /** Ouverture par défaut du détail (défaut : replié). */
  defaultExpanded?: boolean
}

/**
 * Un badge de la collection, **dépliable** : replié, il porte l'essentiel (médaille, libellé,
 * palier et compteur « 7 sur 10 ») ; déplié, il montre la **condition d'obtention** et la
 * **progression** vers la cible (barre au métal du palier). Un badge acquis affiche son critère
 * et une coche — jamais de barre à 100 % inutile. Le libellé d'un code inconnu du web retombe sur
 * celui renvoyé par le serveur (aucune release nécessaire pour un nouveau badge).
 */
export function BadgeCard({
  badge,
  family,
  defaultExpanded = false,
}: BadgeCardProps) {
  const { t } = useTranslation()
  const labelKey = badgeLabelKey(badge.code)
  const label = labelKey ? t(labelKey) : badge.label
  const tier = t(TIER_KEYS[badge.tier])
  const percent = badgeProgressPercent(badge)
  const metal = TIER_METAL[badge.tier]
  const remaining = Math.max(0, badge.target - badge.progress)

  return (
    <ExpandableCard
      title={label}
      description={
        badge.earned
          ? `${tier} · ${t("progression.badgeUnlocked")}`
          : `${tier} · ${t("progression.badgeProgress", {
              progress: badge.progress,
              target: badge.target,
            })}`
      }
      media={
        <BadgeMedallion
          family={family}
          tier={badge.tier}
          locked={!badge.earned}
          size={40}
        />
      }
      defaultExpanded={defaultExpanded}
      aria-label={t("progression.badgeAria", {
        name: label,
        tier,
        progress: `${badge.progress}/${badge.target}`,
      })}
      style={
        badge.earned
          ? {
              borderColor:
                "color-mix(in oklab, var(--primary) 40%, transparent)",
              background:
                "color-mix(in oklab, var(--primary) 7%, var(--surface))",
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-2.5">
        {badge.earned ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Check className="size-3.5 shrink-0" />
            {t("progression.badgeCriteria", {
              metric: t(METRIC_KEYS[badge.metric]),
            })}
          </p>
        ) : (
          <p className="text-xs leading-relaxed">
            {t(METRIC_ACTION_KEYS[badge.metric], { count: remaining })}
          </p>
        )}

        {!badge.earned && (
          <div className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-3 text-2xs font-semibold">
              <span>
                {t("progression.badgeProgress", {
                  progress: badge.progress,
                  target: badge.target,
                })}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {percent} %
              </span>
            </span>
            <span className="block h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <span
                className="block h-full rounded-full transition-[width] duration-300"
                style={{ width: `${percent}%`, background: metal.ring }}
              />
            </span>
          </div>
        )}
      </div>
    </ExpandableCard>
  )
}
