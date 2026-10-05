import { useMemo, useState } from "react";
import { Pencil, Share2, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WinLossBar } from "@/shared/components/win-loss-bar";
import { hasWinLossResults } from "@/shared/utils/win-loss";
import { ProfileBanner, ProfileShareDialog } from "@/features/player";
import { ActivityPanel } from "@/features/player";
import { PageContainer } from "../components/PageContainer";
import { useMe } from "../hooks/useMe";
import { useActivity } from "@/shared/hooks/useActivity";
import { useProfileGames } from "@/features/player";
import { MatchList } from "@/features/topic";
import { countryFlag, countryLabel } from "@/shared/utils/country";

export function ProfilePage() {
  const navigate = useNavigate();
  const meQuery = useMe();
  const userId = meQuery.userId;
  const activity = useActivity(userId ?? "");
  const [filterTopic, setFilterTopic] = useState("all");
  const [shareOpen, setShareOpen] = useState(false);

  const allGamesQuery = useProfileGames(userId ?? "", { page: 0, size: 100 });
  const filteredQuery = useProfileGames(userId ?? "", {
    topicId: filterTopic === "all" ? undefined : filterTopic,
    page: 0,
    size: 100,
  });

  const historyTopics = useMemo(() => {
    const byId = new Map<string, string>();
    (allGamesQuery.data?.content ?? []).forEach((game) => {
      byId.set(game.topic.topicId, game.topic.name);
    });
    return [...byId.entries()].map(([topicId, name]) => ({ topicId, name }));
  }, [allGamesQuery.data]);

  if (meQuery.isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Chargement du profil…</p>
      </PageContainer>
    );
  }

  const profile = meQuery.data;
  const name = profile?.pseudonym ?? "Joueur";
  const level = profile?.progression.level ?? 1;
  const stats = profile?.stats;
  const results = {
    wins: stats?.wins ?? 0,
    draws: stats?.draws ?? 0,
    losses: stats?.losses ?? 0,
  };
  const country = countryLabel(profile?.country);
  const shown = filteredQuery.data?.content ?? [];

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{
          userId: userId ?? undefined,
          avatarOptions: profile?.avatarOptions ?? undefined,
        }}
        onEditAvatar={() => navigate("/settings/avatar")}
        meta={`${profile?.progression.title ?? ""} · Niveau ${level}${
          profile?.country ? ` · ${countryFlag(profile.country)} ${country}` : ""
        }`}
        stats={[
          { label: "Parties", value: stats?.played ?? 0 },
          { label: "Abonnés", value: profile?.followersCount ?? 0 },
          { label: "Abonné à", value: profile?.followingCount ?? 0 },
        ]}
        belowStats={
          hasWinLossResults(results) ? <WinLossBar {...results} /> : undefined
        }
        actions={
          <>
            <Button onClick={() => navigate("/settings")}>
              <Pencil /> Modifier le profil
            </Button>
            <Button variant="outline" onClick={() => setShareOpen(true)}>
              <Share2 /> Partager
            </Button>
          </>
        }
      />

      <PageContainer>
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
                {historyTopics.map((topic) => (
                  <SelectItem key={topic.topicId} value={topic.topicId}>
                    {topic.name}
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
          <MatchList items={shown} />
        )}
      </PageContainer>

      {shareOpen && userId && (
        <ProfileShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          userId={userId}
          name={name}
        />
      )}
    </>
  );
}
