import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import type { BadgeCollection } from "../domain/progression"
import { BadgeCard } from "./BadgeCard"

interface EarnedBadgesPreviewProps {
  /** `undefined` tant que la collection n'est pas chargée : la section est masquée. */
  collection: BadgeCollection | undefined
  onSeeAll: () => void
}

/**
 * Aperçu des badges **acquis** : les paliers verrouillés vivent dans l'onglet Badges, pas ici.
 * Même carte dépliable que la collection (cohérence de lecture) et masqué tant que la collection
 * n'est pas chargée.
 */
export function EarnedBadgesPreview({
  collection,
  onSeeAll,
}: EarnedBadgesPreviewProps) {
  const { t } = useTranslation()
  if (!collection) return null

  // La famille est portée par le groupe : on la garde pour la médaille du badge.
  const earned = collection.families.flatMap((group) =>
    group.badges
      .filter((badge) => badge.earned)
      .map((badge) => ({ badge, family: group.family }))
  )

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">
          {t("progression.badgesTitle")}
        </h2>
        <Button variant="ghost" size="sm" onClick={onSeeAll}>
          {t("progression.seeAll")}
        </Button>
      </div>

      {earned.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("progression.badgesEmpty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {earned.map(({ badge, family }) => (
            <BadgeCard key={badge.code} family={family} badge={badge} />
          ))}
        </div>
      )}
    </section>
  )
}
