import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CloseButton } from "@/shared/components/close-button";
import { useTopicOverview } from "@/features/topic";
import { usePlayerProfile } from "@/features/player";
import { useMe } from "@/features/shell";
import { TOKEN } from "@/shared/theme/tokens";
import { useGoBack } from "@/shared/hooks/useGoBack";
import { LobbyInvite } from "../components/LobbyInvite";
import { LobbyWaitingScreen } from "../components/LobbyWaitingScreen";
import { getSessionUserId } from "@/features/auth";
import { useLobby } from "../hooks/useLobby";
import { useLeaveLobby, useLobbyEnter } from "../hooks/useLobbies";

/**
 * Salle d'attente d'un salon privé — reprend le langage visuel de la file de matchmaking
 * (fond duel, trame de points, anneaux de ping, sujet en pied d'écran). Dès que le second
 * joueur a rejoint, la partie est créée et redirige vers l'arène.
 */
export function LobbyPage() {
  const { lobbyId = "" } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const { lobby, isLoading, isError } = useLobby(lobbyId);
  const leave = useLeaveLobby(lobbyId);
  const cancel = useLeaveLobby(lobbyId, true);
  const goBack = useGoBack("/notifications");
  const topicQuery = useTopicOverview(lobby.topicId ?? "");
  const { data: me } = useMe();
  const meId = getSessionUserId();
  const meIsInitiator = lobby.initiatorId === meId;
  const opponentId = meIsInitiator
    ? (lobby.participantId ?? lobby.opponentId)
    : lobby.initiatorId;
  const opponent = usePlayerProfile(opponentId ?? "");

  useLobbyEnter(lobbyId);

  useEffect(() => {
    if (lobby.gameId) {
      navigate(`/duel/${lobby.gameId}`, { replace: true });
    }
  }, [lobby.gameId, navigate]);

  if (lobby.status === "CLOSED" || lobby.status === "FAILED" || isError) {
    const me = getSessionUserId();
    const title =
      lobby.outcome === "MISSED"
        ? lobby.absentPlayerId && lobby.absentPlayerId === me
          ? "Tu ne t'es pas présenté à temps"
          : "Ton adversaire ne s'est pas présenté"
        : lobby.outcome === "EXPIRED"
          ? "Salon expiré"
          : lobby.outcome === "FAILED"
            ? "Partie impossible à créer"
            : lobby.outcome === "DECLINED"
              ? "Défi refusé"
              : lobby.outcome === "CANCELLED"
                ? "Salon annulé"
                : "Salon introuvable";
    return (
      <div
        className="grid h-full place-items-center p-6"
        style={{ background: TOKEN.duelBg }}
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="text-lg font-heading font-bold">{title}</div>
          <Button className="w-full" onClick={goBack}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && !lobby.topicId) {
    return (
      <div
        className="grid h-full place-items-center p-6 text-sm"
        style={{ background: TOKEN.duelBg, color: TOKEN.mutedFg }}
      >
        Préparation du salon…
      </div>
    );
  }

  const topic = topicQuery.data?.topic;
  const nominative = lobby.opponentId !== null;
  const shareUrl = `${window.location.origin}/join/${lobbyId}`;

  return (
    <div
      className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <CloseButton
        onClick={() => leave.mutate()}
        aria-label="Retour (le salon reste ouvert)"
        className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-[18px] z-20"
      />

      <LobbyWaitingScreen
        topic={{
          name: topic?.name ?? "Salon privé",
          emoji: topic?.emoji ?? undefined,
          color: topic?.color ?? undefined,
          imageUrl: topic?.imageUrl ?? undefined,
          category: topic?.category ?? undefined,
          categoryLabel: topic?.categoryLabel ?? undefined,
        }}
        player={{
          name: me?.pseudonym ?? "Toi",
          userId: meId ?? undefined,
          avatarOptions: me?.avatarOptions,
          present: meIsInitiator
            ? lobby.initiatorPresent
            : lobby.participantPresent,
          isMe: true,
        }}
        opponent={
          opponentId
            ? {
                name: opponent.data?.pseudonym ?? "Adversaire",
                userId: opponentId,
                avatarOptions: opponent.data?.avatarOptions,
                present: meIsInitiator
                  ? lobby.participantPresent
                  : lobby.initiatorPresent,
              }
            : null
        }
        expiresAt={lobby.expiresAt}
        readyDeadlineAt={lobby.readyDeadlineAt}
      >
        {/* Invitation puis action, dans le flux du contenu. Le retour se fait via la croix
            (haut-droite) qui quitte l'écran sans fermer le salon ; seul l'initiateur peut annuler. */}
        <div className="flex w-full max-w-[380px] flex-col items-center gap-4">
          {!nominative && (
            <LobbyInvite
              shareUrl={shareUrl}
              topicName={topic?.name}
              // L'initiateur qui arrive ouvre d'emblée le partage tant que personne n'a rejoint.
              autoOpen={meIsInitiator && !lobby.participantId}
            />
          )}
          {meIsInitiator && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
            >
              Annuler {nominative ? "le défi" : "le salon"}
            </Button>
          )}
        </div>
      </LobbyWaitingScreen>
    </div>
  );
}
