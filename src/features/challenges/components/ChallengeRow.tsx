import { Check, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TopicIcon } from "@/shared/components/topic-icon";
import type { ChallengeStatus } from "@/features/challenges/domain/challenge";
import { CHALLENGE_STATUS_LABEL } from "../domain/challenge";
import type { ChallengeView } from "../hooks/useChallenges";

function timeLeftLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expiré";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} h`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min`;
}

interface ChallengeRowProps {
  view: ChallengeView;
  onAccept: (challengeId: string) => void;
  onDecline: (challengeId: string) => void;
  onCancel: (challengeId: string) => void;
  pending: boolean;
}

export function ChallengeRow({
  view,
  onAccept,
  onDecline,
  onCancel,
  pending,
}: ChallengeRowProps) {
  const navigate = useNavigate();
  const { challenge, direction, otherName, topic } = view;
  const isPending = challenge.status === "PENDING";

  return (
    <Card size="sm" className="gap-0 py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <TopicIcon topic={topic} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {direction === "received"
              ? `${otherName} te défie`
              : `Tu défies ${otherName}`}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {topic.name} ·{" "}
            {isPending
              ? `expire dans ${timeLeftLabel(challenge.expiresAt)}`
              : CHALLENGE_STATUS_LABEL[
                  challenge.status as Exclude<ChallengeStatus, "PENDING">
                ].toLowerCase()}
          </div>
        </div>

        {isPending ? (
          direction === "received" ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() => onAccept(challenge.challengeId)}
              >
                <Check /> Accepter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onDecline(challenge.challengeId)}
              >
                Refuser
              </Button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() =>
                  navigate(`/challenges/${challenge.challengeId}`)
                }
              >
                Ouvrir le lobby
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onCancel(challenge.challengeId)}
              >
                Annuler
              </Button>
            </div>
          )
        ) : challenge.status === "ACCEPTED" && challenge.gameId ? (
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => navigate(`/duel/${challenge.gameId}`)}
          >
            <Swords /> Jouer
          </Button>
        ) : (
          <Badge variant={challenge.status === "ACCEPTED" ? "default" : "secondary"}>
            {CHALLENGE_STATUS_LABEL[challenge.status as Exclude<ChallengeStatus, "PENDING">]}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
