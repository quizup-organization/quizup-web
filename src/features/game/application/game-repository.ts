import { gamesService } from "../lib/games";
import type { GameNotification } from "@/shared/types/notifications";
import { applyGameNotification, emptyGame, type GameState } from "../domain/game";
import { recordServerInstant } from "../lib/server-clock";
import { NotificationStream } from "./notification-stream";

/** Stream d'une partie : historique REST + push STOMP `/topic/games/{gameId}`. */
export function createGameStream(
  gameId: string,
): NotificationStream<GameNotification, GameState> {
  return new NotificationStream<GameNotification, GameState>({
    service: "game",
    aggregateId: gameId,
    topic: `/topic/games/${gameId}`,
    initial: emptyGame,
    load: (id) => gamesService.getNotifications(id),
    apply: applyGameNotification,
    // Chaque trame live ré-ancre l'horloge sur le service game (autorité du timing).
    onLive: (envelope, receivedAt) => {
      const instant = Date.parse(envelope.timestamp);
      if (Number.isFinite(instant)) {
        recordServerInstant(instant, receivedAt);
      }
    },
  });
}
