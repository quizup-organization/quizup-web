import { Zap } from "lucide-react";
import { TOKEN } from "@/shared/theme/tokens";

/**
 * Transition « iris » plein écran (référence `defie.mp4`) : jouée entre l'écran VS et
 * l'intro de tour. L'emblème éclair central grossit jusqu'à couvrir tout l'écran (disque
 * de la couleur du fond d'arène + anneau qui s'épaissit), l'éclair s'éteignant ensuite.
 *
 * Le disque porte la couleur du fond d'arène : une fois plein écran, la bascule vers
 * l'intro de tour est invisible (continuité de fond).
 */
export function CircleTransition() {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 40, overflow: "hidden" }}
    >
      <div
        className="qu-iris flex items-center justify-center"
        style={{
          width: 132,
          height: 132,
          borderRadius: 999,
          background: TOKEN.duelBg,
          border: `3px solid ${TOKEN.fg}`,
        }}
      >
        <span className="qu-iris-bolt flex items-center justify-center">
          <Zap size={50} fill={TOKEN.fg} color={TOKEN.fg} strokeWidth={0} />
        </span>
      </div>
    </div>
  );
}
