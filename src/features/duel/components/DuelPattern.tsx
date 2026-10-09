import { PagePattern } from "@/shared/components/page-pattern";
import { TOKEN } from "@/shared/theme/tokens";

/**
 * Texture d'icônes des écrans immersifs de duel : le `background.svg` sert de masque
 * (`.qu-pattern`), teinté clair sur le fond sombre `--duel-bg`, à faible opacité pour ne pas
 * gêner la lecture. Même matière que le fond de page de la coquille.
 */
export function DuelPattern() {
  return (
    <PagePattern tint={TOKEN.duelSurface} opacity={0.05} size="280px" />
  );
}
