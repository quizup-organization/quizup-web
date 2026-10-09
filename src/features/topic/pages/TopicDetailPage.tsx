import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Share2, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/empty-state";
import { StatStrip } from "@/shared/components/stat-strip";
import { PageHeaderBar } from "@/shared/components/page-header-bar";
import { ProgressBanner } from "../components/progress-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { TopicIcon } from "@/shared/components/topic-icon";
import { PageContainer, useMe, useSuggestions, useTopicName } from "@/features/shell";
import { useUrlParam } from "@/shared/hooks/useUrlParam";
import {
  PlayModeDialog,
  playerCardsToSuggestions,
  playerSuggestions,
  useCreateLobby,
  useStartDuel,
  useStartMatchmaking,
  type PlayerSource,
} from "@/features/duel";
import { usePeopleList } from "@/features/people";
import { useProfileGames } from "@/features/player";
import { categoryLabel, categoryTagline } from "@/shared/utils/categories";
import { compactNumber } from "@/lib/helpers";
import { TopicLeaderboard } from "../components/TopicLeaderboard";
import { TopicShareDialog } from "../components/TopicShareDialog";
import { MatchList } from "../components/MatchList";
import {
  useToggleTopicFollow,
  useTopicOverview,
} from "../hooks/useTopicDetail";

