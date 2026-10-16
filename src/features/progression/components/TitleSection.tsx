import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExpandableCard } from "@/components/arc/expandable-card/expandable-card"
import { TopicIcon } from "@/shared/components/topic-icon"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { useTopicName } from "@/features/shell"
import {
  titleLabel,
  topicTitleFor,
  TITLE_CARD_ACCENT,
  type PlayerTitles,
} from "../domain/progression"
import { useEquipTitle } from "../hooks/useEquipTitle"
import { GRADE_KEYS } from "./labels"

interface TitleSectionProps {
  userId: string
  titles: PlayerTitles
}

/**
 * Choix du **titre porté** : chaque titre débloqué (grade atteint dans un sujet) est une carte
 * **dépliable** — repliée, elle porte le sujet et le grade ; dépliée, la marche vers le grade
 * suivant et l'action « Afficher ce titre » / « Retirer le titre ». Les libellés sont composés
 * ici (grade traduit + nom du sujet dans la langue du joueur) — le serveur n'en fige aucun.
 */
export function TitleSection({ userId, titles }: TitleSectionProps) {
  const { t, i18n } = useTranslation()
  const resolveName = useTopicName()
  const equip = useEquipTitle(userId)

  const apply = (titleKey: string | null) => {
    equip.mutate(titleKey, {
      onSuccess: () =>
        showSuccessToast(
          titleKey === null
            ? t("progression.toasts.titleRemoved")
            : t("progression.toasts.titleEquipped")
        ),
    })
  }

  return (
    <section>
      <h2 className="font-heading text-base font-semibold">
        {t("progression.titlesTitle")}
      </h2>
      <p className="mt-1 mb-4 text-xs text-muted-foreground">
        {t("progression.titlesHint")}
      </p>

      {titles.titles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("progression.titlesEmpty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {titles.titles.map((title) => {
            const label =
              topicTitleFor(title.topic.titles, title.grade, i18n.language) ??
              titleLabel(
                t(GRADE_KEYS[title.grade]),
                resolveName(title.topic.names)
              )
            const isEquipped = title.key === titles.equippedKey
            return (
              <ExpandableCard
                key={title.key}
                title={label}
                description={
                  title.nextGrade
                    ? t("progression.titleToNextGrade", {
                        remaining: title.gradeRemainingXp,
                        grade: t(GRADE_KEYS[title.nextGrade]),
                      })
                    : t(GRADE_KEYS.LEGENDE)
                }
                media={<TopicIcon topic={title.topic} size={40} />}
                aria-label={t("progression.titleAria", {
                  label,
                  grade: t(GRADE_KEYS[title.grade]),
                })}
                style={
                  isEquipped
                    ? TITLE_CARD_ACCENT.equipped
                    : TITLE_CARD_ACCENT.unlocked
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {isEquipped ? (
                    <>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Check className="size-3.5" />
                        {t("progression.titleEquipped")}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={equip.isPending}
                        onClick={() => apply(null)}
                      >
                        {t("progression.titleRemove")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-success-600">
                        <Check className="size-3.5" />
                        {t("progression.titleUnlocked")}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={equip.isPending}
                        onClick={() => apply(title.key)}
                      >
                        {t("progression.titleEquip")}
                      </Button>
                    </>
                  )}
                </div>
              </ExpandableCard>
            )
          })}
        </div>
      )}
    </section>
  )
}
