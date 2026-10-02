import { LogOut, Monitor, Moon, Settings, Sun, SunMoon, UserRound } from "lucide-react";
import { Button, Dropdown, Label } from "@heroui/react";
import { cn } from "cn";
import { UserAvatar } from "@/shared/components/user-avatar";
import { useTheme } from "../providers/theme-context";
import type { Theme } from "../stores/useThemeStore";

export interface PlayerSummary {
  name: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  userId?: string;
  avatarOptions?: string;
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

/** Bouton profil + menu HeroUI (Profil / Apparence / Réglages / Déconnexion). */
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

  const trigger = compact ? (
    <Button
      isIconOnly
      variant="ghost"
      aria-label="Menu du profil"
      className="rounded-full"
    >
      <UserAvatar
        name={player.name}
        userId={player.userId}
        avatarOptions={player.avatarOptions}
        size={26}
      />
    </Button>
  ) : (
    <Button
      variant="ghost"
      fullWidth
      className={cn(
        "h-auto justify-start gap-2.5 rounded-2xl p-2.5 text-left font-normal",
        collapsed && "justify-center p-1.5",
      )}
    >
      <UserAvatar
        name={player.name}
        userId={player.userId}
        avatarOptions={player.avatarOptions}
        size={collapsed ? 30 : 34}
      />
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {player.name}
        </span>
      )}
    </Button>
  );

  return (
    <Dropdown>
      {trigger}
      <Dropdown.Popover placement={`${side} ${align}`} className="w-60">
        <div className="px-3 py-2.5">
          <div className="text-sm font-semibold text-foreground">{player.name}</div>
        </div>
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "profile") onProfile();
            else if (key === "settings") onSettings?.();
            else if (key === "logout") onLogout();
          }}
        >
          <Dropdown.Item id="profile" textValue="Profil">
            <UserRound /> <Label>Profil</Label>
          </Dropdown.Item>
          <Dropdown.SubmenuTrigger>
            <Dropdown.Item id="appearance" textValue="Apparence">
              <SunMoon />
              <span className="flex min-w-0 flex-col items-start leading-tight">
                <Label>Apparence</Label>
                <span className="text-xs font-normal text-muted">{themeLabel}</span>
              </span>
              <Dropdown.SubmenuIndicator />
            </Dropdown.Item>
            <Dropdown.Popover>
              <Dropdown.Menu
                selectionMode="single"
                selectedKeys={[theme]}
                onSelectionChange={(keys) => {
                  const [key] = keys;
                  if (typeof key === "string") setTheme(key as Theme);
                }}
              >
                <Dropdown.Item id="light" textValue="Clair">
                  <Sun /> <Label>Clair</Label>
                  <Dropdown.ItemIndicator type="dot" />
                </Dropdown.Item>
                <Dropdown.Item id="dark" textValue="Sombre">
                  <Moon /> <Label>Sombre</Label>
                  <Dropdown.ItemIndicator type="dot" />
                </Dropdown.Item>
                <Dropdown.Item id="system" textValue="Système">
                  <Monitor /> <Label>Système</Label>
                  <Dropdown.ItemIndicator type="dot" />
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.SubmenuTrigger>
          <Dropdown.Item id="settings" textValue="Réglages">
            <Settings /> <Label>Réglages</Label>
          </Dropdown.Item>
          <Dropdown.Item id="logout" textValue="Se déconnecter" variant="danger">
            <LogOut /> <Label>Se déconnecter</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
