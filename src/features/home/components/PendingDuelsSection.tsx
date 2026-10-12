import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Countdown } from "@/components/arc/countdown/countdown";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import { getSessionUserId } from "@/features/auth";
import {
  useAcceptChallenge,
  useCancelChallenge,
  useCancelRoom,
  useDeclineChallenge,
  useMyChallenges,
  useMyOpenRooms,
  useServerClock,
  type ChallengeView,
  type RoomView,
} from "@/features/game";
import { useResolveChallenge } from "@/features/notifications";
import { queryKeys } from "@/lib/query-keys";
import { useImmersiveNavigate, useTopicName } from "@/features/shell";
import { SectionHeader } from "./section-header";

type PendingDuel =
  | {
      kind: "received";
      id: string;
      topic: ChallengeView["topic"];
      player: ChallengeView["challenger"];
      expiresAt: string;
      /** Défi de revanche : la partie d'origine est référencée (`gameId`). */
      rematch: boolean;
    }
  | {
      kind: "room";
      id: string;
      topic: RoomView["topic"];
      player: RoomView["opponent"];
      /** Expiration de la salle (1 jour) — comme les défis, la carte affiche le compte à rebours. */
      expiresAt: string;
      /** Seul l'initiateur peut annuler la salle. */
      canCancel: boolean;
    }
  | {
      kind: "sent";
      id: string;
      topic: ChallengeView["topic"];
      player: ChallengeView["opponent"];
      expiresAt: string;
      rematch: boolean;
    };

function contextLabel(item: PendingDuel, t: TFunction): string {
  const name = item.player?.pseudonym ?? t("home.pendingDuels.somePlayer");
  switch (item.kind) {
    case "received":
      return t("home.pendingDuels.received", { name });
    case "sent":
      return t("home.pendingDuels.sent", { name });
    case "room":
      return item.player
        ? t("home.pendingDuels.room", { name })
        : t("home.pendingDuels.roomWaiting");
  }
}

