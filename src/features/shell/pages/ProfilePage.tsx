import { useMemo, useState } from "react";
import { Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WinLossBar } from "@/components/win-loss-bar";
import { ProfileBanner } from "@/shared/components/ProfileBanner";
import { ActivityPanel } from "@/shared/components/ActivityPanel";
import { PageContainer } from "../components/PageContainer";
import { useCurrentPlayer } from "../hooks/useCurrentPlayer";
import { useFollowCounts } from "@/shared/hooks/useFollowCounts";
import { useActivity } from "@/shared/hooks/useActivity";
import { useUserGames } from "@/features/topic/hooks/useTopicDetail";
import { MatchList } from "@/features/topic/components/MatchList";
import { titleForLevel } from "@/shared/utils/level";
import { countryFlag, countryLabel } from "@/shared/utils/country";
import { queryKeys } from "@/lib/query-keys";
import { topicsService } from "@/lib/services/topics";

export function ProfilePage() {
  const navigate = useNavigate();
  const { userId, profile, progression, isLoading } = useCurrentPlayer();
  const countsQuery = useFollowCounts(userId ?? "");
  const gamesQuery = useUserGames();
  const activity = useActivity(userId ?? "");
  const [filterTopic, setFilterTopic] = useState("all");

  const games = useMemo(() => gamesQuery.data ?? [], [gamesQuery.data]);
  const historyTopics = useMemo(
    () => [...new Set(games.map((game) => game.topicId))],
    [games],
  );
  const topicQueries = useQueries({
    queries: historyTopics.map((topicId) => ({
      queryKey: queryKeys.topics.detail(topicId),
      queryFn: () => topicsService.getById(topicId),
      staleTime: 10 * 60 * 1000,
    })),
  });
  const topicName = (topicId: string) =>
    topicQueries[historyTopics.indexOf(topicId)]?.data?.name ?? "Sujet";

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Chargement du profil…</p>
      </PageContainer>
    );
  }

  const name = profile?.displayName ?? "Joueur";
  const level = progression?.level ?? 1;
  const duel = progression?.duelStats;
  const played = duel?.played ?? 0;
  const wins = duel?.wins ?? 0;
  const losses = duel?.losses ?? 0;
  const draws = Math.max(0, played - wins - losses);
  const country = countryLabel(profile?.country);

  const shown =
    filterTopic === "all"
      ? games
      : games.filter((game) => game.topicId === filterTopic);

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{ face: true, glow: "var(--duel-correct-accent)" }}
        meta={`${titleForLevel(level)} · Niveau ${level}${
          profile?.country ? ` · ${countryFlag(profile.country)} ${country}` : ""
        }`}
        stats={[
          { label: "Parties", value: played },
          { label: "Abonnés", value: countsQuery.data?.followers ?? 0 },
          { label: "Abonné à", value: countsQuery.data?.following ?? 0 },
        ]}
      />

      <PageContainer>
        <section className="mb-6">
          <h2 className="mb-3 font-heading text-base font-semibold">Statistiques</h2>
          <Card size="sm">
            <CardContent className="px-4 py-4">
              <WinLossBar wins={wins} draws={draws} losses={losses} />
            </CardContent>
          </Card>
        </section>

        <ActivityPanel activity={activity.data} isLoading={activity.isLoading} />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-base font-semibold">
            Historique des duels
          </h2>
          <div className="flex-1" />
          {historyTopics.length > 1 && (
            <Select
              value={filterTopic}
              onValueChange={(value) => setFilterTopic(String(value))}
            >
              <SelectTrigger
                size="sm"
                className="w-[220px]"
                aria-label="Filtrer l'historique par sujet"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les sujets</SelectItem>
                {historyTopics.map((topicId) => (
                  <SelectItem key={topicId} value={topicId}>
                    {topicName(topicId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {shown.length === 0 ? (
          <Card className="items-center gap-3 py-12 text-center">
            <Swords className="size-6 text-muted-foreground" />
            <div className="text-base font-semibold">Aucun duel pour l'instant</div>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              Sept tours, dix secondes par question. Le premier duel prend moins de
              deux minutes.
            </p>
            <Button onClick={() => navigate("/topics")}>
              <Swords /> Trouver un adversaire
            </Button>
          </Card>
        ) : (
          <MatchList games={shown} />
        )}
      </PageContainer>
    </>
  );
}
