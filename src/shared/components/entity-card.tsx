import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { cn } from "cn";
import { entityCardBackground } from "@/shared/utils/entity-card";

interface EntityCardProps {
  /** Couleur d'accent (hex, token CSS). Défaut : couleur primaire du thème. */
  accent?: string;
  /** Visuel de tête : `TopicIcon` en mode `fill` (bandeau pleine hauteur). */
  visual: ReactNode;
  title: string;
  /** Surtitre en capitales espacées, coloré par l'accent (catégorie…). */
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  dataSlot?: string;
}

/**
 * Carte de sujet : bordure et dégradé teintés par l'accent, **bandeau visuel 80 px pleine
 * hauteur** collé au bord gauche (haut/bas/gauche comblés), nom en display et sous-titre en
 * capitales colorées à droite. Le dégradé démarre au bord du bandeau (`--qu-bg-offset`), pas
 * sous le visuel. Le survol ne joue que sur la **couleur de bordure** (accent renforcé).
 * Réservée à tablette/desktop : le compact utilise les tuiles springboard (`EntityTile`).
 */
export function EntityCard({
  accent = "var(--primary)",
  visual,
  title,
  subtitle,
  trailing,
  onClick,
  className,
  dataSlot,
}: EntityCardProps) {
  const interactive = Boolean(onClick);

  const handleKeyDown = interactive
    ? (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }
    : undefined;

  return (
    <div
      data-slot={dataSlot}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "entity-card flex min-h-20 items-stretch gap-3.5 overflow-hidden rounded-2xl border pr-3.5 text-left",
        interactive &&
          "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      style={
        {
          "--qu-accent": accent,
          "--qu-bg": entityCardBackground(accent),
          "--qu-bg-offset": "5rem",
        } as CSSProperties
      }
    >
      {/* Bandeau visuel 80 px pleine hauteur, collé haut/bas/gauche (coins droits). */}
      <span className="relative w-20 shrink-0 self-stretch overflow-hidden rounded-l-[16px]">
        {visual}
      </span>
      <div className="min-w-0 flex-1 self-center py-3">
        <div
          className="line-clamp-2 font-heading text-sm leading-tight font-extrabold tracking-tight"
          title={title}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="mt-0.5 truncate text-2xs leading-none font-medium tracking-[0.1em] uppercase"
            style={{ color: accent }}
            title={subtitle}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <span className="shrink-0 self-center">{trailing}</span>}
    </div>
  );
}
