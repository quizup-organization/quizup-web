import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toaster applicatif (sonner) — thème piloté par l'appelant. */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      closeButton
      richColors
      {...props}
    />
  );
}
