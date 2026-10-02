import { Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Chip } from "@heroui/react";
import { TopicIcon } from "@/shared/components/topic-icon";
import { getSessionUserId as getUserId } from "@/features/auth";
import {
  CHALLENGE_OUTCOME_LABEL,
  CHALLENGE_STATUS_LABEL,
  challengeOutcome,
  type ChallengeCard,
} from "../domain/challenge";

function timeLeftLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expiré";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} h`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min`;
}

interface ChallengeRowProps {
  card: ChallengeCard;
  onAccept: (challengeId: string) => void;
  onDecline: (challengeId: string) => void;
  onCancel: (challengeId: string) => void;
  pending: boolean;
}

export function ChallengeRow({
  card,
  onAccept,
  onDecline,
  onCancel,
  pending,
}: ChallengeRowProps) {
  const navigate = useNavigate();
  const userId = getUserId();
  const otherName = card.opponent.pseudonym ?? "Joueur";
  const isPending = card.status === "PENDING";
  const outcome = challengeOutcome(card.status, card.winnerId, userId);
  const canAccept = card.actions.includes("ACCEPT");
  const canDecline = card.actions.includes("DECLINE");
  const canCancel = card.actions.includes("CANCEL");
  const canPlay = card.actions.includes("PLAY") && !!card.gameId;

  return (
    <Card className="gap-0 py-4">
      <div className="flex items-center gap-3">
        <TopicIcon topic={card.topic} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {card.direction === "RECEIVED"
              ? `${otherName} te défie`
              : `Tu défies ${otherName}`}
          </div>
          <div className="truncate text-xs text-muted">
            {card.topic.name} ·{" "}
            {isPending
              ? `expire dans ${timeLeftLabel(card.expiresAt)}`
              : outcome
                ? CHALLENGE_OUTCOME_LABEL[outcome].toLowerCase()
                : CHALLENGE_STATUS_LABEL[
                    card.status as Exclude<typeof card.status, "PENDING">
                  ].toLowerCase()}
          </div>
        </div>

        {isPending ? (
          card.direction === "RECEIVED" ? (
            <div className="flex shrink-0 items-center gap-2">
              {canAccept && (
                <Button
                  size="sm"
                  isDisabled={pending}
                  onPress={() => onAccept(card.challengeId)}
                >
                  Accepter
                </Button>
              )}
              {canDecline && (
                <Button
                  variant="ghost"
                  size="sm"
                  isDisabled={pending}
                  onPress={() => onDecline(card.challengeId)}
                >
                  Refuser
                </Button>
              )}
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                isDisabled={pending}
                onPress={() => navigate(`/challenges/${card.challengeId}`)}
              >
                Ouvrir le lobby
              </Button>
              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  isDisabled={pending}
                  onPress={() => onCancel(card.challengeId)}
                >
                  Annuler
                </Button>
              )}
            </div>
          )
        ) : canPlay ? (
          <Button
            size="sm"
            className="shrink-0"
            onPress={() => navigate(`/duel/${card.gameId}`)}
          >
            <Swords /> Jouer
          </Button>
        ) : (
          <Chip
            size="sm"
            variant="soft"
            color={card.status === "ACCEPTED" ? "accent" : "default"}
          >
            {outcome
              ? CHALLENGE_OUTCOME_LABEL[outcome]
              : CHALLENGE_STATUS_LABEL[
                  card.status as Exclude<typeof card.status, "PENDING">
                ]}
          </Chip>
        )}
      </div>
    </Card>
  );
}
