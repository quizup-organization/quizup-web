import type { CSSProperties, ReactNode } from "react";
import { cn } from "cn";

interface SelectRowProps {
  /** Visuel de tête (avatar joueur, pastille de thème…). */
  visual: ReactNode;
  title: string;
  subtitle?: string | null;
  /** État sélectionné (uniquement si `onSelect` est fourni). */
  selected?: boolean;
  /** Fourni ⇒ ligne interactive (bouton + radio) ; absent ⇒ rappel statique. */
  onSelect?: () => void;
  className?: string;
}

/**
 * Ligne de sélection neutre partagée par les parcours de défi (sélection d'un joueur, d'un
 * thème) et les rappels d'adversaire : visuel, titre, sous-titre et radio optionnelle. Même
 * anatomie partout pour aligner les listes du wizard et du sélecteur de thème.
 */
export function SelectRow({
  visual,
  title,
  subtitle,
  selected = false,
  onSelect,
  className,
}: SelectRowProps) {
  const interactive = Boolean(onSelect);
  const active = interactive && selected;

  const style: CSSProperties = {
    borderColor: active ? "var(--primary)" : "var(--border)",
    background: active
      ? "color-mix(in srgb, var(--primary) 8%, transparent)"
      : "var(--card)",
  };

  const content = (
    <>
      {visual}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {subtitle && (
          <span className="block truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
      {interactive && (
        <span
          aria-hidden
          className="size-4 shrink-0 rounded-full border-2"
          style={{
            borderColor: active ? "var(--primary)" : "var(--border)",
            background: active ? "var(--primary)" : "transparent",
          }}
        />
      )}
    </>
  );

  const classes = cn(
    "flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
    interactive && "cursor-pointer",
    className,
  );

  if (!interactive) {
    return (
      <div className={classes} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button type="button" onClick={onSelect} className={classes} style={style}>
      {content}
    </button>
  );
}
