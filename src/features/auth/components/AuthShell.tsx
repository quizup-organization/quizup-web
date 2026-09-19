import type { ReactNode } from "react";
import { Zap } from "lucide-react";

/**
 * Layout des écrans d'auth (blocs shadcn `login-02` / `signup-02`) : formulaire à gauche,
 * visuel de couverture à droite (masqué en mobile). La couverture est toujours sombre
 * (tokens duel) pour rester lisible en thème clair comme sombre.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh w-full">
      <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-10">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <div className="inline-flex size-7 items-center justify-center rounded-lg bg-foreground">
            <Zap size={15} className="text-background" fill="currentColor" strokeWidth={0} />
          </div>
          <span className="text-sm font-semibold">QuizUp</span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[320px]">{children}</div>
        </div>
      </div>

      <div
        className="relative hidden flex-col items-center justify-center gap-[18px] border-l p-10 text-center lg:flex"
        style={{
          flex: "0 0 46%",
          backgroundColor: "var(--duel-bg)",
          background:
            "linear-gradient(150deg, color-mix(in srgb, var(--primary) 32%, transparent), var(--duel-bg))",
        }}
      >
        <div className="inline-flex size-32 items-center justify-center rounded-full border-[3px] border-[var(--duel-surface)] bg-[var(--duel-bg)]">
          <Zap
            size={52}
            className="text-[var(--duel-surface)]"
            fill="currentColor"
            strokeWidth={0}
          />
        </div>
        <div className="font-heading text-[26px] font-extrabold tracking-[-0.03em] text-[var(--duel-surface)]">
          Duels de culture
        </div>
        <p className="max-w-[34ch] text-[13.5px] leading-relaxed text-[var(--duel-surface-muted)]">
          Sept tours, dix secondes par question. Défie le monde, un bot, ou les joueurs
          que tu suis — et grimpe au classement.
        </p>
      </div>
    </div>
  );
}
