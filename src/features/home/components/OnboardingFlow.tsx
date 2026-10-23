import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Bot, Check, Gauge, Loader2, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TopicIcon } from "@/shared/components/topic-icon"
import { useTopicName } from "@/features/shell"
import { useStartMatchmaking } from "@/features/matchmaking"
import { topicsService, type TopicCard } from "@/features/topics"
import { queryKeys } from "@/lib/query-keys"
import { trackProductEvent } from "@/lib/telemetry"
import { useCompleteOnboarding } from "../hooks/useCompleteOnboarding"
import { isRoomTarget, sanitizeReturnTo } from "@/lib/onboarding"

const ONBOARDING_TOPIC_COUNT = 3

interface OnboardingFlowProps {
  topics: TopicCard[]
  returnTo?: string | null
}

/** Parcours de premier compte : 3 sujets puis explication Elo/XP. */
export function OnboardingFlow({ topics, returnTo }: OnboardingFlowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const resolveName = useTopicName()
  const queryClient = useQueryClient()
  const startMatchmaking = useStartMatchmaking()
  const completeOnboarding = useCompleteOnboarding()
  const [step, setStep] = useState<1 | 2>(1)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackProductEvent("onboarding_started")
  }, [])

  const target = sanitizeReturnTo(returnTo)
  const roomTarget = isRoomTarget(target)
  const hasTarget = !!target && target !== "/"
  const firstTopic = selected[0]

  const followTopics = useMutation({
    mutationFn: (topicIds: string[]) =>
      Promise.allSettled(
        topicIds.map((topicId) => topicsService.follow(topicId))
      ),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.home() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
    },
  })

  const filteredTopics = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return topics
    return topics.filter((topic) =>
      resolveName(topic.names).toLocaleLowerCase().includes(needle)
    )
  }, [query, resolveName, topics])

  const busy = completeOnboarding.isPending || followTopics.isPending

  function toggleTopic(topicId: string) {
    setSelected((current) => {
      if (current.includes(topicId)) {
        return current.filter((id) => id !== topicId)
      }
      if (current.length >= ONBOARDING_TOPIC_COUNT) return current
      return [...current, topicId]
    })
  }

  async function complete(startDuel: boolean) {
    if (busy) return
    setError(null)
    if (startDuel && selected.length !== ONBOARDING_TOPIC_COUNT) return
    if (selected.length > 0) {
      await followTopics.mutateAsync(selected).catch(() => undefined)
    }
    try {
      await completeOnboarding.mutateAsync()
    } catch {
      setError(t("home.onboarding.saveError"))
      return
    }
    trackProductEvent(
      startDuel ? "onboarding_completed" : "onboarding_skipped",
      { topics: String(selected.length) }
    )
    if (roomTarget && target) {
      void navigate(target, { replace: true })
      return
    }
    if (startDuel && firstTopic) {
      trackProductEvent("duel_start_requested", {
        mode: "public",
        first: "true",
      })
      startMatchmaking.mutate(firstTopic)
      return
    }
    void navigate(target ?? "/", { replace: true })
  }

  const footer =
    step === 1 ? (
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
          disabled={selected.length !== ONBOARDING_TOPIC_COUNT || busy}
          onClick={() => setStep(2)}
        >
          {t("home.onboarding.continue")}
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" disabled={busy} onClick={() => setStep(1)}>
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
          <Button disabled={busy} onClick={() => void complete(true)}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("home.onboarding.start")}
          </Button>
        )}
      </>
    )

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-2">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-[-0.02em]">
          {t("home.onboarding.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("home.onboarding.step", { current: step, total: 2 })}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {step === 1 ? (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-semibold">
                {t("home.onboarding.topicsTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("home.onboarding.topicsSubtitle")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Search
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("home.onboarding.searchPlaceholder")}
                aria-label={t("home.onboarding.searchPlaceholder")}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("home.onboarding.selected", { count: selected.length })}
              </span>
              {selected.length > 0 && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                  onClick={() => setSelected([])}
                >
                  {t("home.onboarding.clear")}
                </button>
              )}
            </div>

            {filteredTopics.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("home.onboarding.noTopics")}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 tablet-up:grid-cols-4">
                {filteredTopics.map((topic) => {
                  const isSelected = selected.includes(topic.topicId)
                  return (
                    <button
                      key={topic.topicId}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleTopic(topic.topicId)}
                      className={
                        isSelected
                          ? "relative flex flex-col items-center gap-2 rounded-2xl border border-primary bg-primary/5 p-2 text-center ring-1 ring-primary"
                          : "relative flex flex-col items-center gap-2 rounded-2xl border border-transparent p-2 text-center transition-colors hover:bg-muted/50"
                      }
                    >
                      <TopicIcon topic={topic} size={52} />
                      <span className="line-clamp-2 min-h-8 text-xs font-semibold">
                        {resolveName(topic.names)}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
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
              {t("home.onboarding.progressionTitle")}
            </h2>
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
              <Bot className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("home.onboarding.botNote")}
            </p>
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
