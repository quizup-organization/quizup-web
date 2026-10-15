import { useTranslation } from "react-i18next"
import {
  BADGE_FAMILIES,
  BADGE_TIERS,
  type BadgeCollection,
  type BadgeItem,
} from "../domain/progression"
import { BadgeTile } from "./BadgeTile"
import { FAMILY_KEYS } from "./labels"

interface BadgeCollectionSectionProps {
  collection: BadgeCollection
}

/**
 * Collection de badges d'un joueur : **tout** le catalogue groupé par famille (les badges
 * verrouillés montrent leur objectif, ce qui donne la marche à suivre).
 */
export function BadgeCollectionSection({
  collection,
}: BadgeCollectionSectionProps) {
  const { t } = useTranslation()
  const ordered = BADGE_FAMILIES.map((family) =>
    collection.families.find((group) => group.family === family)
  ).filter((group) => group !== undefined)

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">
          {t("progression.badgesTitle")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("progression.badgesCount", {
            earned: collection.earnedCount,
            total: collection.totalCount,
          })}
        </span>
      </div>

      <div className="space-y-5">
        {ordered.map((group) => (
          <div key={group.family} className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t(FAMILY_KEYS[group.family])}
            </h3>
            <div className="grid grid-cols-2 gap-2 tablet:grid-cols-3 desktop:grid-cols-4">
              {group.badges.map((badge) => (
                <BadgeTile
                  key={badge.code}
                  family={group.family}
                  badge={badge}
                  nextTier={nextTierOf(group.badges, badge)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Palier suivant de la **même échelle** (métrique) dans la famille, s'il existe. */
function nextTierOf(siblings: BadgeItem[], badge: BadgeItem) {
  const index = BADGE_TIERS.indexOf(badge.tier)
  const nextTier = BADGE_TIERS[index + 1]
  if (!nextTier) return null
  const next = siblings.find(
    (item) => item.metric === badge.metric && item.tier === nextTier
  )
  return next ? { tier: nextTier, label: next.label } : null
}
