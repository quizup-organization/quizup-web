import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTopicOverview } from "@/features/topic";
import { TOKEN } from "@/shared/theme/tokens";
import { SearchingScreen } from "../components/SearchingScreen";
import { useCancelMatchmaking, useMatchmakingTicket } from "../hooks/useMatchmaking";

/**
 * Écran de recherche d'appariement public (« Défier le monde »). Bascule automatique vers
 * l'arène dès que la partie est créée (humain ou bot), ou annulation.
 *
 * Quitter l'écran pendant la recherche **annule le ticket** : sans notification d'appariement,
 * c'est le seul moyen d'éviter une partie (et un adversaire) orphelins.
 */
export function MatchmakingPage() {
  const { ticketId = "" } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { ticket, isLoading, isError } = useMatchmakingTicket(ticketId);
  const cancel = useCancelMatchmaking(ticketId);
  const topicQuery = useTopicOverview(ticket.topicId ?? "");

  const statusRef = useRef(ticket.status);
  const cancelRef = useRef(cancel);
  const pendingCancel = useRef<number | null>(null);

  useEffect(() => {
    statusRef.current = ticket.status;
  }, [ticket.status]);

  useEffect(() => {
    cancelRef.current = cancel;
  }, [cancel]);

  useEffect(() => {
    // Au (re)montage : annule le cancel programmé par le cleanup de test de StrictMode.
    if (pendingCancel.current !== null) {
      window.clearTimeout(pendingCancel.current);
      pendingCancel.current = null;
    }
    return () => {
      if (statusRef.current !== "SEARCHING") return;
      pendingCancel.current = window.setTimeout(() => {
        pendingCancel.current = null;
        void cancelRef.current.mutateAsync().catch(() => undefined);
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (ticket.status === "MATCHED" && ticket.gameId) {
      navigate(`/duel/${ticket.gameId}`, { replace: true });
    }
  }, [ticket.status, ticket.gameId, navigate]);

  if (ticket.status === "CANCELLED" || ticket.status === "FAILED" || isError) {
    return (
      <div
        className="grid h-full place-items-center p-6"
        style={{ background: TOKEN.duelBg }}
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="text-lg font-heading font-bold">
            {ticket.status === "FAILED" ? "Recherche impossible" : "Recherche annulée"}
          </div>
          <Button className="w-full" onClick={() => navigate("/topics")}>
            Retour aux sujets
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && !ticket.topicId) {
    return (
      <div
        className="grid h-full place-items-center p-6 text-sm"
        style={{ background: TOKEN.duelBg, color: TOKEN.mutedFg }}
      >
        Recherche d&apos;un adversaire…
      </div>
    );
  }

  const topic = topicQuery.data?.topic;

  return (
    <div
      className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <SearchingScreen
        topic={{
          name: topic?.name ?? "Appariement en cours",
          emoji: topic?.emoji ?? undefined,
          color: topic?.color ?? undefined,
          imageUrl: topic?.imageUrl ?? undefined,
          category: topic?.category ?? undefined,
          categoryLabel: topic?.categoryLabel ?? undefined,
        }}
      />
      <div className="flex justify-center pb-6">
        <Button variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
          Annuler la recherche
        </Button>
      </div>
    </div>
  );
}
