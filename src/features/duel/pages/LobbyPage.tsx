import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Copy, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { useTopicOverview } from "@/features/topic";
import { TOKEN } from "@/shared/theme/tokens";
import { useLobby } from "../hooks/useLobby";
import { useLeaveLobby, useLobbyJoin } from "../hooks/useLobbies";

/**
 * Salle d'attente d'un salon privé : lien de partage `/join/{lobbyId}` (+ QR). Dès que le
 * second joueur a rejoint, la partie est créée et redirige vers l'arène.
 */
export function LobbyPage() {
  const { lobbyId = "" } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const { lobby, isLoading, isError } = useLobby(lobbyId);
  const leave = useLeaveLobby(lobbyId);
  const cancel = useLeaveLobby(lobbyId, true);
  const topicQuery = useTopicOverview(lobby.topicId ?? "");
  const [copied, setCopied] = useState(false);

  useLobbyJoin(lobbyId);

  useEffect(() => {
    if (lobby.gameId) {
      navigate(`/duel/${lobby.gameId}`, { replace: true });
    }
  }, [lobby.gameId, navigate]);

  if (lobby.status === "CANCELLED" || lobby.status === "EXPIRED" || lobby.status === "FAILED" || isError) {
    const title =
      lobby.status === "EXPIRED"
        ? "Salon expiré"
        : lobby.status === "FAILED"
          ? "Partie impossible à créer"
          : lobby.status === "CANCELLED"
            ? "Salon annulé"
            : "Salon introuvable";
    return (
      <div className="grid h-full place-items-center bg-background p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="text-lg font-semibold">{title}</div>
          <Button className="w-full" onClick={() => navigate("/lobbies")}>
            Retour aux salons
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && !lobby.topicId) {
    return (
      <div className="grid h-full place-items-center bg-background p-6 text-sm text-muted-foreground">
        Préparation du salon…
      </div>
    );
  }

  const topic = topicQuery.data?.topic;
  const shareUrl = `${window.location.origin}/join/${lobbyId}`;

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <button
        onClick={() => leave.mutate()}
        aria-label="Quitter le salon"
        className="qu-hoverable absolute top-4 right-[18px] z-20 flex size-[34px] items-center justify-center rounded-md border border-border bg-foreground/5 text-muted-foreground"
      >
        <X size={16} />
      </button>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="text-lg font-heading font-extrabold tracking-tight">
          {topic?.name ?? "Salon"}
        </div>
        <p className="max-w-[420px] text-[13px] leading-relaxed text-muted-foreground">
          Partage ce lien avec ton adversaire. Dès qu&apos;il l&apos;ouvre, la partie démarre.
        </p>
        <div className="flex w-full max-w-[460px] items-center gap-2 rounded-md border bg-card px-3 py-2">
          <span
            data-testid="share-url"
            className="min-w-0 flex-1 truncate text-left text-xs text-muted-foreground"
          >
            {shareUrl}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copié" : "Copier"}
          </Button>
        </div>
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG value={shareUrl} size={148} />
        </div>
        <p className="text-xs text-muted-foreground">En attente qu&apos;un adversaire rejoigne…</p>
        <Button variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
          Annuler le salon
        </Button>
      </div>
    </div>
  );
}
