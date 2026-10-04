import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, ListOrdered, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatStrip } from "@/shared/components/stat-strip";
import { ProgressBanner } from "../components/progress-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { TopicIcon } from "@/shared/components/topic-icon";
import { PageContainer, useMe, useSuggestions } from "@/features/shell";
import {
  PlayModeDialog,
  playerSuggestions,
  useCreateLobby,
  useStartDuel,
  useStartMatchmaking,
} from "@/features/duel";
import { useProfileGames } from "@/features/player";
import { categoryLabel, categoryTagline } from "@/shared/utils/categories";
import { compactNumber } from "@/lib/helpers";
import { TopicLeaderboard } from "../components/TopicLeaderboard";
import { MatchList } from "../components/MatchList";
import {
  useToggleTopicFollow,
  useTopicOverview,
} from "../hooks/useTopicDetail";

export function TopicDetailPage() {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("classement");

  const overviewQuery = useTopicOverview(topicId);
  const { toggle: toggleFollow } = useToggleTopicFollow(topicId);
  const { data: me } = useMe();
  const gamesQuery = useProfileGames(me?.userId ?? "", {
    topicId,
    page: 0,
    size: 100,
  });
  const startDuel = useStartDuel();
  const startMatchmaking = useStartMatchmaking();
  const createLobby = useCreateLobby();
  const [playOpen, setPlayOpen] = useState(false);
  const [playerQuery, setPlayerQuery] = useState("");
  const suggestionsQuery = useSuggestions(playerQuery, playOpen, 10);
  const playerResults = useMemo(
    () => playerSuggestions(suggestionsQuery.data ?? [], me?.userId),
    [suggestionsQuery.data, me?.userId],
  );

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
        <Card className="items-center gap-3 py-12 text-center">
          <div className="text-base font-semibold">Sujet introuvable</div>
          <Button variant="outline" onClick={() => navigate("/topics")}>
            Retour au catalogue
          </Button>
        </Card>
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
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
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
                  {topic.name}
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

            <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:w-[200px]">
              <Button
                size="lg"
                className="w-full whitespace-nowrap"
                disabled={startDuel.isPending}
                onClick={() => setPlayOpen(true)}
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
                onClick={() => setTab("classement")}
              >
                <ListOrdered /> Classements
              </Button>
            </div>
          </div>

          <ProgressBanner
            label="Questions complétées"
            value={myProgress.levelProgressPercent}
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

      <div className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <TabsList>
            <TabsTrigger value="classement">Classement</TabsTrigger>
            <TabsTrigger value="progression">Ta progression</TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="classement" className="mt-0">
        <TopicLeaderboard topicId={topicId} />
      </TabsContent>

      <TabsContent value="progression" className="mt-0">
        <PageContainer style={{ paddingTop: 16 }}>
          {topicGames.length === 0 ? (
            <Card className="items-center gap-3 py-12 text-center">
              <Swords className="size-6 text-muted-foreground" />
              <div className="text-base font-semibold">
                Pas encore de duel sur ce sujet
              </div>
              <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                Lance-toi : sept tours suffisent à te placer au classement.
              </p>
              <Button onClick={() => setPlayOpen(true)}>
                <Swords /> Lancer un duel
              </Button>
            </Card>
          ) : (
            <MatchList items={topicGames} />
          )}
        </PageContainer>
      </TabsContent>
      {playOpen && (
        <PlayModeDialog
          open={playOpen}
          onClose={() => {
            setPlayOpen(false);
            setPlayerQuery("");
          }}
          pending={startDuel.isPending || createLobby.isPending}
          topic={topic}
          playerQuery={playerQuery}
          onPlayerQueryChange={setPlayerQuery}
          playerResults={playerResults}
          playersLoading={suggestionsQuery.isFetching}
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
            setPlayerQuery("");
            createLobby.mutate({ topicId, opponentId });
          }}
          onStartPrivate={() => {
            setPlayOpen(false);
            createLobby.mutate({ topicId });
          }}
        />
      )}
    </Tabs>
  );
}
