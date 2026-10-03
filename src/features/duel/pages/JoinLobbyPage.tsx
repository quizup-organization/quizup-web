import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGoBack } from "@/shared/hooks/useGoBack";
import { TOKEN } from "@/shared/theme/tokens";
import { lobbiesService } from "../lib/lobbies";

/**
 * Point d'entrée d'un lien de partage `/join/{lobbyId}` : rejoint le salon privé puis
 * ouvre sa salle d'attente. L'utilisateur doit être authentifié (retour après login géré).
 */
export function JoinLobbyPage() {
  const { lobbyId = "" } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack("/notifications");
  const ran = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!lobbyId || ran.current) return;
    ran.current = true;
    lobbiesService
      .join(lobbyId)
      .then(() => navigate(`/lobbies/${lobbyId}`, { replace: true }))
      .catch(() => setError(true));
  }, [lobbyId, navigate]);

  if (error) {
    return (
      <div
        className="grid h-full place-items-center p-6"
        style={{ background: TOKEN.duelBg }}
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="text-lg font-heading font-bold">
            Salon introuvable ou fermé
          </div>
          <Button className="w-full" onClick={goBack}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid h-full place-items-center p-6 text-sm"
      style={{ background: TOKEN.duelBg, color: TOKEN.mutedFg }}
    >
      Connexion au salon…
    </div>
  );
}
