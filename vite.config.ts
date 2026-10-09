import { readFileSync } from "node:fs"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Version de l'app injectée au build (affichée dans Réglages).
  define: { __APP_VERSION__: JSON.stringify(version) },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Sépare les dépendances stables (cache navigateur) du code applicatif.
        advancedChunks: {
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: "query",
              test: /node_modules[\\/]@tanstack[\\/]/,
            },
            {
              name: "realtime",
              test: /node_modules[\\/](@stomp[\\/]stompjs|oidc-client-ts)[\\/]/,
            },
            {
              name: "avatar",
              test: /node_modules[\\/]@dicebear[\\/]/,
            },
            {
              name: "motion",
              test: /node_modules[\\/](framer-motion|motion|motion-dom|motion-utils)[\\/]/,
            },
            {
              // Chargé uniquement avec les pages d'auteur (création/gestion), pas au boot.
              name: "emoji",
              test: /node_modules[\\/]emoji-picker-react[\\/]/,
            },
            {
              name: "vendor",
              test: /node_modules[\\/]/,
            },
          ],
        },
      },
    },
  },
})
