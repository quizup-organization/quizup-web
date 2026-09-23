import type { ReactNode } from "react";
import { StatStrip, type StatStripItem } from "@/shared/components/stat-strip";
import { UserAvatar } from "@/shared/components/user-avatar";

interface ProfileBannerProps {
  name: string;
  avatar?: { color?: string; face?: boolean; glow?: string | null; size?: number };
  badge?: ReactNode;
  meta?: ReactNode;
  /** Ligne optionnelle (présence, etc.). */
  extra?: ReactNode;
  /** Boutons d'action, empilés dans la colonne de droite. */
  actions?: ReactNode;
  stats: StatStripItem[];
}

/**
 * Bandeau d'identité (profil courant ou fiche joueur) — avatar à gauche, identité,
 * CTA empilés à droite, puis `StatStrip` pleine largeur. Aucune couleur de fond, `border-b`.
 */
export function ProfileBanner({
  name,
  avatar,
  badge,
  meta,
  extra,
  actions,
  stats,
}: ProfileBannerProps) {
  return (
    <div data-slot="profile-banner" className="border-b">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
            <UserAvatar
              name={name}
              color={avatar?.color}
              face={avatar?.face}
              glow={avatar?.glow}
              size={avatar?.size ?? 96}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                <h1 className="font-heading text-3xl font-extrabold tracking-tight">
                  {name}
                </h1>
                {badge}
              </div>
              {meta && (
                <div className="mt-1 text-sm text-muted-foreground">{meta}</div>
              )}
              {extra && <div className="mt-1.5">{extra}</div>}
            </div>
          </div>

          {actions && (
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[200px]">
              {actions}
            </div>
          )}
        </div>

        <StatStrip className="border-t pt-3" items={stats} />
      </div>
    </div>
  );
}
