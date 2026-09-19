import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, ListOrdered, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatStrip } from "@/components/stat-strip";
import { ProgressBanner } from "@/components/progress-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopicIcon } from "@/components/topic-icon";
import { PageContainer } from "@/features/shell/components/PageContainer";
import { useCurrentPlayer } from "@/features/shell/hooks/useCurrentPlayer";
import { useStartDuel } from "@/features/duel/hooks/useDuel";
import { useStartMatchmaking } from "@/features/duel/hooks/useMatchmaking";
import { PlayModeDialog } from "@/features/duel/components/PlayModeDialog";
import { useCreateChallenge } from "@/features/challenges/hooks/useChallenges";
import { useUiStore } from "@/features/shell/stores/useUiStore";
import { categoryLabel, categoryTagline } from "@/shared/utils/categories";
import { compactNumber } from "@/lib/helpers";
import { toTopicView } from "@/lib/services/topics";
import { TopicLeaderboard } from "../components/TopicLeaderboard";
import { MatchList } from "../components/MatchList";
import {
  useTopic,
  useTopicFollow,
  useToggleTopicFollow,
  useTopicProgress,
  useUserGames,
  useMyRank,
} from "../hooks/useTopicDetail";

export function TopicDetailPage() {
  const { topicId = "" } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("classement");

  const topicQuery = useTopic(topicId);
  const followQuery = useTopicFollow(topicId);
  const { follow, unfollow } = useToggleTopicFollow(topicId);
  const progressQuery = useTopicProgress(topicId);
  const gamesQuery = useUserGames();
  const myRankQuery = useMyRank(topicId);
  const { profile } = useCurrentPlayer();
  const startDuel = useStartDuel();
  const startMatchmaking = useStartMatchmaking();
  const createChallenge = useCreateChallenge();
  const [playOpen, setPlayOpen] = useState(false);
  const pushRecentTopic = useUiStore((s) => s.pushRecentTopic);

  useEffect(() => {
    if (topicId) pushRecentTopic(topicId);
  }, [topicId, pushRecentTopic]);

  if (topicQuery.isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Chargement du sujet…</p>
      </PageContainer>
    );
  }

  if (topicQuery.isError || !topicQuery.data) {
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

  const dto = topicQuery.data;
  const topic = toTopicView(dto);
  const questionCount = Object.values(dto.questionsCounter ?? {}).reduce(
    (sum, n) => sum + n,
    0,
  );
  const progress = progressQuery.data;
  const level = progress?.level ?? 1;
  const xp = progress?.xp ?? 0;
  const pct = Math.min(100, Math.round(((xp % 500) / 500) * 100));

  const followRecord = followQuery.data;
  const isFollowed = !!followRecord;
  const followPending = follow.isPending || unfollow.isPending;

  const topicGames = (gamesQuery.data ?? []).filter((g) => g.topicId === topicId);
  const myRank = myRankQuery.data?.rank ?? null;

  function onToggleFollow() {
    if (isFollowed && followRecord) {
      unfollow.mutate(followRecord.followId);
    } else {
      follow.mutate();
    }
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-0">
      <div data-slot="topic-banner" className="border-b">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
              <TopicIcon topic={topic} size={96} className="rounded-full" />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {categoryLabel(topic.category, topic.category)}
                </div>
                <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight">
                  {topic.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {topic.description || categoryTagline(topic.category)}
                </p>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  {compactNumber(topic.followers)} joueurs
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
                onClick={onToggleFollow}
                disabled={followPending}
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

          <ProgressBanner label="Questions complétées" value={pct} />

          <StatStrip
            className="border-t pt-3"
            items={[
              { label: "Ton niveau", value: level },
              { label: "Abonnés", value: compactNumber(topic.followers) },
              { label: "Questions", value: questionCount },
            ]}
          />
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-background">
        <div className="mx-auto w-full max-w-screen-xl px-4 pt-2 sm:px-6">
          <TabsList variant="line" className="h-auto w-full justify-start">
            <TabsTrigger value="classement">Classement</TabsTrigger>
            <TabsTrigger value="progression">Ta progression</TabsTrigger>
          </TabsList>
        </div>
      </div>

      <PageContainer style={{ paddingTop: 16 }}>
        <TabsContent value="classement" className="mt-0">
          <TopicLeaderboard topicId={topicId} />
        </TabsContent>

        <TabsContent value="progression" className="mt-0 flex flex-col gap-4">
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
            <MatchList games={topicGames} />
          )}
        </TabsContent>
      </PageContainer>
      {playOpen && (
        <PlayModeDialog
          open={playOpen}
          onClose={() => setPlayOpen(false)}
          pending={
            startDuel.isPending ||
            startMatchmaking.isPending ||
            createChallenge.isPending
          }
          topic={topic}
          onStartWorld={() => {
            setPlayOpen(false);
            startMatchmaking.mutate(topicId);
          }}
          onStartBot={(difficulty) =>
            startDuel.mutate(
              { topicId, playerName: profile?.displayName ?? "Joueur", difficulty },
              { onSuccess: () => setPlayOpen(false) },
            )
          }
          onStartFollowed={(challengedId) => {
            setPlayOpen(false);
            createChallenge.mutate({ challengedId, topicId });
          }}
        />
      )}
    </Tabs>
  );
}