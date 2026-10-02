import { useMemo, useState } from "react";
import { Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Label, ListBox, Select } from "@heroui/react";
import { WinLossBar } from "@/shared/components/win-loss-bar";
import { ProfileBanner } from "@/features/player";
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
        <p className="text-sm text-muted">Chargement du profil…</p>
      </PageContainer>
    );
  }

  const profile = meQuery.data;
  const name = profile?.pseudonym ?? "Joueur";
  const level = profile?.progression.level ?? 1;
  const stats = profile?.stats;
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
        meta={`${profile?.progression.title ?? ""} · Niveau ${level}${
          profile?.country ? ` · ${countryFlag(profile.country)} ${country}` : ""
        }`}
        stats={[
          { label: "Parties", value: stats?.played ?? 0 },
          { label: "Abonnés", value: profile?.followersCount ?? 0 },
          { label: "Abonné à", value: profile?.followingCount ?? 0 },
        ]}
        belowStats={
          <WinLossBar
            wins={stats?.wins ?? 0}
            draws={stats?.draws ?? 0}
            losses={stats?.losses ?? 0}
          />
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
              onChange={(value) => setFilterTopic(String(value))}
              aria-label="Filtrer l'historique par sujet"
              className="w-[220px]"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="Tous les sujets">
                    <Label>Tous les sujets</Label>
                  </ListBox.Item>
                  {historyTopics.map((topic) => (
                    <ListBox.Item
                      key={topic.topicId}
                      id={topic.topicId}
                      textValue={topic.name}
                    >
                      <Label>{topic.name}</Label>
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
        </div>

        {shown.length === 0 ? (
          <Card className="items-center gap-3 py-12 text-center">
            <Swords className="size-6 text-muted" />
            <div className="text-base font-semibold">Aucun duel pour l'instant</div>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted">
              Sept tours, dix secondes par question. Le premier duel prend moins de
              deux minutes.
            </p>
            <Button onPress={() => navigate("/topics")}>
              <Swords /> Trouver un adversaire
            </Button>
          </Card>
        ) : (
          <MatchList items={shown} />
        )}
      </PageContainer>
    </>
  );
}
