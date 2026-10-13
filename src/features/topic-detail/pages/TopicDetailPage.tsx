import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Heart, Share2, SquarePen, Swords } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BannerGlow } from "@/shared/components/banner-glow"
import { EmptyState } from "@/shared/components/empty-state"
import { StatStrip } from "@/shared/components/stat-strip"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import { ProgressBanner } from "../components/progress-banner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs"
import { TopicIcon } from "@/shared/components/topic-icon"
import {
  PageContainer,
  useMe,
  useSuggestions,
  useTopicName,
} from "@/features/shell"
import { useUrlParam } from "@/shared/hooks/useUrlParam"
import {
  PlayModeDialog,
  playerCardsToSuggestions,
  playerSuggestions,
  type PlayerSource,
} from "@/features/game"
import { useCreateChallenge } from "@/features/challenges"
import { useStartMatchmaking } from "@/features/matchmaking"
import { useCreateSharedRoom, useStartBotGame } from "@/features/rooms"
import { usePeopleList } from "@/features/follows"
import { useGameHistory } from "@/features/player"
import {
  categoryColor,
  categoryLabel,
  categoryTagline,
} from "@/shared/utils/categories"
import { compactNumber } from "@/lib/helpers"
import { TopicLeaderboard } from "../components/TopicLeaderboard"
import { TopicShareDialog } from "../components/TopicShareDialog"
import { MatchList } from "@/features/player"
import { useToggleTopicFollow, useTopicOverview } from "../hooks/useTopicDetail"

