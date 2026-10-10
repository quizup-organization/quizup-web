import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { StatStrip, type StatStripItem } from "@/shared/components/stat-strip";
import { UserAvatar } from "@/shared/components/user-avatar";

interface ProfileBannerProps {
  name: string;
  avatar?: {
    size?: number;
    userId?: string;
    avatarOptions?: string;
  };
  /** Badge crayon sur l'avatar (profil courant) : ouvre l'éditeur d'avatar. */
  onEditAvatar?: () => void;
  badge?: ReactNode;
  meta?: ReactNode;
  /** Ligne optionnelle (présence, etc.). */
  extra?: ReactNode;
  /** Boutons d'action, empilés dans la colonne de droite. */
  actions?: ReactNode;
  stats: StatStripItem[];
  /** Bloc optionnel rendu après les statistiques, sous un divider. */
  belowStats?: ReactNode;
}

/**
 * Bandeau d'identité (profil courant ou fiche joueur) — avatar à gauche, identité,
 * CTA empilés à droite, puis `StatStrip` pleine largeur. Aucune couleur de fond, `border-b`.
 */
export function ProfileBanner({
  name,
  avatar,
  onEditAvatar,
  badge,
  meta,
  extra,
  actions,
  stats,
  belowStats,
}: ProfileBannerProps) {
  return (
    <div
      data-slot="profile-banner"
      className="relative overflow-hidden border-b bg-background"
    >
      <BackgroundBeams className="opacity-60 dark:opacity-90" />
      <div className="relative mx-auto flex w-full max-w-screen-xl flex-col gap-5 px-(--page-gutter-x) py-6 tablet-up:py-8">
        <div className="flex flex-col items-center gap-5 tablet-up:flex-row tablet-up:items-center">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center tablet-up:flex-row tablet-up:items-center tablet-up:gap-5 tablet-up:text-left">
            <span className="relative shrink-0">
              <UserAvatar
                name={name}
                userId={avatar?.userId}
                avatarOptions={avatar?.avatarOptions}
                size={avatar?.size ?? 96}
              />
              {onEditAvatar && (
                <button
                  type="button"
                  onClick={onEditAvatar}
                  aria-label="Modifier l'avatar"
                  title="Modifier l'avatar"
                  className="absolute -right-0.5 -bottom-0.5 grid size-(--control-h-md) place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil size={14} aria-hidden />
                </button>
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2.5 tablet-up:justify-start">
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
            <div className="flex w-full shrink-0 flex-col gap-2 tablet-up:w-[200px]">
              {actions}
            </div>
          )}
        </div>

        <StatStrip className="border-t pt-3" items={stats} />

        {belowStats && <div className="border-t pt-3">{belowStats}</div>}
      </div>
    </div>
  );
}
