import fs from "node:fs"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Origine de production mimée en local : le client OIDC prod n'autorise que
// `https://app.quizup.cnadjim.fr` (redirect URI, CORS, cookie AUTH_TX). Le mode
// `prod-local` sert donc Vite en HTTPS sur cette origine exacte (voir README/AGENTS).
const PROD_LOCAL_HOST = "app.quizup.cnadjim.fr"
const PROD_LOCAL_PORT = 8443

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  ...(mode === "prod-local"
    ? {
        server: {
          host: PROD_LOCAL_HOST,
          port: PROD_LOCAL_PORT,
          strictPort: true,
          allowedHosts: [PROD_LOCAL_HOST],
          https: {
            key: fs.readFileSync(
              path.resolve(import.meta.dirname, ".certs/app-key.pem")
            ),
            cert: fs.readFileSync(
              path.resolve(import.meta.dirname, ".certs/app.pem")
            ),
          },
        },
      }
    : {}),
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
              name: "vendor",
              test: /node_modules[\\/]/,
            },
          ],
        },
      },
    },
  },
}))
