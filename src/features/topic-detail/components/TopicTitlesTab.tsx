import { useTranslation } from "react-i18next"
import { Check, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExpandableCard } from "@/components/arc/expandable-card/expandable-card"

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
import { GRADE_METAL } from "@/features/progression/domain/achievement"
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
 * Onglet **Titres** d'une fiche sujet : les sept grades de maîtrise, chacun en carte
 * **dépliable** — repliée, elle porte le titre thématique du sujet, le grade et l'état
 * (débloqué / XP requise) ; dépliée, l'XP restante avant le grade suivant, la progression du
 * grade courant et l'action « Porter ce titre ». Le grade d'entrée (Novice, 0 XP) n'est un titre
 * qu'une fois le sujet **joué** (même règle que `/titles` côté BFF).
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
  // Le grade d'entrée (Novice, 0 XP) n'est un titre qu'une fois le sujet **joué**.
  const untouched = topicXp <= 0

  return (
    <PageContainer style={{ paddingTop: 16 }}>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("topic.detail.titles.subtitle")}
      </p>

      <div className="flex flex-col gap-2">
        {MASTERY_GRADES.map((grade, index) => {
          const threshold = MASTERY_GRADE_THRESHOLDS[grade]
          const unlocked = !(untouched && index === 0) && index <= currentIndex
          const current = index === currentIndex
          const key = `${topic.topicId}:${grade}`
          const equipped = equippedKey === key
          const remaining = Math.max(0, threshold - topicXp)
          const gradeColor = GRADE_METAL[grade]
          const label =
            topicTitleFor(titles ?? null, grade, i18n.language) ??
            gradeLabel(t, grade)

          return (
            <ExpandableCard
              key={grade}
              title={label}
              description={`${gradeLabel(t, grade)} · ${
                equipped
                  ? t("progression.titleEquipped")
                  : unlocked
                    ? t("progression.titleUnlocked")
                    : t("topic.detail.titles.xpRequired", {
                        xp: threshold.toLocaleString(i18n.language),
                      })
              }`}
              media={
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    !unlocked && "text-muted-foreground"
                  )}
                  style={
                    unlocked
                      ? {
                          background: `color-mix(in oklab, ${gradeColor} 18%, transparent)`,
                          color: gradeColor,
                        }
                      : { background: "var(--muted)" }
                  }
                  aria-hidden
                >
                  {unlocked ? (
                    <Check className="size-4" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                </span>
              }
              defaultExpanded={current}
              style={
                equipped
                  ? {
                      borderColor:
                        "color-mix(in oklab, var(--primary) 40%, transparent)",
                    }
                  : undefined
              }
            >
              <div className="flex flex-col gap-2.5">
                {current && progress ? (
                  <>
                    <span className="text-xs">
                      {progress.nextGrade
                        ? t("progression.titleToNextGrade", {
                            remaining: progress.gradeRemainingXp.toLocaleString(
                              i18n.language
                            ),
                            grade: gradeLabel(t, progress.nextGrade),
                          })
                        : t("topic.detail.titles.maxGrade")}
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-foreground/10">
                      <span
                        className="block h-full rounded-full transition-[width] duration-300"
                        style={{
                          width: `${progress.gradeProgressPercent}%`,
                          background: gradeColor,
                        }}
                      />
                    </span>
                  </>
                ) : (
                  <span className="text-xs">
                    {untouched && index === 0
                      ? t("topic.detail.titles.playFirst")
                      : t("topic.detail.titles.xpRequired", {
                          xp: threshold.toLocaleString(i18n.language),
                        })}
                    {!unlocked && !(untouched && index === 0)
                      ? ` · ${t("topic.detail.titles.remaining", {
                          xp: remaining.toLocaleString(i18n.language),
                        })}`
                      : ""}
                  </span>
                )}

                {unlocked &&
                  (equipped ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Check className="size-3.5" />
                      {t("progression.titleEquipped")}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="self-start"
                      disabled={equipTitle.isPending || !me.data}
                      onClick={() => equipTitle.mutate(key)}
                    >
                      {t("progression.titleEquip")}
                    </Button>
                  ))}
              </div>
            </ExpandableCard>
          )
        })}
      </div>
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
