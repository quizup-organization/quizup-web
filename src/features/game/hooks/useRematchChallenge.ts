import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/shared/types/api";
import { challengesService } from "../lib/challenges";

/** Cadence de sondage du défi de revanche (accepté → salle, refusé → issue). */
const POLL_MS = 2_000;

export type RematchState = "idle" | "pending" | "accepted" | "refused";

export interface RematchChallengeResult {
  /** Lance une revanche vers l'adversaire : bouton en attente puis navigation auto en salle. */
  start: (params: { topicId: string; opponentId: string }) => void;
  /** Défi envoyé, en attente de la réponse de l'adversaire. */
  pending: boolean;
  /** Défi refusé (ou expiré/annulé) : le bouton reste désactivé et affiche l'issue. */
  refused: boolean;
}

/**
 * Revanche en défi nominatif : crée le défi puis **suit sa réponse** — accepté → navigation
 * automatique vers la salle (le client y fait son apparition), refusé/expiré → toast + bouton
 * définitivement désactivé. Le suivi s'arrête au démontage (navigation, fermeture).
 */
export function useRematchChallenge(): RematchChallengeResult {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [state, setState] = useState<RematchState>("idle");
  const challengeIdRef = useRef<string | null>(null);

  const start = useCallback(
    (params: { topicId: string; opponentId: string }): void => {
      if (state !== "idle") return;
      setState("pending");
      challengesService
        .create(params.topicId, params.opponentId, { skipErrorBus: true })
        .then((created) => {
          challengeIdRef.current = created.id;
          void queryClient.invalidateQueries({
            queryKey: queryKeys.challenges.mine(),
          });
        })
        .catch(() => {
          setState("idle");
          toast.error("Impossible d'envoyer la revanche");
        });
    },
    [state, queryClient],
  );

  useEffect(() => {
    if (state !== "pending") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const refuse = (message: string) => {
      setState("refused");
      toast.error(message);
    };

    const poll = async (): Promise<void> => {
      const id = challengeIdRef.current;
      if (!id || cancelled) return;
      try {
        const challenge = await challengesService.get(id, {
          skipErrorBus: true,
        });
        if (cancelled) return;
        if (challenge.status === "ACCEPTED" && challenge.roomId) {
          setState("accepted");
          navigate(`/rooms/${challenge.roomId}`);
          return;
        }
        if (challenge.status === "DECLINED") {
          refuse("Revanche refusée");
          return;
        }
        if (
          challenge.status === "EXPIRED" ||
          challenge.status === "CANCELLED"
        ) {
          refuse("Revanche expirée");
          return;
        }
        timer = setTimeout(() => void poll(), POLL_MS);
      } catch (error) {
        if (cancelled) return;
        if ((error as ApiError | undefined)?.statusCode === 404) {
          refuse("Revanche expirée");
          return;
        }
        timer = setTimeout(() => void poll(), POLL_MS * 2);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state, navigate]);

  return {
    start,
    pending: state === "pending",
    refused: state === "refused",
  };
}
