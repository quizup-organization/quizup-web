import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import {
  badgeProgressPercent,
  tierColorOf,
  type BadgeFamily,
  type BadgeItem,
} from "../domain/progression"
import { BadgeMedallion } from "./BadgeMedallion"
import {
  METRIC_ACTION_KEYS,
  ONE_SHOT_CONDITION_KEYS,
  tierKeyOf,
} from "./labels"
interface BadgeDetailProps {
  badge: BadgeItem
  family: BadgeFamily
}

/**
 * Fiche détaillée d'un badge (corps de la modal) : médaille, **critère d'obtention chiffré** —
 * ce qu'il reste à faire tant que le palier est verrouillé, le seuil du palier une fois acquis —
 * et progression (barre au aplat du palier). Le critère n'est jamais réduit à l'intitulé du
 * compteur.
 */
export function BadgeDetail({ badge, family }: BadgeDetailProps) {
  const { t } = useTranslation()
  const tier = t(tierKeyOf(badge.tier))
  const percent = badgeProgressPercent(badge)
  const color = tierColorOf(badge.tier)
  const remaining = Math.max(0, badge.target - badge.progress)

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <BadgeMedallion
        family={family}
        tier={badge.tier}
        code={badge.code}
        locked={!badge.earned}
        className="w-24"
      />

      <p className="flex max-w-[36ch] items-start gap-1.5 text-sm leading-relaxed">
        {badge.earned && (
          <Check className="mt-0.5 size-4 shrink-0 text-success-600" />
        )}
        <span>
          {ONE_SHOT_CONDITION_KEYS[badge.code]
            ? t(ONE_SHOT_CONDITION_KEYS[badge.code])
            : t(METRIC_ACTION_KEYS[badge.metric], {
                count: badge.earned ? badge.target : remaining,
              })}
        </span>
      </p>

      {badge.earned ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          {/* Le palier **garde sa teinte** ; seul l'état (« Débloqué », coche) est vert. */}
          <span style={{ color: color.text }}>{tier}</span>
          <span className="text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <span className="text-success-600">
            {t("progression.badgeUnlocked")}
          </span>
        </p>
      ) : (
        <div className="flex w-full flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3 text-xs font-semibold">
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
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <span
              className="block h-full rounded-full"
              style={{ width: `${percent}%`, background: color.fill }}
            />
          </span>
        </div>
      )}
    </div>
  )
}
