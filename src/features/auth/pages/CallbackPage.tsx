import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeLogin } from "@/lib/auth";
import { useSessionStore } from "../stores/useSessionStore";

/** Retour du parcours OIDC : échange le code d'autorisation puis redirige. */
export function CallbackPage() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    completeLogin()
      .then((user) => {
        useSessionStore.getState().setSession(true);
        const state = (user.state as string | undefined) ?? "/";
        navigate(state, { replace: true });
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Échec de la connexion");
      });
  }, [navigate]);

  return (
    <div className="grid min-h-svh place-items-center p-6 text-center">
      {error ? (
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Connexion impossible</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Connexion en cours…</p>
      )}
    </div>
  );
}
