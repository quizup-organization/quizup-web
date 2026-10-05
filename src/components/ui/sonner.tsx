import type { CSSProperties } from "react";
import {
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const ICONS = {
  success: <CircleCheck className="size-4" />,
  error: <CircleX className="size-4" />,
  warning: <TriangleAlert className="size-4" />,
  info: <Info className="size-4" />,
  loading: <LoaderCircle className="size-4 animate-spin" />,
};

/** Décalage haut : sous la topbar (4 rem + encoche), pour ne pas la recouvrir. */
const TOP_OFFSET = {
  top: "calc(env(safe-area-inset-top, 0px) + 4.75rem)",
} as const;

/**
 * Toaster applicatif (sonner) — rendu calqué sur HeroUI v3 : carte surface arrondie,
 * icône + titre teintés par variante, description muted, fermeture révélée au survol
 * (toujours visible sur mobile), pile centrée en haut sous la topbar. Thème piloté par l'appelant.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      closeButton
      gap={12}
      offset={TOP_OFFSET}
      mobileOffset={TOP_OFFSET}
      visibleToasts={3}
      icons={ICONS}
      style={{ "--width": "460px" } as CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-[24px]! bg-toast! text-toast-foreground! px-4! py-3! gap-2.5! shadow-toast! items-start! border-0!",
          title: "text-sm! leading-5! font-medium!",
          description: "text-sm! text-toast-muted!",
          icon: "mt-0.5",
          success:
            "[&_[data-title]]:text-toast-success! [&_[data-icon]]:text-toast-success!",
          error:
            "[&_[data-title]]:text-toast-danger! [&_[data-icon]]:text-toast-danger!",
          warning:
            "[&_[data-title]]:text-toast-warning! [&_[data-icon]]:text-toast-warning!",
          info: "[&_[data-title]]:text-toast-accent! [&_[data-icon]]:text-toast-accent!",
          closeButton:
            "size-5! rounded-full! border! border-toast-border! bg-toast! left-auto! right-0! top-0! transform-none! translate-x-[20%]! -translate-y-[20%]! opacity-100 sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 focus-visible:opacity-100 [&_svg]:size-3!",
        },
      }}
      {...props}
    />
  );
}