export function TopicDetailPage() {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useUrlParam<string>("tab", "classement");

  const overviewQuery = useTopicOverview(topicId);
  const { toggle: toggleFollow } = useToggleTopicFollow(topicId);
  const resolveName = useTopicName();
  const { data: me } = useMe();
  // Progression du thème : uniquement les 10 derniers duels.
  const gamesQuery = useProfileGames(me?.userId ?? "", {
    topicId,
    page: 0,
    size: 10,
  });
  const startDuel = useStartDuel();
  const startMatchmaking = useStartMatchmaking();
  const createLobby = useCreateLobby();
  const [playOpen, setPlayOpen] = useState(false);
  // Incrémenté à chaque ouverture : remonte le wizard sur un état vierge sans le démonter
  // à la fermeture (l'animation de sortie de la bottom sheet peut ainsi se jouer).
  const [playSession, setPlaySession] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [playerQuery, setPlayerQuery] = useState("");
  const [playerSource, setPlayerSource] = useState<PlayerSource>("following");
  const suggestionsQuery = useSuggestions(
    playerQuery,
    playOpen && playerSource === "all",
    10,
  );
  const peopleQuery = usePeopleList(
    playerSource === "followers" ? "followers" : "following",
    { q: playerQuery, sort: "ALPHA" },
    playOpen && playerSource !== "all",
  );
  const playerResults = useMemo(
    () =>
      playerSource === "all"
        ? playerSuggestions(suggestionsQuery.data ?? [], me?.userId)
        : playerCardsToSuggestions(
            peopleQuery.data?.pages.flatMap((page) => page.content) ?? [],
            me?.userId,
          ),
    [playerSource, suggestionsQuery.data, peopleQuery.data, me?.userId],
  );
  const playersHasMore =
    playerSource !== "all" && !!peopleQuery.hasNextPage;
  const playersLoadingMore = peopleQuery.isFetchingNextPage;
  const playersLoading =
    playerSource === "all" ? suggestionsQuery.isFetching : peopleQuery.isFetching;

  /** Rouvre la popup sur un état vierge (le composant reste monté pour l'animation de fermeture). */
  function openPlay() {
    setPlayerQuery("");
    setPlaySession((session) => session + 1);
    setPlayOpen(true);
  }

  if (overviewQuery.isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Chargement du sujet…</p>
      </PageContainer>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <PageContainer>
        <EmptyState title="Sujet introuvable">
          <Button variant="outline" onClick={() => navigate("/topics")}>
            Retour au catalogue
          </Button>
        </EmptyState>
      </PageContainer>
    );
  }

  const { topic, myRank, myProgress } = overviewQuery.data;
  const isFollowed = topic.followed;
  const followersCount = topic.followersCount;
  const topicGames = gamesQuery.data?.content ?? [];

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-0">
      <div data-slot="topic-banner" className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-5 px-(--page-gutter-x) py-6 tablet-up:py-8">
          <div className="flex flex-col items-center gap-5 tablet-up:flex-row tablet-up:items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center tablet-up:flex-row tablet-up:items-center tablet-up:gap-5 tablet-up:text-left">
              <TopicIcon
                topic={topic}
                size={96}
                className="rounded-full"
                loading="eager"
                fetchPriority="high"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {categoryLabel(topic.category ?? "", topic.categoryLabel ?? undefined)}
                </div>
                <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight">
                  {resolveName(topic.names)}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topic.description ||
                    categoryTagline(topic.category ?? "")}
                </p>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  {compactNumber(followersCount)} joueurs
                  {myRank != null && ` · ton rang #${myRank}`}
                </div>
              </div>
            </div>

            <div className="grid w-full shrink-0 grid-cols-1 gap-2 tablet-up:w-[200px]">
              <Button
                size="lg"
                className="w-full whitespace-nowrap"
                disabled={startDuel.isPending}
                onClick={openPlay}
              >
                <Swords /> Lancer un duel
              </Button>
              <Button
                variant={isFollowed ? "secondary" : "outline"}
                className="w-full"
                onClick={toggleFollow}
                aria-pressed={isFollowed}
              >
                <Heart className={isFollowed ? "fill-primary text-primary" : ""} />
                {isFollowed ? "Suivi" : "Suivre"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShareOpen(true)}
              >
                <Share2 /> Partager
              </Button>
            </div>
          </div>

          <ProgressBanner
            label="Questions complétées"
            value={myProgress.completionPercent}
            detail={`${myProgress.completedQuestions} / ${myProgress.totalQuestions}`}
          />

          <StatStrip
            className="border-t pt-3"
            items={[
              { label: "Ton niveau", value: myProgress.level },
              { label: "Abonnés", value: compactNumber(followersCount) },
              { label: "Questions", value: topic.questionsCount },
            ]}
          />
        </div>
      </div>

      <PageHeaderBar>
        <TabsList>
          <TabsTrigger value="classement">Classement</TabsTrigger>
          <TabsTrigger value="progression">Ta progression</TabsTrigger>
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
              title="Pas encore de duel sur ce sujet"
              description="Lance-toi : sept tours suffisent à te placer au classement."
            >
              <Button onClick={openPlay}>
                <Swords /> Lancer un duel
              </Button>
            </EmptyState>
          ) : (
            <MatchList items={topicGames} />
          )}
        </PageContainer>
      </TabsContent>
      {/* Monté en permanence : l'animation de fermeture de la bottom sheet doit pouvoir se jouer. */}
      <PlayModeDialog
        key={playSession}
        open={playOpen}
        onClose={() => setPlayOpen(false)}
        pending={startDuel.isPending || createLobby.isPending}
        topic={topic}
        playerQuery={playerQuery}
        onPlayerQueryChange={setPlayerQuery}
        playerSource={playerSource}
        onPlayerSourceChange={(source) => {
          setPlayerSource(source);
          setPlayerQuery("");
        }}
        playerResults={playerResults}
        playersLoading={playersLoading}
        playersHasMore={playersHasMore}
        playersLoadingMore={playersLoadingMore}
        onLoadMorePlayers={() => void peopleQuery.fetchNextPage()}
        onStartWorld={() => {
          setPlayOpen(false);
          startMatchmaking.mutate(topicId);
        }}
        onStartBot={(difficulty) =>
          startDuel.mutate(
            { topicId, difficulty },
            { onSuccess: () => setPlayOpen(false) },
          )
        }
        onStartPlayer={(opponentId) => {
          setPlayOpen(false);
          createLobby.mutate({ topicId, opponentId });
        }}
        onStartPrivate={() => {
          setPlayOpen(false);
          createLobby.mutate({ topicId });
        }}
      />
      <TopicShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        topicId={topicId}
        topicName={resolveName(topic.names)}
      />
    </Tabs>
  );
}
