import { useTranslation } from "react-i18next"
import { Crown, Sparkles, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSessionUserId } from "@/features/auth"
import { useTopicOverview } from "@/features/topic-detail"
import { useTopicName } from "@/features/shell"
import { cn } from "cn"
import {
  BADGE_TIERS,
  TIER_METAL,
  type BadgeTier,
  type MasteryGrade,
} from "../domain/progression"
import type { Achievement } from "../domain/achievement"
import { GRADE_METAL } from "../domain/achievement"
import { useAchievementStore } from "../stores/useAchievementStore"
import { useEquipTitle } from "../hooks/useEquipTitle"
import type { TranslationKey } from "@/lib/i18n/types"
import { BadgeMedallion } from "./BadgeMedallion"
import { badgeLabelKey, GRADE_KEYS, TIER_KEYS } from "./labels"

/** Palier suivant d'une échelle, déduit du code du badge (`DUELIST_ARGENT` → `DUELIST_OR`). */
function nextTierOf(
  code: string | null | undefined,
  tier: BadgeTier | null | undefined
) {
  if (!code || !tier) return null
  const suffix = `_${tier}`
  if (!code.endsWith(suffix)) return null
  const index = BADGE_TIERS.indexOf(tier)
  const next = BADGE_TIERS[index + 1]
  return next
    ? { tier: next, code: `${code.slice(0, -suffix.length)}_${next}` }
    : null
}

/**
 * **Célébration d'un déblocage** (à l'image de la maquette « ACHIEVEMENT ») : médaille, nom,
 * phrase explicative et actions. Affichée par-dessus la page courante — jamais sur un écran
 * immersif (la file attend la sortie, par exemple l'écran de résultat). Un déblocage à la fois,
 * le compteur indique ceux qui suivent.
 */
export function AchievementCelebration({
  achievement,
}: {
  achievement: Achievement
}) {
  const { t } = useTranslation()
  const dismiss = useAchievementStore((state) => state.dismiss)
  const remaining = useAchievementStore((state) => state.queue.length)
  const userId = getSessionUserId() ?? ""
  const equipTitle = useEquipTitle(userId)

  const topicQuery = useTopicOverview(
    achievement.kind === "TITLE" ? (achievement.topicId ?? "") : ""
  )
  const resolveName = useTopicName()

  const grade = achievement.grade ?? "NOVICE"
  const gradeLabel = t(GRADE_KEYS[grade])

  const titleKey =
    achievement.kind === "TITLE" && achievement.topicId && achievement.grade
      ? `${achievement.topicId}:${achievement.grade}`
      : null

  // Libellé : traduction connue du catalogue, sinon libellé renvoyé par le serveur.
  const badgeKey = badgeLabelKey(achievement.code ?? "")
  const badgeLabel = badgeKey
    ? t(badgeKey)
    : (achievement.label ?? t("progression.achievement.badgeFallback"))

  const next =
    achievement.kind === "BADGE"
      ? nextTierOf(achievement.code, achievement.tier)
      : null
  const nextKey =
    next && badgeKey
      ? (badgeKey.replace(/_[A-Z]+$/, `_${next.tier}`) as TranslationKey)
      : undefined
  const nextLabel = nextKey ? t(nextKey) : null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("progression.achievement.heading")}
    >
      <div className="qu-pop flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border bg-background p-5 text-center shadow-2xl">
        <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
          {t("progression.achievement.heading")}
        </p>

        {achievement.kind === "BADGE" &&
          achievement.family &&
          achievement.tier && (
            <BadgeMedallion
              family={achievement.family}
              tier={achievement.tier}
              size={92}
            />
          )}
        {achievement.kind === "TITLE" && (
          <MedallionDisc
            color={GRADE_METAL[(achievement.grade ?? "NOVICE") as MasteryGrade]}
          >
            <Crown className="size-10" />
          </MedallionDisc>
        )}
        {achievement.kind === "LEVEL" && (
          <MedallionDisc color={TIER_METAL.OR.ring}>
            <Trophy className="size-10" />
          </MedallionDisc>
        )}

        <h2 className="font-heading text-xl font-bold">
          {achievement.kind === "BADGE" && badgeLabel}
          {achievement.kind === "TITLE" &&
            t("progression.achievement.titleName", {
              grade: gradeLabel,
            })}
          {achievement.kind === "LEVEL" &&
            t("progression.achievement.levelName", {
              level: achievement.level ?? 0,
            })}
        </h2>

        <p className="text-sm leading-snug text-muted-foreground">
          {achievement.kind === "BADGE" &&
            t("progression.achievement.badgeBody", {
              tier: t(TIER_KEYS[achievement.tier ?? "BRONZE"]),
              next: next
                ? t("progression.achievement.nextTier", {
                    tier: t(TIER_KEYS[next.tier]),
                    name: nextLabel ?? "",
                  })
                : t("progression.achievement.maxTier"),
            })}
          {achievement.kind === "TITLE" &&
            t("progression.achievement.titleBody", {
              topic: resolveName(
                topicQuery.data?.topic.names,
                t("progression.achievement.topicFallback")
              ),
            })}
          {achievement.kind === "LEVEL" &&
            t("progression.achievement.levelBody", {
              title: achievement.accountTitle ?? "",
            })}
        </p>

        {achievement.kind === "TITLE" && titleKey && (
          <Button
            className="w-full"
            disabled={equipTitle.isPending}
            onClick={() =>
              equipTitle.mutate(titleKey, { onSuccess: () => dismiss() })
            }
          >
            <Sparkles /> {t("progression.achievement.equipTitle")}
          </Button>
        )}

        <div className="flex w-full flex-col gap-2">
          <Button variant="ghost" className="w-full" onClick={dismiss}>
            {achievement.kind === "TITLE"
              ? t("progression.achievement.later")
              : t("progression.achievement.close")}
          </Button>
        </div>

        {remaining > 1 && (
          <p className="text-2xs text-muted-foreground">
            {t("progression.achievement.queue", {
              position: 1,
              total: remaining,
            })}
          </p>
        )}
      </div>
    </div>
  )
}

/** Disque de médaille générique (titre, niveau) au métal/grade indiqué. */
function MedallionDisc({
  color,
  children,
}: {
  color: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn("grid size-[92px] place-items-center rounded-full")}
      style={{
        background: `radial-gradient(circle at 50% 28%, ${color}2e, ${color})`,
        boxShadow: `inset 0 0 0 2px ${color}, 0 0 30px ${color}66`,
        color: "var(--background)",
      }}
      aria-hidden
    >
      {children}
    </span>
  )
}
