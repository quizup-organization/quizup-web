import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useQueries } from "@tanstack/react-query"
import { Bot, Check, Gauge, Loader2, Shuffle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Stepper } from "@/components/arc/stepper/stepper"
import { useStartMatchmaking } from "@/features/matchmaking"
import {
  topicsService,
  useTopicCategories,
  useTopicFacets,
  type TopicCard,
} from "@/features/topics"
import {
  categoryColor,
  categoryIcon,
  categoryLabel,
  categoryTextColor,
} from "@/shared/utils/categories"
import { trackProductEvent } from "@/lib/telemetry"
import { useCompleteOnboarding } from "../hooks/useCompleteOnboarding"
import { isRoomTarget, sanitizeReturnTo } from "@/lib/onboarding"

const MAX_CATEGORIES = 3
const CANDIDATE_STALE_MS = 5 * 60 * 1000

interface OnboardingFlowProps {
  returnTo?: string | null
}

/** Tir uniforme : une catégorie d'abord, puis un sujet dans cette catégorie. */
function pickRandomTopic(pools: TopicCard[][]): TopicCard | null {
  const nonEmpty = pools.filter((pool) => pool.length > 0)
  if (nonEmpty.length === 0) return null
  const pool = nonEmpty[Math.floor(Math.random() * nonEmpty.length)]
  return pool[Math.floor(Math.random() * pool.length)] ?? null
}

