import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { initInstallPromptCapture } from "@/shared/stores/useInstallStore"

// `beforeinstallprompt` n'est émis qu'une fois, tôt : la capture doit être branchée avant le
// rendu (le réglage « Installer QuizUp » ne monte que plus tard, sur la page Réglages).
initInstallPromptCapture()

// Cache client des images externes (Wikimedia) : actif en dev comme en prod. Le SW ne touche
// qu'aux hôtes d'images (jamais au shell ni aux bundles), donc HMR reste intact.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch(() => undefined)
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
