import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Bot, Check, Gauge, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppDialog } from "@/shared/components/app-dialog"
import { TopicIcon } from "@/shared/components/topic-icon"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import { useMe, useTopicName } from "@/features/shell"
import { useStartMatchmaking } from "@/features/matchmaking"
import { topicsService, type TopicCard } from "@/features/topics"
import { queryKeys } from "@/lib/query-keys"
import { trackProductEvent } from "@/lib/telemetry"
import { useOnboardingStore } from "../stores/useOnboardingStore"

const ONBOARDING_TOPIC_COUNT = 3

interface OnboardingDialogProps {
  /** Sujets recommandés (Top 10 / nouveautés de l'Accueil). */
  topics: TopicCard[]
}

/**
 * Onboarding du premier lancement : choix de 3 sujets puis explication Elo/XP.
 * Affiché une seule fois par navigateur (flag local), uniquement pour un joueur sans duel
 * humain. Le CTA lance directement l'appariement du premier sujet choisi ; le repli bot
 * éventuel est ensuite géré par l'écran de matchmaking.
 */
export function OnboardingDialog({ topics }: OnboardingDialogProps) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  const { data: me } = useMe()
  const completeOnboarding = useOnboardingStore((state) => state.complete)
  const completed = useOnboardingStore((state) => state.completed)
  const queryClient = useQueryClient()
  const startMatchmaking = useStartMatchmaking()
  const started = useRef(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [finishing, setFinishing] = useState(false)

  const visible =
    !completed && !!me && me.stats.played === 0 && topics.length > 0
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

  useEffect(() => {
    if (visible && !started.current) {
      started.current = true
      trackProductEvent("onboarding_started")
    }
  }, [visible])

  // Un joueur qui a déjà joué ne doit jamais voir l'onboarding, même si le flag local a été
  // vidé (navigation privée, autre navigateur).
  useEffect(() => {
    if (!completed && me && me.stats.played > 0) completeOnboarding()
  }, [completed, completeOnboarding, me])

  const filteredTopics = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return topics
    return topics.filter((topic) =>
      resolveName(topic.names).toLocaleLowerCase().includes(needle)
    )
  }, [query, resolveName, topics])

  if (!visible) return null

  function toggleTopic(topicId: string) {
    setSelected((current) => {
      if (current.includes(topicId)) {
        return current.filter((id) => id !== topicId)
      }
      if (current.length >= ONBOARDING_TOPIC_COUNT) return current
      return [...current, topicId]
    })
  }

  function skip() {
    if (finishing) return
    trackProductEvent("onboarding_skipped")
    completeOnboarding()
  }

  async function finish(startDuel: boolean) {
    if (finishing || selected.length !== ONBOARDING_TOPIC_COUNT) return
    setFinishing(true)
    await followTopics.mutateAsync(selected).catch(() => undefined)
    trackProductEvent("onboarding_completed", {
      topics: String(selected.length),
    })
    completeOnboarding()
    if (startDuel && firstTopic) {
      trackProductEvent("duel_start_requested", {
        mode: "public",
        first: "true",
      })
      startMatchmaking.mutate(firstTopic)
    }
    setFinishing(false)
  }

  return (
    <AppDialog
      open
      onClose={skip}
      title={t("home.onboarding.title")}
      sub={t("home.onboarding.step", { current: step, total: 2 })}
      showCloseButton={false}
      dismissible={false}
      sheetOnTouch
      sheetDetents={SHEET_DETENTS.duel}
      className="sm:max-w-2xl"
      bodyClassName="flex flex-col gap-5"
      footer={
        step === 1 ? (
          <>
            <Button variant="ghost" onClick={skip} disabled={finishing}>
              {t("home.onboarding.skip")}
            </Button>
            <Button
              disabled={selected.length !== ONBOARDING_TOPIC_COUNT}
              onClick={() => setStep(2)}
            >
              {t("home.onboarding.continue")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              disabled={finishing}
              onClick={() => setStep(1)}
            >
              {t("game.common.back")}
            </Button>
            <Button
              variant="outline"
              disabled={finishing}
              onClick={() => void finish(false)}
            >
              {t("home.onboarding.explore")}
            </Button>
            <Button disabled={finishing} onClick={() => void finish(true)}>
              {t("home.onboarding.start")}
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <>
          <div className="flex flex-col gap-1">
            <h3 className="font-heading text-base font-semibold">
              {t("home.onboarding.topicsTitle")}
            </h3>
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
                          className="size-3 text-primary-foreground"
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
          <div className="flex flex-col gap-1">
            <h3 className="font-heading text-base font-semibold">
              {t("home.onboarding.progressionTitle")}
            </h3>
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
            <Bot className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t("home.onboarding.botNote")}
          </p>
        </>
      )}
    </AppDialog>
  )
}
