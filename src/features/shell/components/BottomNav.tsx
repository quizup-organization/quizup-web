import { useLocation, useNavigate } from "react-router-dom";
import { BottomNavBar, type BottomNavItem } from "@/components/ui/bottom-nav-bar";
import { useUnreadNotificationsCount } from "@/features/notifications";
import { MOBILE_NAV, type NavItem } from "./navigation";

function isActiveRoute(item: NavItem, pathname: string): boolean {
  if (item.path === "/") return pathname === "/";
  // La fiche joueur (`/players/:id`) appartient à l'univers Personnes.
  if (item.id === "people") {
    return pathname.startsWith("/people") || pathname.startsWith("/players");
  }
  // Le profil couvre aussi Réglages (même univers côté joueur).
  if (item.id === "profile") {
    return pathname.startsWith("/profile") || pathname.startsWith("/settings");
  }
  return pathname.startsWith(item.path);
}

/** Barre de navigation basse mobile : routeur + badge de notifications non lues. */
export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unread = useUnreadNotificationsCount();
  const count = unread.data?.count ?? 0;

  const activeId =
    MOBILE_NAV.find((item) => isActiveRoute(item, pathname))?.id ?? null;

  const items: BottomNavItem[] = MOBILE_NAV.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    badge:
      item.id === "notifications" && count > 0 ? (
        <span className="absolute -top-1 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-heading text-[10px] font-bold text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : undefined,
  }));

  return (
    <BottomNavBar
      items={items}
      activeId={activeId}
      onSelect={(id) => {
        const item = MOBILE_NAV.find((entry) => entry.id === id);
        if (item) navigate(item.path);
      }}
    />
  );
}
