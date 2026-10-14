import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { TopicIcon } from "@/shared/components/topic-icon"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { useTopicName } from "@/features/shell"
import { titleLabel, type PlayerTitles } from "../domain/progression"
import { useEquipTitle } from "../hooks/useEquipTitle"
import { GRADE_KEYS } from "./labels"

interface TitleSectionProps {
  userId: string
  titles: PlayerTitles
}

/**
 * Choix du **titre porté** : parmi les titres débloqués (grade atteint dans un sujet), le joueur
 * désigne celui qu'il affiche. Cliquer sur le titre affiché le retire. Les libellés sont composés
 * ici (grade traduit + nom du sujet dans la langue du joueur) — le serveur n'en fige aucun.
 */
export function TitleSection({ userId, titles }: TitleSectionProps) {
  const { t } = useTranslation()
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
        <ul className="space-y-2">
          {titles.titles.map((title) => {
            const label = titleLabel(
              t(GRADE_KEYS[title.grade]),
              resolveName(title.topic.names)
            )
            const isEquipped = title.key === titles.equippedKey
            return (
              <li key={title.key}>
                <button
                  type="button"
                  aria-pressed={isEquipped}
                  disabled={equip.isPending}
                  onClick={() => apply(isEquipped ? null : title.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    isEquipped
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <TopicIcon topic={title.topic} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {label}
                    </span>
                    <span className="block text-2xs text-muted-foreground">
                      {title.nextGrade
                        ? t("progression.titleToNextGrade", {
                            remaining: title.gradeRemainingXp,
                            grade: t(GRADE_KEYS[title.nextGrade]),
                          })
                        : t(GRADE_KEYS.LEGENDE)}
                    </span>
                  </span>
                  {isEquipped && (
                    <span className="flex shrink-0 items-center gap-1 text-2xs font-semibold text-primary">
                      <Check className="size-3.5" />
                      {t("progression.titleEquipped")}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {titles.equippedKey && (
        <Button
          variant="ghost"
          className="mt-3"
          disabled={equip.isPending}
          onClick={() => apply(null)}
        >
          {t("progression.titleRemove")}
        </Button>
      )}
    </section>
  )
}
