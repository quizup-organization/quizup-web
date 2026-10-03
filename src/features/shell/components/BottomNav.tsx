import { useLocation, useNavigate } from "react-router-dom";
import { BottomNavBar, type BottomNavItem } from "@/components/ui/bottom-nav-bar";
import { useUnreadNotificationsCount } from "@/features/notifications";
import { useTextInputFocus } from "@/shared/hooks/useTextInputFocus";
import { MOBILE_NAV, isNavItemActive } from "./navigation";

/** Barre de navigation basse mobile : routeur + badge de notifications non lues. */
export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unread = useUnreadNotificationsCount();
  const count = unread.data?.count ?? 0;
  // Clavier mobile ouvert (champ texte focalisé) : la nav serait recouverte, on la masque.
  const keyboardOpen = useTextInputFocus();

  if (keyboardOpen) {
    return null;
  }

  const activeId =
    MOBILE_NAV.find((item) => isNavItemActive(item, pathname))?.id ?? null;

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
