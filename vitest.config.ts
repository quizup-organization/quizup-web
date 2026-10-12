import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "node",
      // Les tests de hooks (DOM) activent jsdom via `// @vitest-environment jsdom`.
      include: ["src/**/*.test.{ts,tsx}"],
    },
  }),
);
