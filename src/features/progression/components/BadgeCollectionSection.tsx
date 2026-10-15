import { useTranslation } from "react-i18next"
import { BADGE_FAMILIES, type BadgeCollection } from "../domain/progression"
import { BadgeTile } from "./BadgeTile"
import { FAMILY_KEYS } from "./labels"

interface BadgeCollectionSectionProps {
  /** `undefined` tant que la collection n'est pas chargée : la section est masquée. */
  collection: BadgeCollection | undefined
}

/**
 * Collection de badges d'un joueur : **tout** le catalogue groupé par famille (les badges
 * verrouillés montrent leur objectif, ce qui donne la marche à suivre).
 */
export function BadgeCollectionSection({
  collection,
}: BadgeCollectionSectionProps) {
  const { t } = useTranslation()
  if (!collection) return null

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
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
