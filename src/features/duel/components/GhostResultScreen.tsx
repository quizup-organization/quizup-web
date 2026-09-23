import { Check, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar, type AvatarIdentity } from "@/shared/components/user-avatar";
import { TOKEN } from "@/shared/theme/tokens";
import { ROUNDS } from "../lib/duel-constants";
import { Confetti } from "./Confetti";

interface GhostResultScreenProps {
  /** "record" = run enregistré (adversaire absent) ; "compare" = rejeu contre un run. */
  variant: "record" | "compare";
  playerName: string;
  opponentName: string;
  playerAvatar?: AvatarIdentity;
  opponentAvatar?: AvatarIdentity;
  topicName: string;
  myScore: number;
  otherScore?: number;
  correct?: number;
  xpGain?: number;
  onExit: () => void;
}

/** Fin d'un duel asynchrone (fantôme) — enregistrement d'un run ou comparaison avec un run. */
export function GhostResultScreen({
  variant,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  topicName,
  myScore,
  otherScore = 0,
  correct,
  xpGain,
  onExit,
}: GhostResultScreenProps) {
  const win = myScore > otherScore;
  const draw = myScore === otherScore;
  const accent =
    variant === "record"
      ? TOKEN.primary
      : draw
        ? TOKEN.score
        : win
          ? TOKEN.correctAccent
          : TOKEN.wrongAccent;
  const title =
    variant === "record"
      ? "Run enregistré"
      : draw
        ? "Égalité"
        : win
          ? "Victoire"
          : "Défaite";

  return (
    <div
      className="qu-pop relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden"
      style={{ background: TOKEN.duelBg, padding: 30 }}
    >
      {variant === "compare" && win && <Confetti />}
      <div
        style={{
          color: accent,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
        }}
      >
        {variant === "record" ? "SESSION ENREGISTRÉE" : "FIN DE LA SESSION"}
      </div>
      <div
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: accent,
          lineHeight: 1.1,
          marginTop: 4,
        }}
      >
        {title}
      </div>

      <div className="flex items-center" style={{ gap: 40, marginTop: 26 }}>
        <div className="flex flex-col items-center" style={{ width: 150 }}>
          <UserAvatar
            name={playerName}
            userId={playerAvatar?.userId}
            avatarOptions={playerAvatar?.avatarOptions}
            size={62}
          />
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 10 }}>
            {playerName}
          </div>
          <div
            style={{
              fontFamily: TOKEN.fontDisplay,
              fontSize: 40,
              fontWeight: 800,
              color: TOKEN.score,
              lineHeight: 1.1,
            }}
          >
            {myScore}
          </div>
        </div>
        {variant === "compare" && (
          <div className="flex flex-col items-center" style={{ width: 150 }}>
            <UserAvatar
              name={opponentName}
              userId={opponentAvatar?.userId}
              avatarOptions={opponentAvatar?.avatarOptions}
              size={62}
            />
            <div
              className="truncate"
              style={{ fontSize: 13.5, fontWeight: 600, marginTop: 10, maxWidth: 150 }}
            >
              {opponentName}
            </div>
            <div
              style={{
                fontFamily: TOKEN.fontDisplay,
                fontSize: 40,
                fontWeight: 800,
                color: TOKEN.mutedFg,
                lineHeight: 1.1,
              }}
            >
              {otherScore}
            </div>
          </div>
        )}
      </div>

      {typeof correct === "number" && (
        <div style={{ color: TOKEN.mutedFg, fontSize: 12.5, marginTop: 12 }}>
          {correct} bonne{correct > 1 ? "s" : ""} réponse{correct > 1 ? "s" : ""} sur{" "}
          {ROUNDS}
          {xpGain ? ` · +${xpGain} XP` : ""} sur {topicName}
        </div>
      )}

      <div
        className="flex items-center gap-2.5"
        style={{
          marginTop: 22,
          padding: "12px 16px",
          borderRadius: 12,
          background: TOKEN.muted,
          border: `1px solid ${TOKEN.border}`,
          maxWidth: 460,
        }}
      >
        <Save size={16} color={TOKEN.primary} />
        <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          {variant === "record" ? (
            <>
              Ta session est enregistrée. <strong>{opponentName}</strong> pourra la
              rejouer quand il acceptera le défi.
            </>
          ) : (
            <>
              Session terminée contre le run de <strong>{opponentName}</strong>.
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2.5" style={{ marginTop: 26 }}>
        <Button size="lg" variant="outline" onClick={onExit}>
          <Undo2 size={16} /> {variant === "record" ? "Retour au lobby" : "Retour"}
        </Button>
      </div>

      <div
        className="flex items-center gap-1.5"
        style={{ marginTop: 16, color: TOKEN.mutedFg, fontSize: 11 }}
      >
        <Check size={12} /> Comparaison des runs asynchrones
      </div>
    </div>
  );
}
