/** Helpers PWA purs (installabilité, détection de plateforme), sans dépendance navigateur. */

/** Vrai si l'app tourne déjà en mode installé (standalone), y compris l'iOS `navigator.standalone`. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayMode =
    window.matchMedia?.("(display-mode: standalone)")?.matches === true;
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayMode || iosStandalone;
}

/** Détection iOS : le Web Push n'y fonctionne que depuis une PWA installée (iOS ≥ 16.4). */
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Détection Firefox (desktop/Android) : aucun support d'installation PWA ni de
 * `beforeinstallprompt` — seul « Créer un raccourci » existe (pas une installation).
 */
export function isFirefox(): boolean {
  if (typeof navigator === "undefined") return false;
  return /firefox|fxios/i.test(navigator.userAgent);
}
