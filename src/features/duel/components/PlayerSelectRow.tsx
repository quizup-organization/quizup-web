import type { CSSProperties } from "react";
import { cn } from "cn";
import { UserAvatar } from "@/shared/components/user-avatar";

/** Joueur minimal affiché par une ligne de sélection / un rappel d'adversaire. */
export interface PlayerRef {
  id: string;
  label?: string | null;
  subtitle?: string | null;
  avatarOptions?: string | null;
}

interface PlayerSelectRowProps {
  player: PlayerRef;
  /** État sélectionné (uniquement si `onSelect` est fourni). */
  selected?: boolean;
  /** Fourni ⇒ ligne interactive (bouton + radio) ; absent ⇒ rappel statique. */
  onSelect?: () => void;
  className?: string;
}

/**
 * Ligne de sélection de joueur — carte commune au parcours « Défier un joueur » (étape de
 * sélection) et au rappel de l'adversaire dans le sélecteur de thème. Même avatar, mêmes
 * typographies et même radio que la sélection.
 */
export function PlayerSelectRow({
  player,
  selected = false,
  onSelect,
  className,
}: PlayerSelectRowProps) {
  const interactive = Boolean(onSelect);
  const active = interactive && selected;
  const name = player.label ?? "Joueur";

  const style: CSSProperties = {
    borderColor: active ? "var(--primary)" : "var(--border)",
    background: active
      ? "color-mix(in srgb, var(--primary) 8%, transparent)"
      : "var(--card)",
  };

  const content = (
    <>
      <UserAvatar
        name={name}
        userId={player.id}
        avatarOptions={player.avatarOptions ?? undefined}
        size={34}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{player.label}</span>
        {player.subtitle && (
          <span className="block truncate text-xs text-muted-foreground">
            {player.subtitle}
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
