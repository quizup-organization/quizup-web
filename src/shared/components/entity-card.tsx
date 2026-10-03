import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { cn } from "cn";
import { entityCardBackground } from "@/shared/utils/entity-card";

interface EntityCardProps {
  /** Couleur d'accent (hex, token CSS). Défaut : couleur primaire du thème. */
  accent?: string;
  /** Visuel de tête : `TopicIcon`. */
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
 * Carte de sujet : bordure et dégradé teintés par l'accent, visuel à gauche, nom en display
 * et sous-titre en capitales colorées. Le survol ne joue que sur la **couleur de bordure**
 * (accent renforcé).
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
        "entity-card flex items-center gap-3.5 rounded-2xl border p-3.5 text-left",
        interactive &&
          "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
      style={
        {
          "--qu-accent": accent,
          "--qu-bg": entityCardBackground(accent),
        } as CSSProperties
      }
    >
      {visual}
      <div className="min-w-0 flex-1">
        <div
          className="line-clamp-2 font-heading text-[13px] leading-tight font-extrabold tracking-tight"
          title={title}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="mt-0.5 truncate text-[9px] leading-none font-medium tracking-[0.1em] uppercase"
            style={{ color: accent }}
            title={subtitle}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing}
    </div>
  );
}
