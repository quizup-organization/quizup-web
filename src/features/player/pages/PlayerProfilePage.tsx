import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Swords, UserCheck, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WinLossBar } from "@/shared/components/win-loss-bar";
import { CurrentStreak } from "@/shared/components/current-streak";
import { hasWinLossResults } from "@/shared/utils/win-loss";
import { ProfileBanner } from "../components/ProfileBanner";
import { PresenceBadge } from "@/shared/components/PresenceBadge";
import { PageContainer, useMe } from "@/features/shell";
import { MatchList } from "@/features/topic";
import { ThemePickerDialog, useCreateRoom } from "@/features/game";
import { getSessionUserId as getUserId } from "@/features/auth";
import { countryFlag, countryLabel } from "@/shared/utils/country";
import { usePresence } from "@/shared/hooks/usePresence";
import {
  useGameHistory,
  useHeadToHead,
  useHistorySentinel,
  usePlayerProfile,
  usePlayerStreak,
  useToggleUserFollow,
} from "../hooks/usePlayer";

export function PlayerProfilePage() {
  const { playerId = "" } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const me = getUserId();
  const [salonOpen, setSalonOpen] = useState(false);

  const { data: profile, isLoading, isError } = usePlayerProfile(playerId);
  const { toggle: toggleFollow } = useToggleUserFollow(playerId);
  const createRoom = useCreateRoom();
  const headToHead = useHeadToHead(me ?? "", playerId);
  // Face-à-face : historique en scroll infini (5 duels par page) contre ce joueur.
  const versusHistory = useGameHistory(me ?? "", { opponentId: playerId });
  const versusSentinelRef = useHistorySentinel(versusHistory);
  const presence = usePresence(playerId);
  // Série actuelle du joueur consulté (son propre historique, pas le face-à-face).
  const { data: viewer } = useMe();
  const streak = usePlayerStreak(playerId);

  // Une seule page « soi » : `/players/<monId>` redirige vers `/profile`.
  if (profile?.isMe) {
    return <Navigate to="/profile" replace />;
  }

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Chargement du joueur…</p>
      </PageContainer>
    );
  }

  if (isError || !profile) {
    return (
      <PageContainer>
        <Card className="items-center gap-3 py-12 text-center">
          <div className="text-base font-semibold">Joueur introuvable</div>
          <Button variant="outline" onClick={() => navigate("/people")}>
            Retour aux personnes
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const name = profile.pseudonym ?? "Joueur";
  const level = profile.progression.level;
  const versus = versusHistory.items;
  const stats = headToHead.data;

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{
          userId: playerId,
          avatarOptions: profile.avatarOptions ?? undefined,
        }}
        badge={
          profile.following ? <Badge variant="secondary">Abonné</Badge> : undefined
        }
        meta={`${profile.progression.title} · Niveau ${level}${
          profile.country
            ? ` · ${countryFlag(profile.country)} ${countryLabel(profile.country)}`
            : ""
        }`}
        extra={
          <PresenceBadge
            online={presence.data?.status === "ONLINE"}
            lastSeenAt={presence.data?.lastSeenAt}
          />
        }
        actions={
          <>
            <Button
              size="lg"
              className="w-full whitespace-nowrap"
              onClick={() => setSalonOpen(true)}
            >
              <Swords /> Défier
            </Button>
            <Button
              variant={profile.following ? "secondary" : "outline"}
              size="lg"
              className="w-full"
              onClick={toggleFollow}
              aria-pressed={profile.following}
              aria-label={profile.following ? "Ne plus suivre" : "Suivre"}
            >
              {profile.following ? (
                <UserCheck className="text-primary" />
              ) : (
                <UserPlus />
              )}
              {profile.following ? "Abonné" : "Suivre"}
            </Button>
          </>
        }
        stats={[
          { label: "Parties", value: profile.stats.played },
          { label: "Abonnés", value: profile.followersCount },
          { label: "Abonné à", value: profile.followingCount },
        ]}
        belowStats={
          stats && hasWinLossResults(stats) ? (
            <div className="flex flex-col gap-4">
              <WinLossBar
                wins={stats.wins}
                draws={stats.draws}
                losses={stats.losses}
              />
              <CurrentStreak
                streak={streak}
                language={viewer?.language ?? "fr"}
              />
            </div>
          ) : undefined
        }
      />

      <PageContainer>
        {versus.length > 0 && (
          <>
            <h2 className="mb-3 font-heading text-base font-semibold">
              Tes duels contre {name.split(" ")[0]}
            </h2>
            <MatchList items={versus} />

            {versusHistory.hasNextPage && (
              <div
                ref={versusSentinelRef}
                className="mt-1 h-px"
                aria-hidden="true"
              />
            )}

            {versusHistory.isFetchingNextPage && (
              <div className="mt-3 h-16 animate-pulse rounded-2xl bg-muted/50" />
            )}
          </>
        )}
      </PageContainer>

      <ThemePickerDialog
        open={salonOpen}
        onClose={() => setSalonOpen(false)}
        title={`Défier ${name}`}
        sub="Choisis un thème : il recevra une invitation."
        onSelect={(topicId) => {
          setSalonOpen(false);
          createRoom.mutate({ topicId, opponentId: profile.userId });
        }}
      />
    </>
  );
}
