import { useEffect, useRef } from "react";
import { gamesService } from "../lib/games";

/**
 * Délai anti-rebond du `leave` : il absorbe le double-effet de React StrictMode (montage →
 * nettoyage → remontage) sans laisser croire à un vrai départ de l'écran de résultat.
 */
const LEAVE_DEBOUNCE_MS = 500;

export interface UseResultPresenceParams {
  gameId: string;
  /** L'écran de résultat est réellement affiché (phase `result`). */
  active: boolean;
  /** Type du joueur 2 : la présence/revanche ne concerne que les duels humains. */
  player2Type: string | null;
}

/**
 * Présence de l'écran de résultat pour préparer une revanche : signale mon entrée
 * (`join`, idempotent) pour que le serveur me rende « présent » à mon adversaire, et mon
 * départ (`leave`) au démontage — différé de 500 ms pour survivre au double-effet du mode
 * strict React. Aucun aller-retour de présence pour un duel contre un bot.
 */
export function useResultPresence({
  gameId,
  active,
  player2Type,
}: UseResultPresenceParams): void {
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || player2Type !== "HUMAN" || !gameId) return;

    // Un `leave` était planifié (StrictMode ou retour sur l'écran) : on l'annule.
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    void gamesService.join(gameId).catch(() => undefined);

    return () => {
      leaveTimer.current = setTimeout(() => {
        leaveTimer.current = null;
        void gamesService.leave(gameId).catch(() => undefined);
      }, LEAVE_DEBOUNCE_MS);
    };
  }, [gameId, active, player2Type]);
}
