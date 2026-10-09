import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import { getSessionUserId } from "@/features/auth";
import {
  challengesService,
  useMyChallenges,
  useMyOpenLobbies,
  type ChallengeView,
  type LobbyView,
} from "@/features/duel";
import { queryKeys } from "@/lib/query-keys";
import { SectionHeader } from "./section-header";

type PendingDuel =
  | {
      kind: "received";
      id: string;
      topic: ChallengeView["topic"];
      player: ChallengeView["challenger"];
    }
  | {
      kind: "lobby";
      id: string;
      topic: LobbyView["topic"];
      player: LobbyView["opponent"];
    }
  | {
      kind: "sent";
      id: string;
      topic: ChallengeView["topic"];
      player: ChallengeView["opponent"];
    };

function contextLabel(item: PendingDuel): string {
  const name = item.player?.pseudonym ?? "un joueur";
  switch (item.kind) {
    case "received":
      return `Défi reçu de ${name}`;
    case "sent":
      return `Défi envoyé à ${name}`;
    case "lobby":
      return item.player ? `Salon ouvert · ${name}` : "Salon ouvert · en attente";
  }
}

/**
 * Section « Tes défis en attente » de l'Accueil : défis reçus (invitations), salons ouverts et
 * défis envoyés, en bandeau horizontal scrollable comme les carrousels de sujets. Masquée s'il
 * n'y a rien en attente.
 */
export function PendingDuelsSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = getSessionUserId();
  const challenges = useMyChallenges();
  const openLobbies = useMyOpenLobbies();
  const cancelChallenge = useMutation({
    mutationFn: (challengeId: string) => challengesService.cancel(challengeId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() }),
  });

  const items = useMemo<PendingDuel[]>(() => {
    const pending = (challenges.data ?? []).filter(
      (challenge) => challenge.status === "PENDING",
    );
    const received: PendingDuel[] = pending
      .filter((challenge) => challenge.opponent?.userId === me)
      .map((challenge) => ({
        kind: "received",
        id: challenge.challengeId,
        topic: challenge.topic,
        player: challenge.challenger,
      }));
    const lobbies: PendingDuel[] = (openLobbies.data ?? []).map((lobby) => ({
      kind: "lobby",
      id: lobby.lobbyId,
      topic: lobby.topic,
      player: lobby.opponent,
    }));
    const sent: PendingDuel[] = pending
      .filter((challenge) => challenge.challenger?.userId === me)
      .map((challenge) => ({
        kind: "sent",
        id: challenge.challengeId,
        topic: challenge.topic,
        player: challenge.opponent,
      }));
    return [...received, ...lobbies, ...sent];
  }, [challenges.data, openLobbies.data, me]);

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <SectionHeader title="Tes défis en attente" />
      <div className="qu-scroll-x flex scroll-fade-x gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <Card
            key={`${item.kind}-${item.id}`}
            size="sm"
            className="w-56 shrink-0 gap-2 py-3 tablet-up:w-60"
          >
            <CardContent className="flex flex-col gap-2.5 px-3">
              <div className="flex min-w-0 items-center gap-2">
                <TopicIcon topic={item.topic} size={32} />
                <span className="truncate text-sm font-semibold">
                  {item.topic.name}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                {item.player?.userId ? (
                  <UserAvatar
                    name={item.player.pseudonym ?? "Joueur"}
                    userId={item.player.userId}
                    avatarOptions={item.player.avatarOptions ?? undefined}
                    size={20}
                  />
                ) : (
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted">
                    <Clock size={11} aria-hidden />
                  </span>
                )}
                <span className="truncate">{contextLabel(item)}</span>
              </div>
              {item.kind === "received" && (
                <Button size="sm" onClick={() => navigate("/notifications")}>
                  Voir l&apos;invitation
                </Button>
              )}
              {item.kind === "lobby" && (
                <Button size="sm" onClick={() => navigate(`/lobbies/${item.id}`)}>
                  Ouvrir la salle
                </Button>
              )}
              {item.kind === "sent" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={cancelChallenge.isPending}
                  onClick={() => cancelChallenge.mutate(item.id)}
                >
                  Annuler
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
