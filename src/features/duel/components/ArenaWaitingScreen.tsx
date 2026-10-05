import { Button } from "@/components/ui/button";
import { TOKEN } from "@/shared/theme/tokens";
import { LobbyWaitingScreen, type LobbySlot } from "./LobbyWaitingScreen";

interface ArenaWaitingScreenProps {
  topic: {
    name: string;
    emoji?: string;
    color?: string;
    imageUrl?: string;
    category?: string | null;
    categoryLabel?: string | null;
  };
  /** Le joueur courant, présence dérivée de `joinedPlayerIds`. */
  player: LobbySlot;
  /** L'adversaire, présence dérivée de `joinedPlayerIds`. */
  opponent: LobbySlot;
  onLeave: () => void;
}

/**
 * Arène avant démarrage (`CREATED`) : même salle d'attente que le salon privé, alimentée par la
 * présence temps réel des deux joueurs (`PLAYER_JOINED`/`PLAYER_LEFT`) — pas de carte générique.
 */
export function ArenaWaitingScreen({
  topic,
  player,
  opponent,
  onLeave,
}: ArenaWaitingScreenProps) {
  return (
    <div
      className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <LobbyWaitingScreen
        topic={topic}
        player={{ ...player, isMe: true }}
        opponent={opponent}
      >
        <Button variant="outline" onClick={onLeave}>
          Quitter
        </Button>
      </LobbyWaitingScreen>
    </div>
  );
}