/** Parcours de premier compte : centres d'intérêt puis explication Elo/XP. */
export function OnboardingFlow({ returnTo }: OnboardingFlowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startMatchmaking = useStartMatchmaking()
  const completeOnboarding = useCompleteOnboarding()
  const categoriesQuery = useTopicCategories()
  const facetsQuery = useTopicFacets({})
  const [step, setStep] = useState<0 | 1>(0)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackProductEvent("onboarding_started")
  }, [])

  const countsByCategory = useMemo(
    () =>
      new Map(
        (facetsQuery.data?.categories ?? []).map((facet) => [
          facet.category,
          facet.count,
        ])
      ),
    [facetsQuery.data?.categories]
  )
  const categories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter(
        (category) => (countsByCategory.get(category.category) ?? 0) > 0
      ),
    [categoriesQuery.data, countsByCategory]
  )
  const categoriesLoading = categoriesQuery.isLoading || facetsQuery.isLoading
  const categoriesError = categoriesQuery.isError || facetsQuery.isError

  // Les sujets candidats ne sont chargés qu'à l'étape « Prêt », une petite requête par
  // catégorie (max 3) : le tirage reste local et la redirection n'attend rien au clic.
  const candidateQueries = useQueries({
    queries: selectedCategories.map((category) => ({
      queryKey: ["onboarding-topic-pool", category] as const,
      queryFn: () =>
        topicsService.list({ category, sort: "POPULAR", size: 100 }),
      enabled: step === 1,
      staleTime: CANDIDATE_STALE_MS,
    })),
  })
  const candidatePools = candidateQueries.map(
    (query) => query.data?.content ?? []
  )
  const candidatesLoading =
    step === 1 &&
    candidateQueries.some((query) => query.isLoading || query.isFetching)
  const candidatesError =
    candidateQueries.length > 0 &&
    candidateQueries.every((query) => query.isError)
  const hasCandidates = candidatePools.some((pool) => pool.length > 0)

  const target = sanitizeReturnTo(returnTo)
  const roomTarget = isRoomTarget(target)
  const hasTarget = !!target && target !== "/"
  const busy = completeOnboarding.isPending
  const atCategoryLimit = selectedCategories.length >= MAX_CATEGORIES
  const canStart = !candidatesLoading && !candidatesError && hasCandidates

  function toggleCategory(category: string) {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category)
      }
      if (current.length >= MAX_CATEGORIES) return current
      return [...current, category]
    })
  }

  async function complete(startDuel: boolean) {
    if (busy) return
    const randomTopic = startDuel ? pickRandomTopic(candidatePools) : null
    if (startDuel && !randomTopic) {
      setError(t("home.onboarding.noTopics"))
      return
    }
    setError(null)
    try {
      await completeOnboarding.mutateAsync()
    } catch {
      setError(t("home.onboarding.saveError"))
      return
    }
    trackProductEvent(
      startDuel ? "onboarding_completed" : "onboarding_skipped",
      { categories: String(selectedCategories.length) }
    )
    if (roomTarget && target) {
      void navigate(target, { replace: true })
      return
    }
    if (startDuel && randomTopic) {
      trackProductEvent("duel_start_requested", {
        mode: "public",
        first: "true",
      })
      startMatchmaking.mutate(randomTopic.topicId)
      return
    }
    void navigate(target ?? "/", { replace: true })
  }

  const steps = [
    { id: "interests", label: t("home.onboarding.steps.interests") },
    { id: "ready", label: t("home.onboarding.steps.ready") },
  ]

  const footer =
    step === 0 ? (
      <>
        <Button
          variant="ghost"
          onClick={() => void complete(false)}
          disabled={busy}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {t("home.onboarding.skip")}
        </Button>
        <Button
          disabled={selectedCategories.length === 0 || busy}
          onClick={() => setStep(1)}
        >
          {t("home.onboarding.continue")}
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" disabled={busy} onClick={() => setStep(0)}>
          {t("game.common.back")}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void complete(false)}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {roomTarget
            ? t("home.onboarding.joinRoom")
            : hasTarget
              ? t("home.onboarding.continue")
              : t("home.onboarding.explore")}
        </Button>
        {!roomTarget && (
          <Button
            disabled={busy || !canStart}
            onClick={() => void complete(true)}
          >
            {(busy || candidatesLoading) && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {candidatesLoading
              ? t("home.onboarding.loadingTopics")
              : t("home.onboarding.start")}
          </Button>
        )}
      </>
    )

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em]">
            {t("home.onboarding.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("home.onboarding.subtitle")}
          </p>
        </div>
        <Stepper
          steps={steps}
          current={step}
          orientation="horizontal"
          details="current"
          label={t("home.onboarding.stepperLabel")}
          onStepSelect={(index) => {
            if (index < step) setStep(0)
          }}
        />
      </div>

      <div className="flex flex-col gap-5">
        {step === 0 ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-semibold">
                {t("home.onboarding.interestsTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("home.onboarding.interestsSubtitle")}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("home.onboarding.selectedCategories", {
                  count: selectedCategories.length,
                })}
              </span>
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                  onClick={() => setSelectedCategories([])}
                >
                  {t("home.onboarding.clear")}
                </button>
              )}
            </div>

            {categoriesLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("common.app.loading")}
              </p>
            ) : categoriesError ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-destructive">
                  {t("home.onboarding.categoriesError")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void categoriesQuery.refetch()
                    void facetsQuery.refetch()
                  }}
                >
                  {t("home.onboarding.retry")}
                </Button>
              </div>
            ) : categories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("home.onboarding.noCategories")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 tablet-up:grid-cols-3">
                {categories.map((category) => {
                  const selected = selectedCategories.includes(
                    category.category
                  )
                  const Icon = categoryIcon(category.category)
                  const disabled = !selected && atCategoryLimit
                  return (
                    <button
                      key={category.category}
                      type="button"
                      aria-pressed={selected}
                      disabled={disabled}
                      onClick={() => toggleCategory(category.category)}
                      className={
                        selected
                          ? "relative flex min-h-28 flex-col items-start justify-between gap-3 rounded-2xl border border-primary bg-primary/5 p-4 text-left ring-1 ring-primary"
                          : "relative flex min-h-28 flex-col items-start justify-between gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-45"
                      }
                    >
                      <span
                        className="grid size-10 place-items-center rounded-xl"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${categoryColor(category.category)} 16%, transparent)`,
                          color: categoryTextColor(category.category),
                        }}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="flex w-full flex-col gap-1">
                        <span className="font-heading text-sm font-semibold">
                          {categoryLabel(category.category, category.label)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("home.onboarding.topicCount", {
                            count: countsByCategory.get(category.category) ?? 0,
                          })}
                        </span>
                      </span>
                      {selected && (
                        <span className="absolute top-4 right-4 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check
                            className="size-3"
                            strokeWidth={3}
                            aria-hidden
                          />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="font-heading text-base font-semibold">
              {t("home.onboarding.readyTitle")}
            </h2>

            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => {
                const Icon = categoryIcon(category)
                return (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold"
                    style={{ color: categoryTextColor(category) }}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {categoryLabel(category)}
                  </span>
                )
              })}
            </div>

            <div className="grid gap-3 tablet-up:grid-cols-2">
              <div className="rounded-2xl border bg-card p-4">
                <Gauge className="mb-2 size-5 text-primary" aria-hidden />
                <p className="font-heading text-sm font-bold">
                  {t("home.onboarding.eloTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("home.onboarding.eloDescription")}
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <Sparkles className="mb-2 size-5 text-primary" aria-hidden />
                <p className="font-heading text-sm font-bold">
                  {t("home.onboarding.xpTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("home.onboarding.xpDescription")}
                </p>
              </div>
            </div>

            <p className="flex items-start gap-2 rounded-2xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Shuffle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("home.onboarding.randomTopic")}
            </p>
            <p className="flex items-start gap-2 rounded-2xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Bot className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("home.onboarding.botNote")}
            </p>

            {!candidatesLoading && (!hasCandidates || candidatesError) && (
              <p className="text-sm text-destructive">
                {t("home.onboarding.noTopics")}
              </p>
            )}
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col-reverse gap-2 tablet-up:flex-row tablet-up:justify-end">
          {footer}
        </div>
      </div>
    </div>
  )
}
