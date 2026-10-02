import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, ListOrdered, Swords } from "lucide-react";
import { Button, Card, Tabs } from "@heroui/react";
import { StatStrip } from "@/shared/components/stat-strip";
import { ProgressBanner } from "../components/progress-banner";
import { TopicIcon } from "@/shared/components/topic-icon";
import { PageContainer, useMe } from "@/features/shell";
import { useStartDuel, useStartMatchmaking, PlayModeDialog } from "@/features/duel";
import { useCreateChallenge } from "@/features/challenges";
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
  const createChallenge = useCreateChallenge();
  const [playOpen, setPlayOpen] = useState(false);

  if (overviewQuery.isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted">Chargement du sujet…</p>
      </PageContainer>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <PageContainer>
        <Card className="items-center gap-3 py-12 text-center">
          <div className="text-base font-semibold">Sujet introuvable</div>
          <Button variant="outline" onPress={() => navigate("/topics")}>
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
    <>
      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => setTab(String(key))}
        className="gap-0"
      >
      <div data-slot="topic-banner" className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
              <TopicIcon topic={topic} size={96} className="rounded-full" />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {categoryLabel(topic.category ?? "", topic.categoryLabel ?? undefined)}
                </div>
                <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight">
                  {topic.name}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {topic.description ||
                    categoryTagline(topic.category ?? "")}
                </p>
                <div className="mt-1.5 text-xs text-muted">
                  {compactNumber(followersCount)} joueurs
                  {myRank != null && ` · ton rang #${myRank}`}
                </div>
              </div>
            </div>

            <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:w-[200px]">
              <Button
                size="lg"
                className="w-full whitespace-nowrap"
                isDisabled={startDuel.isPending}
                onPress={() => setPlayOpen(true)}
              >
                <Swords /> Lancer un duel
              </Button>
              <Button
                variant={isFollowed ? "secondary" : "outline"}
                className="w-full"
                onPress={toggleFollow}
                aria-pressed={isFollowed}
              >
                <Heart className={isFollowed ? "fill-accent text-accent" : ""} />
                {isFollowed ? "Suivi" : "Suivre"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onPress={() => setTab("classement")}
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

      <div className="bg-background">
        <div className="mx-auto w-full max-w-screen-xl px-4 pt-2 sm:px-6">
          <Tabs.ListContainer className="w-fit max-w-full">
            <Tabs.List className="h-auto min-w-0 justify-start **:data-[slot=tabs-tab]:whitespace-nowrap">
              <Tabs.Tab id="classement">
                Classement
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="progression">
                Ta progression
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </div>
      </div>

      <PageContainer style={{ paddingTop: 16 }}>
        <Tabs.Panel id="classement" className="mt-0 p-0">
          <TopicLeaderboard topicId={topicId} />
        </Tabs.Panel>

        <Tabs.Panel id="progression" className="mt-0 flex flex-col gap-4 p-0">
          {topicGames.length === 0 ? (
            <Card className="items-center gap-3 py-12 text-center">
              <Swords className="size-6 text-muted" />
              <div className="text-base font-semibold">
                Pas encore de duel sur ce sujet
              </div>
              <p className="max-w-[52ch] text-sm leading-relaxed text-muted">
                Lance-toi : sept tours suffisent à te placer au classement.
              </p>
              <Button onPress={() => setPlayOpen(true)}>
                <Swords /> Lancer un duel
              </Button>
            </Card>
          ) : (
            <MatchList items={topicGames} />
          )}
        </Tabs.Panel>
      </PageContainer>
      </Tabs>
      {/* La popup vit hors de `<Tabs>` : un overlay portalé enfant de `Tabs` est monté
          en double par la collection React Aria (deux backdrops dans le DOM). */}
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
              { topicId, difficulty },
              { onSuccess: () => setPlayOpen(false) },
            )
          }
          onStartFollowed={(challengedId) => {
            setPlayOpen(false);
            createChallenge.mutate({ challengedId, topicId });
          }}
        />
      )}
    </>
  );
}
