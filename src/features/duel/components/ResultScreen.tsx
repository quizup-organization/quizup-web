import { Check, Minus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { TOKEN } from "@/theme/tokens";
import { ROUNDS } from "../lib/duel-constants";
import { Confetti } from "./Confetti";

interface ResultLogEntry {
  youOk: boolean;
  gy: number;
}

interface ResultScreenProps {
  playerName: string;
  opponentName: string;
  opponentColor?: string;
  scores: { you: number; them: number };
  /** Issue autoritaire (gère le forfait à égalité de score) ; sinon dérivée des scores. */
  outcome?: "win" | "loss" | "draw";
  log: ResultLogEntry[];
  topicName: string;
  xpGain: number;
  onExit: () => void;
  onReplay?: () => void;
  replayPending?: boolean;
}

export function ResultScreen({
  playerName,
  opponentName,
  opponentColor,
  scores,
  outcome,
  log,
  topicName,
  xpGain,
  onExit,
  onReplay,
  replayPending,
}: ResultScreenProps) {
  const win = outcome ? outcome === "win" : scores.you > scores.them;
  const draw = outcome ? outcome === "draw" : scores.you === scores.them;
  const accent = draw ? TOKEN.score : win ? TOKEN.correctAccent : TOKEN.wrongAccent;
  const correct = log.filter((entry) => entry.youOk).length;

  return (
    <div
      className="qu-pop relative flex min-h-svh flex-1 flex-col items-center justify-center"
      style={{ background: TOKEN.duelBg, padding: 30, overflowY: "auto" }}
    >
      {win && <Confetti />}
      <div
        style={{
          color: accent,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
        }}
      >
        FIN DU DUEL
      </div>
      <div
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: 46,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: accent,
          lineHeight: 1.1,
          marginTop: 4,
        }}
      >
        {draw ? "Égalité" : win ? "Victoire" : "Défaite"}
      </div>

      <div className="flex items-center" style={{ gap: 40, marginTop: 28 }}>
        <div className="flex flex-col items-center" style={{ width: 150 }}>
          <UserAvatar
            name={playerName}
            face
            size={64}
            glow={win ? TOKEN.correctAccent : TOKEN.border}
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
            {scores.you}
          </div>
        </div>
        <Zap size={26} fill={TOKEN.mutedFg} color={TOKEN.mutedFg} strokeWidth={0} />
        <div className="flex flex-col items-center" style={{ width: 150 }}>
          <UserAvatar
            name={opponentName}
            color={opponentColor}
            size={64}
            glow={!win && !draw ? TOKEN.correctAccent : TOKEN.border}
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
            {scores.them}
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-1.5"
        style={{ marginTop: 26, flexWrap: "wrap", justifyContent: "center" }}
      >
        {log.map((entry, index) => (
          <div
            key={index}
            title={`Tour ${index + 1} — ${entry.youOk ? `+${entry.gy} points` : "aucun point"}`}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: entry.youOk ? TOKEN.correct : TOKEN.secondary,
              border: `1px solid ${entry.youOk ? TOKEN.correctAccent : TOKEN.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: entry.youOk ? TOKEN.correctFg : TOKEN.mutedFg,
            }}
          >
            {entry.youOk ? <Check size={13} /> : <Minus size={13} />}
          </div>
        ))}
      </div>
      <div style={{ color: TOKEN.mutedFg, fontSize: 12.5, marginTop: 10 }}>
        {correct} bonne{correct > 1 ? "s" : ""} réponse
        {correct > 1 ? "s" : ""} sur {ROUNDS} · +{xpGain} XP sur {topicName}
      </div>

      <div
        className="flex items-center gap-2.5"
        style={{ marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}
      >
        <Button size="lg" onClick={onExit}>
          Retour au sujet
        </Button>
        {onReplay && (
          <Button
            size="lg"
            variant="outline"
            onClick={onReplay}
            disabled={replayPending}
          >
            Rejouer
          </Button>
        )}
      </div>
    </div>
  );
}