/** Bandeau horizontal scrollable d'éléments en attente (même style que les carrousels de sujets). */
function PendingRow({ items }: { items: PendingDuel[] }) {
  const { t } = useTranslation();
  const navigate = useImmersiveNavigate();
  const resolveName = useTopicName();
  const queryClient = useQueryClient();
  const acceptChallenge = useAcceptChallenge();
  const declineChallenge = useDeclineChallenge();
  const resolveChallenge = useResolveChallenge();
  const { serverNow } = useServerClock();
  const cancelChallenge = useCancelChallenge();
  const cancelRoom = useCancelRoom();

  /** Accepter depuis l'accueil : salle créée par la saga → on y entre directement. */
  async function onAccept(challengeId: string) {
    const result = await acceptChallenge.accept(challengeId);
    if (result.status === "gone") {
      // Annulé/déjà tranché entre l'affichage et le clic : pas de commande ni de navigation.
      resolveChallenge(challengeId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() });
      toast.info(t("home.pendingDuels.goneTitle"), {
        description: t("home.pendingDuels.goneDescription"),
      });
      return;
    }
    resolveChallenge(challengeId);
    navigate(result.roomId ? `/rooms/${result.roomId}` : "/notifications");
  }

  async function onDecline(challengeId: string) {
    await declineChallenge.decline(challengeId).catch(() => undefined);
    resolveChallenge(challengeId);
  }

  return (
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
                {resolveName(item.topic.names)}
              </span>
              {item.kind !== "room" && item.rematch && (
                <Badge variant="secondary" className="shrink-0">
                  {t("home.pendingDuels.rematch")}
                </Badge>
              )}
            </div>
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {item.player?.userId ? (
                <Link
                  to={`/players/${item.player.userId}`}
                  aria-label={t("home.pendingDuels.viewProfile", {
                    name:
                      item.player.pseudonym ??
                      t("home.pendingDuels.playerFallback"),
                  })}
                  className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <UserAvatar
                    name={
                      item.player.pseudonym ??
                      t("home.pendingDuels.playerFallback")
                    }
                    userId={item.player.userId}
                    avatarOptions={item.player.avatarOptions ?? undefined}
                    size={20}
                  />
                </Link>
              ) : (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted">
                  <Clock size={11} aria-hidden />
                </span>
              )}
              <span className="truncate">{contextLabel(item, t)}</span>
            </div>
            <Countdown
              target={item.expiresAt}
              units={["hours", "minutes", "seconds"]}
              variant="compact"
              size="sm"
              fullWidth
              clock={serverNow}
              label={
                item.kind === "room"
                  ? t("home.pendingDuels.expiresIn")
                  : t("home.pendingDuels.challengeExpiresIn")
              }
              completeLabel={t("home.pendingDuels.expired")}
              className="[--countdown-complete:var(--danger)]"
              onComplete={() => {
                void queryClient.invalidateQueries({
                  queryKey:
                    item.kind === "room"
                      ? queryKeys.rooms.mine()
                      : queryKeys.challenges.mine(),
                });
              }}
            />
            {item.kind === "received" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  disabled={declineChallenge.pending}
                  onClick={() => void onDecline(item.id)}
                >
                  {t("home.pendingDuels.decline")}
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={acceptChallenge.pending}
                  onClick={() => void onAccept(item.id)}
                >
                  {t("home.pendingDuels.accept")}
                </Button>
              </div>
            )}
            {item.kind === "room" &&
              (item.canCancel ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/rooms/${item.id}`)}
                  >
                    {t("home.pendingDuels.openRoom")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    disabled={cancelRoom.isPending}
                    onClick={() => cancelRoom.mutate(item.id)}
                  >
                    {t("home.pendingDuels.cancel")}
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => navigate(`/rooms/${item.id}`)}>
                  {t("home.pendingDuels.openRoom")}
                </Button>
              ))}
            {item.kind === "sent" && (
              <Button
                size="sm"
                variant="destructive"
                disabled={cancelChallenge.isPending}
                onClick={() => cancelChallenge.mutate(item.id)}
              >
                {t("home.pendingDuels.cancel")}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Sections « Tes défis en attente » (invitations reçues + défis envoyés) et
 * « Tes salons en attente » (salons ouverts) de l'Accueil, dissociées et en bandeaux
 * horizontaux scrollables. Chaque section est masquée s'il n'y a rien.
 */
export function PendingDuelsSection() {
  const { t } = useTranslation();
  const me = getSessionUserId();
  const challenges = useMyChallenges();
  const openRooms = useMyOpenRooms();

  const { duels, salons } = useMemo(() => {
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
        expiresAt: challenge.expiresAt,
        rematch: challenge.gameId !== null,
      }));
    const sent: PendingDuel[] = pending
      .filter((challenge) => challenge.challenger?.userId === me)
      .map((challenge) => ({
        kind: "sent",
        id: challenge.challengeId,
        topic: challenge.topic,
        player: challenge.opponent,
        expiresAt: challenge.expiresAt,
        rematch: challenge.gameId !== null,
      }));
    const rooms: PendingDuel[] = (openRooms.data ?? []).map((room) => ({
      kind: "room",
      id: room.roomId,
      topic: room.topic,
      player: room.opponent,
      expiresAt: room.expiresAt,
      canCancel: room.canCancel,
    }));
    return { duels: [...received, ...sent], salons: rooms };
  }, [challenges.data, openRooms.data, me]);

  if (duels.length === 0 && salons.length === 0) return null;

  return (
    <>
      {duels.length > 0 && (
        <section className="mb-4">
          <SectionHeader title={t("home.pendingDuels.sectionTitle")} />
          <PendingRow items={duels} />
        </section>
      )}
      {salons.length > 0 && (
        <section className="mb-4">
          <SectionHeader title={t("home.pendingDuels.roomsSectionTitle")} />
          <PendingRow items={salons} />
        </section>
      )}
    </>
  );
}
