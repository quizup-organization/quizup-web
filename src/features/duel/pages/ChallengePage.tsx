import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/features/shell";
import { getSessionUserId } from "@/features/auth";
import { UserAvatar } from "@/shared/components/user-avatar";
import { useGoBack } from "@/shared/hooks/useGoBack";
import { useChallenge, useChallengeActions } from "../hooks/useChallenge";

/** Heure locale courte d'expiration (le défi vit 1 h). */
function expiresLabel(expiresAt: string): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Suivi d'un défi nominatif (intention asynchrone) : en attente de la réponse, puis bascule
 * automatique vers la salle temps réel dès que le défi est accepté (`roomId`).
 */
export function ChallengePage() {
  const { challengeId = "" } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack("/notifications");
  const { data, isLoading, isError } = useChallenge(challengeId);
  const actions = useChallengeActions(challengeId);
  const me = getSessionUserId();

  const roomId = data?.status === "ACCEPTED" ? data.roomId : null;
  useEffect(() => {
    if (roomId) {
      navigate(`/lobbies/${roomId}`, { replace: true });
    }
  }, [roomId, navigate]);

  if (isLoading) {
    return (
      <PageContainer className="max-w-[560px]">
        <p className="py-10 text-center text-sm text-muted-foreground">
          Chargement du défi…
        </p>
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer className="max-w-[560px]">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-lg font-heading font-bold">Défi introuvable</p>
          <Button onClick={goBack}>Retour</Button>
        </div>
      </PageContainer>
    );
  }

  const isChallenger = me === data.challenger?.userId;
  const other = isChallenger ? data.opponent : data.challenger;
  const otherName = other?.pseudonym ?? "ton adversaire";

  const title =
    data.status === "PENDING"
      ? "Défi envoyé"
      : data.status === "ACCEPTED"
        ? "Défi accepté"
        : data.status === "DECLINED"
          ? isChallenger
            ? "Défi refusé"
            : "Tu as refusé le défi"
          : data.status === "CANCELLED"
            ? "Défi annulé"
            : "Défi expiré";

  const description =
    data.status === "PENDING"
      ? isChallenger
        ? `En attente de ${otherName}…`
        : `${otherName} te défie !`
      : data.status === "ACCEPTED"
        ? "Ouverture de la salle…"
        : data.status === "DECLINED"
          ? isChallenger
            ? `${otherName} a refusé ton défi.`
            : "Tu peux relancer un défi à tout moment."
          : data.status === "CANCELLED"
            ? "Le défi a été annulé."
            : "Personne n'a répondu dans le temps imparti.";

  return (
    <PageContainer className="max-w-[560px]">
      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Swords size={14} /> {data.topic.name ?? "Sujet"}
          </div>
          {other && (
            <UserAvatar
              name={other.pseudonym ?? "Adversaire"}
              userId={other.userId}
              avatarOptions={other.avatarOptions ?? undefined}
              size={72}
            />
          )}
          <div>
            <p className="text-lg font-heading font-bold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          {data.status === "PENDING" && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {isChallenger ? (
                <Button
                  variant="outline"
                  disabled={actions.pending}
                  onClick={() => actions.cancel.mutate(undefined, { onSuccess: goBack })}
                >
                  Annuler le défi
                </Button>
              ) : (
                <>
                  <Button
                    disabled={actions.pending}
                    onClick={() => actions.accept.mutate()}
                  >
                    Accepter
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={actions.pending}
                    onClick={() => actions.decline.mutate()}
                  >
                    Refuser
                  </Button>
                </>
              )}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={12} /> Expire à {expiresLabel(data.expiresAt)}
              </span>
            </div>
          )}

          {(data.status === "DECLINED" ||
            data.status === "CANCELLED" ||
            data.status === "EXPIRED") && <Button onClick={goBack}>Retour</Button>}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
