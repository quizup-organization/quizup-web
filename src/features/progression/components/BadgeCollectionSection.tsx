import { useTranslation } from "react-i18next"
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BADGE_FAMILIES, type BadgeCollection } from "../domain/progression"
import { BadgeCard } from "./BadgeCard"
import { FAMILY_KEYS } from "./labels"

interface BadgeCollectionSectionProps {
  /** `undefined` tant que la collection n'est pas chargée : la section est masquée. */
  collection: BadgeCollection | undefined
}

/**
 * Collection de badges d'un joueur : **tout** le catalogue groupé par **familles repliables**
 * (toutes dépliées au montage — on replie pour balayer, jamais pour cacher), chaque palier étant
 * une carte **dépliable** (condition d'obtention et progression). Les badges verrouillés montrent
 * leur objectif, ce qui donne la marche à suivre.
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

      <Accordion multiple defaultValue={ordered.map((group) => group.family)}>
        {ordered.map((group) => (
          <AccordionItem key={group.family} value={group.family}>
            <AccordionTrigger>
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="font-heading text-xs font-semibold tracking-wide uppercase">
                  {t(FAMILY_KEYS[group.family])}
                </span>
                <span className="text-2xs text-muted-foreground tabular-nums">
                  {t("progression.badgesCount", {
                    earned: group.badges.filter((badge) => badge.earned).length,
                    total: group.badges.length,
                  })}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionPanel>
              <div className="flex flex-col gap-2 pt-1 pb-3">
                {group.badges.map((badge) => (
                  <BadgeCard
                    key={badge.code}
                    family={group.family}
                    badge={badge}
                  />
                ))}
              </div>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
