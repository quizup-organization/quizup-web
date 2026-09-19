import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { TOKEN } from "@/theme/tokens";

export type AnswerState = "idle" | "selected" | "correct" | "wrong" | "muted";

function Notch({ side }: { side: "left" | "right" }) {
  const style: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 17,
    height: 40,
    background: TOKEN.duelBg,
    pointerEvents: "none",
    clipPath:
      side === "left"
        ? "polygon(0 0, 100% 50%, 0 100%)"
        : "polygon(100% 0, 0 50%, 100% 100%)",
  };
  style[side] = 0;
  return <span aria-hidden="true" style={style} />;
}

const PALETTE: Record<AnswerState, { background: string; color: string }> = {
  idle: { background: TOKEN.duelSurface, color: TOKEN.duelSurfaceFg },
  selected: { background: TOKEN.duelSurfaceMuted, color: TOKEN.duelSurfaceFg },
  correct: { background: TOKEN.correct, color: TOKEN.correctFg },
  wrong: { background: TOKEN.wrong, color: TOKEN.wrongFg },
  muted: {
    background: TOKEN.duelSurfaceMuted,
    color: TOKEN.duelSurfaceMutedFg,
  },
};

interface AnswerCardProps {
  label: string;
  state: AnswerState;
  notchLeft?: boolean;
  notchRight?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** Variante compacte : grille 2×2 quand la question affiche une image. */
  compact?: boolean;
}

export function AnswerCard({
  label,
  state,
  notchLeft,
  notchRight,
  onClick,
  disabled,
  compact,
}: AnswerCardProps) {
  const palette = PALETTE[state];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={notchLeft}
      className={cn(
        "qu-answer relative",
        state === "correct" && "qu-correct-pop",
        state === "wrong" && "qu-shake",
      )}
      style={{
        background: palette.background,
        color: palette.color,
        border: "none",
        width: "100%",
        height: compact ? "clamp(52px, 9.5vh, 104px)" : "clamp(64px, 13.9vh, 156px)",
        borderRadius: 8,
        padding: compact ? "0 16px" : "0 30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: TOKEN.fontSans,
        fontSize: compact ? "clamp(14px, 2.2vh, 22px)" : "clamp(16px, 2.6vh, 28px)",
        fontWeight: 600,
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {label}
      {notchLeft && <Notch side="left" />}
      {notchRight && <Notch side="right" />}
    </button>
  );
}
