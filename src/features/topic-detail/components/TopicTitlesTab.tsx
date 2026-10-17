import { useTranslation } from "react-i18next"
import { Check, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExpandableCard } from "@/components/arc/expandable-card/expandable-card"

import { getSessionUserId } from "@/features/auth"
import { PageContainer, useMe } from "@/features/shell"
import { showSuccessToast } from "@/shared/utils/success-toast"
import type { TranslationKey } from "@/lib/i18n/types"
import { useEquipTitle } from "@/features/progression"
import {
  MASTERY_GRADES,
  MASTERY_GRADE_THRESHOLDS,
  TIER_COLORS,
  TITLE_CARD_ACCENT,
  TITLE_RANK_BY_GRADE,
  titleProgressPercent,
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
    /** Parties humaines terminées (abandon inclus) — condition du titre Fer. */
    games: number
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
 * **dépliable** — repliée, elle ne porte que le titre thématique du sujet et sa **pastille
 * d'état** (disque vert à coche blanche pour un grade atteint, rond neutre à cadenas sinon),
 * **aucune info d'XP** ; dépliée, le critère et la progression chiffrée (`XP / seuil`, pourcentage,
 * barre à la couleur du rang) — marche vers le grade suivant pour le grade courant, seuil du grade
 * pour les grades verrouillés, **sauf le titre Fer** dont le déblocage ne dépend pas de l'XP —
 * puis l'action « Utiliser ce titre ». Le grade d'entrée (Novice,
 * 0 XP) n'est un titre qu'après une **partie humaine terminée** dans le sujet (abandon inclus ;
 * même règle que `/titles` côté BFF). Une fois Fer acquis, sa carte affiche sa propre condition
 * et non plus la marche vers Bronze.
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

  const topicXp = progress?.xp ?? 0
  const humanGames = progress?.games ?? 0
  const hasHumanGame = humanGames > 0
  const currentIndex =
    hasHumanGame && progress
      ? MASTERY_GRADES.indexOf(progress.grade as MasteryGrade)
      : -1
  // Le titre Fer (grade d'entrée) n'est débloqué qu'après une partie humaine terminée
  // (abandon inclus) — un duel bot, à 0 XP, ne débloque rien.
  const untouched = !hasHumanGame

  return (
    <PageContainer style={{ paddingTop: 16 }}>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("topic.detail.titles.subtitle")}
      </p>

      <div className="flex flex-col gap-2">
        {MASTERY_GRADES.map((grade, index) => {
          const threshold = MASTERY_GRADE_THRESHOLDS[grade]
          const isEntryTitle = index === 0
          const unlocked = hasHumanGame && index <= currentIndex
          const current = index === currentIndex
          const key = `${topic.topicId}:${grade}`
          const equipped = equippedKey === key
          const remaining = Math.max(0, threshold - topicXp)
          const rank = TITLE_RANK_BY_GRADE[grade]
          const rankColor = TIER_COLORS[rank]
          const label =
            topicTitleFor(titles ?? null, grade, i18n.language) ??
            gradeLabel(t, grade)

          // Cible de la barre : le grade suivant pour le grade courant, le seuil du grade sinon.
          // Le titre Fer se débloque par une partie humaine, pas par l'XP : aucune barre.
          const nextThreshold =
            current && progress?.nextGrade
              ? MASTERY_GRADE_THRESHOLDS[progress.nextGrade as MasteryGrade]
              : null
          const progressTarget = isEntryTitle
            ? null
            : current
              ? nextThreshold
              : threshold
          const showProgress =
            progressTarget !== null &&
            (current ? nextThreshold !== null : !unlocked)
          const percent =
            showProgress && progressTarget !== null
              ? titleProgressPercent(topicXp, progressTarget)
              : null

          const criterion =
            untouched && isEntryTitle
              ? t("topic.detail.titles.playFirst")
              : current && progress
                ? isEntryTitle
                  ? t("topic.detail.titles.unlockedByGame")
                  : progress.nextGrade
                    ? t("progression.titleToNextGrade", {
                        remaining: progress.gradeRemainingXp.toLocaleString(
                          i18n.language
                        ),
                        grade: gradeLabel(t, progress.nextGrade),
                      })
                    : t("topic.detail.titles.maxGrade")
                : !unlocked
                  ? t("topic.detail.titles.remaining", {
                      xp: remaining.toLocaleString(i18n.language),
                    })
                  : null

          return (
            <ExpandableCard
              key={grade}
              title={label}
              media={
                /* Pastille d'état : disque vert à coche blanche pour un grade **atteint**, rond
                   neutre à cadenas sinon — toute l'XP vit dans le panneau déplié. Un point de
                   rang (Fer → Diamant) rappelle la rareté du titre sur la carte repliée. */
                <span className="relative shrink-0">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-full",
                      !unlocked && "text-muted-foreground"
                    )}
                    style={
                      unlocked
                        ? TITLE_CARD_ACCENT.acquiredCheck
                        : { background: "var(--muted)" }
                    }
                    aria-hidden
                  >
                    {unlocked ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : (
                      <Lock className="size-4" />
                    )}
                  </span>
                  <span
                    className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card"
                    style={{ background: rankColor.fill }}
                    aria-hidden
                  />
                </span>
              }
              defaultExpanded={current}
              style={
                equipped
                  ? TITLE_CARD_ACCENT.equipped
                  : unlocked
                    ? TITLE_CARD_ACCENT.unlocked
                    : undefined
              }
            >
              <div className="flex flex-col gap-2.5">
                {criterion && (
                  <p className="text-sm leading-relaxed">{criterion}</p>
                )}

                {percent !== null && progressTarget !== null && (
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-3 text-xs font-semibold">
                      <span>
                        {t("topic.detail.titles.xpProgress", {
                          progress: topicXp.toLocaleString(i18n.language),
                          target: progressTarget.toLocaleString(i18n.language),
                        })}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {t("topic.detail.titles.percent", { percent })}
                      </span>
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-foreground/10">
                      <span
                        className="block h-full rounded-full transition-[width] duration-300"
                        style={{
                          width: `${percent}%`,
                          background: rankColor.fill,
                        }}
                      />
                    </span>
                  </div>
                )}

                {unlocked &&
                  (equipped ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Check className="size-3.5" />
                      {t("progression.titleEquipped")}
                    </span>
                  ) : (
                    <span className="flex flex-col items-start gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-success-600">
                        <Check className="size-3.5" />
                        {t("progression.titleUnlocked")}
                      </span>
                      <Button
                        size="sm"
                        disabled={equipTitle.isPending || !me.data}
                        onClick={() =>
                          equipTitle.mutate(key, {
                            onSuccess: () =>
                              showSuccessToast(
                                t("progression.toasts.titleEquipped")
                              ),
                          })
                        }
                      >
                        {t("progression.titleEquip")}
                      </Button>
                    </span>
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