export function TopicDetailPage() {
  const { t } = useTranslation()
  const { topicId = "" } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useUrlParam<string>("tab", "classement")

  const overviewQuery = useTopicOverview(topicId)
  const { toggle: toggleFollow } = useToggleTopicFollow(topicId)
  const resolveName = useTopicName()
  const { data: me } = useMe()
  // Progression du thème : aperçu des 5 derniers duels sur ce sujet.
  const gamesHistory = useGameHistory(me?.userId ?? "", { topicId })
  const startDuel = useStartBotGame()
  const startMatchmaking = useStartMatchmaking()
  const createRoom = useCreateSharedRoom()
  const createChallenge = useCreateChallenge()
  const [playOpen, setPlayOpen] = useState(false)
  // Incrémenté à chaque ouverture : remonte le wizard sur un état vierge sans le démonter
  // à la fermeture (l'animation de sortie de la bottom sheet peut ainsi se jouer).
  const [playSession, setPlaySession] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const [playerQuery, setPlayerQuery] = useState("")
  const [playerSource, setPlayerSource] = useState<PlayerSource>("following")
  const suggestionsQuery = useSuggestions(
    playerQuery,
    playOpen && playerSource === "all",
    10
  )
  const peopleQuery = usePeopleList(
    playerSource === "followers" ? "followers" : "following",
    { q: playerQuery, sort: "ALPHA" },
    playOpen && playerSource !== "all"
  )
  const playerResults = useMemo(
    () =>
      playerSource === "all"
        ? playerSuggestions(suggestionsQuery.data ?? [], me?.userId)
        : playerCardsToSuggestions(
            peopleQuery.data?.pages.flatMap((page) => page.content) ?? [],
            me?.userId,
            t
          ),
    [playerSource, suggestionsQuery.data, peopleQuery.data, me?.userId, t]
  )
  const playersHasMore = playerSource !== "all" && !!peopleQuery.hasNextPage
  const playersLoadingMore = peopleQuery.isFetchingNextPage
  const playersLoading =
    playerSource === "all"
      ? suggestionsQuery.isFetching
      : peopleQuery.isFetching

  /** Rouvre la popup sur un état vierge (le composant reste monté pour l'animation de fermeture). */
  function openPlay() {
    setPlayerQuery("")
    setPlaySession((session) => session + 1)
    setPlayOpen(true)
  }

  if (overviewQuery.isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          {t("topic.detail.loading")}
        </p>
      </PageContainer>
    )
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <PageContainer>
        <EmptyState title={t("topic.detail.notFound")}>
          <Button variant="outline" onClick={() => void navigate("/topics")}>
            {t("topic.detail.backToCatalog")}
          </Button>
        </EmptyState>
      </PageContainer>
    )
  }

  const { topic, myProgress, canManage } = overviewQuery.data
  const isFollowed = topic.followed
  const followersCount = topic.followersCount
  const topicGames = gamesHistory.items

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(String(v))}
      className="gap-0"
    >
      <div
        data-slot="topic-banner"
        className="relative overflow-hidden border-b bg-background"
      >
        {topic.bannerUrl ? (
          <>
            <img
              src={topic.bannerUrl}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            {/* Voile pour garder le titre/contrôles lisibles sur n'importe quelle bannière. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/55 via-background/75 to-background" />
          </>
        ) : null}
        {/* Halo dynamique : couleur éditoriale du sujet, repli couleur de sa catégorie.
            (Beams désactivés pour le moment — composant conservé dans components/ui.) */}
        <BannerGlow
          color={topic.color ?? categoryColor(topic.category ?? "")}
        />
        <div className="relative mx-auto flex w-full max-w-screen-xl flex-col gap-5 px-(--page-gutter-x) py-6 tablet-up:py-8">
          <div className="flex flex-col items-center gap-5 tablet-up:flex-row tablet-up:items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center tablet-up:flex-row tablet-up:items-center tablet-up:gap-5 tablet-up:text-left">
              {/* Bordure portée par un wrapper : le visuel garde sa taille pleine (pas de rognage). */}
              <span className="inline-flex rounded-full border-4 border-foreground">
                <TopicIcon
                  topic={topic}
                  size={96}
                  className="rounded-full"
                  loading="eager"
                  fetchPriority="high"
                />
              </span>
              <div className="min-w-0">
                <div
                  className="text-xs font-semibold tracking-wide uppercase"
                  style={{ color: categoryColor(topic.category ?? "") }}
                >
                  {categoryLabel(
                    topic.category ?? "",
                    topic.categoryLabel ?? undefined
                  )}
                </div>
                <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight">
                  {resolveName(topic.names)}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topic.description || categoryTagline(topic.category ?? "")}
                </p>
              </div>
            </div>

            <div className="grid w-full shrink-0 grid-cols-1 gap-2 tablet-up:w-[200px]">
              <Button
                size="lg"
                className="w-full whitespace-nowrap"
                disabled={startDuel.isPending}
                onClick={openPlay}
              >
                <Swords /> {t("topic.detail.play")}
              </Button>
              {/* Créateur uniquement : entrée de l'atelier d'édition du thème. */}
              {canManage && (
                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link to={`/topics/${topicId}/manage`} />}
                >
                  <SquarePen /> {t("topic.detail.edit")}
                </Button>
              )}
              <Button
                variant={isFollowed ? "secondary" : "outline"}
                className="w-full"
                onClick={toggleFollow}
                aria-pressed={isFollowed}
              >
                <Heart
                  className={isFollowed ? "fill-primary text-primary" : ""}
                />
                {isFollowed
                  ? t("topic.detail.following")
                  : t("topic.detail.follow")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShareOpen(true)}
              >
                <Share2 /> {t("topic.detail.share")}
              </Button>
            </div>
          </div>

          <ProgressBanner
            label={t("topic.detail.progress")}
            value={myProgress.completionPercent}
            detail={`${myProgress.completedQuestions} / ${myProgress.totalQuestions}`}
          />

          <StatStrip
            className="border-t pt-3"
            items={[
              { label: t("topic.detail.stats.level"), value: myProgress.level },
              {
                label: t("topic.detail.stats.followers"),
                value: compactNumber(followersCount),
              },
              {
                label: t("topic.detail.stats.questions"),
                value: topic.questionsCount,
              },
            ]}
          />
        </div>
      </div>

      <PageHeaderBar>
        <TabsList>
          <TabsTrigger value="classement">
            {t("topic.detail.tabs.leaderboard")}
          </TabsTrigger>
          <TabsTrigger value="progression">
            {t("topic.detail.tabs.progression")}
          </TabsTrigger>
        </TabsList>
      </PageHeaderBar>

      <TabsContent value="classement" className="mt-0">
        <TopicLeaderboard topicId={topicId} />
      </TabsContent>

      <TabsContent value="progression" className="mt-0">
        <PageContainer style={{ paddingTop: 16 }}>
          {topicGames.length === 0 ? (
            <EmptyState
              icon={<Swords className="size-6 text-muted-foreground" />}
              title={t("topic.detail.emptyTitle")}
              description={t("topic.detail.emptyDescription")}
            >
              <Button onClick={openPlay}>
                <Swords /> {t("topic.detail.play")}
              </Button>
            </EmptyState>
          ) : (
            <>
              <MatchList items={topicGames} />
            </>
          )}
        </PageContainer>
      </TabsContent>
      {/* Monté en permanence : l'animation de fermeture de la bottom sheet doit pouvoir se jouer. */}
      <PlayModeDialog
        key={playSession}
        open={playOpen}
        onClose={() => setPlayOpen(false)}
        pending={
          startDuel.isPending ||
          createRoom.isPending ||
          createChallenge.isPending
        }
        playerQuery={playerQuery}
        onPlayerQueryChange={setPlayerQuery}
        playerSource={playerSource}
        onPlayerSourceChange={(source) => {
          setPlayerSource(source)
          setPlayerQuery("")
        }}
        playerResults={playerResults}
        playersLoading={playersLoading}
        playersHasMore={playersHasMore}
        playersLoadingMore={playersLoadingMore}
        onLoadMorePlayers={() => void peopleQuery.fetchNextPage()}
        onStartWorld={() => {
          setPlayOpen(false)
          startMatchmaking.mutate(topicId)
        }}
        onStartBot={(difficulty) =>
          startDuel.mutate(
            { topicId, difficulty },
            { onSuccess: () => setPlayOpen(false) }
          )
        }
        onStartPlayer={(opponentId) => {
          setPlayOpen(false)
          createChallenge.mutate({ topicId, opponentId })
        }}
        onStartPrivate={() => {
          setPlayOpen(false)
          createRoom.mutate(topicId)
        }}
      />
      <TopicShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        topicId={topicId}
        topicName={resolveName(topic.names)}
      />
    </Tabs>
  )
}
