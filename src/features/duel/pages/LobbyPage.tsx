import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Ban, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CloseButton } from "@/shared/components/close-button";
import { useTopicOverview } from "@/features/topic";
import { usePlayerProfile } from "@/features/player";
import { useMe, useTopicName } from "@/features/shell";
import { TOKEN } from "@/shared/theme/tokens";
import { useDevice } from "@/shared/hooks/use-device";
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
  const resolveName = useTopicName();
  const isDesktop = useDevice() === "desktop";
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
  const cancelLabel = nominative ? "Annuler le défi" : "Annuler le salon";

  return (
    <div
      className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      {/* Haut-droite : options (annulation desktop) puis retour (quitte sans fermer le salon). */}
      <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-[18px] z-20 flex items-center gap-2">
        {meIsInitiator && isDesktop && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Plus d'options"
                  className="grid size-(--control-h-sm) shrink-0 place-items-center rounded-full border border-border bg-[var(--surface-muted)] p-0 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <MoreVertical className="size-4" aria-hidden />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                <Ban />
                {cancelLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <CloseButton
          onClick={() => leave.mutate()}
          aria-label="Retour (le salon reste ouvert)"
        />
      </div>

      <LobbyWaitingScreen
        topic={{
          name: resolveName(topic?.names, "Salon privé"),
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
            (haut-droite) qui quitte l'écran sans fermer le salon ; seul l'initiateur peut
            annuler. En desktop, l'annulation vit dans le menu d'options (haut-droite). */}
        <div className="flex w-full max-w-[380px] flex-col items-center gap-4">
          {!nominative && (
            <LobbyInvite
              shareUrl={shareUrl}
              topicName={topic ? resolveName(topic.names) : undefined}
              // L'initiateur qui arrive ouvre d'emblée le partage tant que personne n'a rejoint.
              autoOpen={meIsInitiator && !lobby.participantId}
            />
          )}
          {meIsInitiator && !isDesktop && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
            >
              {cancelLabel}
            </Button>
          )}
        </div>
      </LobbyWaitingScreen>
    </div>
  );
}
