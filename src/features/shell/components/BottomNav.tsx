import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  BottomNavBar,
  type BottomNavItem,
} from "@/components/ui/bottom-nav-bar"
import { useUnreadNotificationsCount } from "@/features/notifications"
import { useSocialPending } from "@/features/social"
import { useTextInputFocus } from "@/shared/hooks/useTextInputFocus"
import { useBottomNavStore } from "../stores/useBottomNavStore"
import { NavBadge } from "./NavBadge"
import { MOBILE_NAV, isNavItemActive } from "./navigation"

interface BottomNavProps {
  /** Masquée pendant le scroll vers le bas (comportement natif). */
  hidden?: boolean
}

/** Barre de navigation basse mobile : routeur + badges (notifications non lues, Social en attente). */
export function BottomNav({ hidden = false }: BottomNavProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const variant = useBottomNavStore((state) => state.variant)
  const unread = useUnreadNotificationsCount()
  const unreadCount = unread.data?.count ?? 0
  const pending = useSocialPending()
  // Clavier mobile ouvert (champ texte focalisé) : la nav serait recouverte, on la masque.
  const keyboardOpen = useTextInputFocus()

  if (keyboardOpen) {
    return null
  }

  const activeId =
    MOBILE_NAV.find((item) => isNavItemActive(item, pathname))?.id ?? null

  const items: BottomNavItem[] = MOBILE_NAV.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
    icon: item.icon,
    badge:
      item.id === "notifications" ? (
        <NavBadge count={unreadCount} />
      ) : item.id === "social" ? (
        <NavBadge count={pending.total} />
      ) : undefined,
  }))

  return (
    <BottomNavBar
      items={items}
      activeId={activeId}
      hidden={hidden}
      variant={variant}
      onSelect={(id) => {
        const item = MOBILE_NAV.find((entry) => entry.id === id)
        if (item) void navigate(item.path)
      }}
    />
  )
}
