import { useTranslation } from "react-i18next"
import { Check, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

import { getSessionUserId } from "@/features/auth"
import { PageContainer, useMe } from "@/features/shell"
import type { TranslationKey } from "@/lib/i18n/types"
import { useEquipTitle } from "@/features/progression"
import {
  MASTERY_GRADES,
  MASTERY_GRADE_THRESHOLDS,
  topicTitleFor,
  type MasteryGrade,
} from "@/features/progression/domain/progression"
import type { TopicCard } from "@/features/topics/domain/topic"
import { cn } from "cn"

interface TopicTitlesTabProps {
  topic: TopicCard | undefined
  /** Titres thématiques par langue puis grade (`TopicOverviewView.titles`). */
  titles: Record<string, Record<string, string>> | null | undefined
  /** Maîtrise du sujet pour le joueur courant (`TopicOverviewView.myProgress`). */
  progress: {
    xp: number
    grade: string
    gradeProgressPercent: number
    gradeRemainingXp: number
    nextGrade: string | null
  } | null
  /** Clé du titre porté (`topicId:GRADE`), `null` si aucun. */
  equippedKey: string | null
}

/**
 * Onglet **Titres** d'une fiche sujet : les sept grades de maîtrise, avec le **titre thématique**
 * du sujet pour chacun, l'XP requise, l'état débloqué/verrouillé et l'action « Porter ce titre ».
 * Le grade courant porte sa progression (« plus que 240 XP avant Expert »).
 */
export function TopicTitlesTab({
  topic,
  titles,
  progress,
  equippedKey,
}: TopicTitlesTabProps) {
  const { t, i18n } = useTranslation()
  const me = useMe()
  const userId = getSessionUserId() ?? ""
  const equipTitle = useEquipTitle(userId)

  if (!topic) {
    return null
  }

  const currentIndex = progress
    ? MASTERY_GRADES.indexOf(progress.grade as MasteryGrade)
    : -1
  const topicXp = progress?.xp ?? 0

  return (
    <PageContainer style={{ paddingTop: 16 }}>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("topic.detail.titles.subtitle")}
      </p>

      <ul className="flex flex-col gap-2">
        {MASTERY_GRADES.map((grade, index) => {
          const threshold = MASTERY_GRADE_THRESHOLDS[grade]
          const unlocked = index <= currentIndex
          const current = index === currentIndex
          const key = `${topic.topicId}:${grade}`
          const equipped = equippedKey === key
          const remaining = Math.max(0, threshold - topicXp)

          return (
            <li
              key={grade}
              className={cn(
                "flex flex-col gap-1.5 rounded-xl border p-3",
                unlocked ? "border-primary/30 bg-primary/5" : "border-border"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full",
                    unlocked
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {unlocked ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Lock className="size-3" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {topicTitleFor(titles ?? null, grade, i18n.language) ??
                    gradeLabel(t, grade)}
                </span>
                <span className="shrink-0 text-2xs text-muted-foreground">
                  {t("topic.detail.titles.xpRequired", {
                    xp: threshold.toLocaleString(i18n.language),
                  })}
                </span>
              </div>

              {current && progress && (
                <>
                  <span className="text-2xs text-muted-foreground">
                    {progress.nextGrade
                      ? t("progression.titleToNextGrade", {
                          remaining: progress.gradeRemainingXp.toLocaleString(
                            i18n.language
                          ),
                          grade: gradeLabel(t, progress.nextGrade),
                        })
                      : t("topic.detail.titles.maxGrade")}
                  </span>
                  <span className="block h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary/70"
                      style={{ width: `${progress.gradeProgressPercent}%` }}
                    />
                  </span>
                </>
              )}

              {!unlocked && !current && (
                <span className="text-2xs text-muted-foreground">
                  {t("topic.detail.titles.remaining", {
                    xp: remaining.toLocaleString(i18n.language),
                  })}
                </span>
              )}

              {unlocked && !equipped && (
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start"
                  disabled={equipTitle.isPending || !me.data}
                  onClick={() => equipTitle.mutate(key)}
                >
                  {t("progression.titleEquip")}
                </Button>
              )}
              {equipped && (
                <span className="text-2xs font-semibold text-primary">
                  {t("progression.titleEquipped")}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </PageContainer>
  )
}

/** Libellé traduit d'un grade de maîtrise (`progression.grade.*`). */
function gradeLabel(
  t: (key: TranslationKey) => string,
  grade: string | null
): string {
  return grade ? t(`progression.grade.${grade}` as TranslationKey) : ""
}
