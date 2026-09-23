import { LogOut, Monitor, Moon, Settings, Sun, SunMoon, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/shared/components/user-avatar";
import { useTheme } from "../providers/theme-context";
import type { Theme } from "../stores/useThemeStore";
import { titleForLevel, xpProgress } from "@/shared/utils/level";

export interface PlayerSummary {
  name: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
}

interface ProfileMenuProps {
  player: PlayerSummary;
  collapsed?: boolean;
  compact?: boolean;
  onProfile: () => void;
  onSettings?: () => void;
  onLogout: () => void;
  align?: "start" | "end";
  side?: "top" | "bottom";
}

/** Bouton profil + menu shadcn (Profil / Apparence / Réglages / Déconnexion). */
export function ProfileMenu({
  player,
  collapsed,
  compact,
  onProfile,
  onSettings,
  onLogout,
  align = "start",
  side = "top",
}: ProfileMenuProps) {
  const { theme, setTheme } = useTheme();
  const themeLabel =
    theme === "light" ? "Clair" : theme === "system" ? "Système" : "Sombre";
  const xpPct = xpProgress(player.xp, player.xpForNextLevel);

  const trigger = compact ? (
    <button
      aria-label="Menu du profil"
      className="inline-flex size-9 items-center justify-center rounded-3xl border bg-card hover:bg-muted"
    >
      <UserAvatar name={player.name} face size={26} ring={false} />
    </button>
  ) : (
    <button
      className={
        "flex w-full items-center gap-2.5 rounded-2xl border bg-muted/50 text-left hover:bg-muted " +
        (collapsed ? "justify-center p-1.5" : "p-2.5")
      }
    >
      <UserAvatar name={player.name} face size={collapsed ? 30 : 34} />
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{player.name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Niveau {player.level} · {titleForLevel(player.level)}
          </div>
          <Progress value={xpPct} className="mt-1.5 [&>[data-slot=progress-track]]:h-1" />
        </div>
      )}
    </button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent side={side} align={align} className="w-60">
        <div className="px-3 py-2.5 text-xs text-muted-foreground">
          <div className="text-sm font-semibold text-foreground">{player.name}</div>
          <div className="mt-0.5">
            Niveau {player.level} · {player.xp} XP
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfile}>
          <UserRound /> Profil
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <SunMoon />
            <span className="flex min-w-0 flex-col items-start leading-tight">
              <span>Apparence</span>
              <span className="text-xs font-normal text-muted-foreground">
                {themeLabel}
              </span>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as Theme)}
            >
              <DropdownMenuRadioItem value="light">
                <Sun /> Clair
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon /> Sombre
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor /> Système
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={onSettings}>
          <Settings /> Réglages
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut /> Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
