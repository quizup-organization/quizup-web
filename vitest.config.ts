import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default defineConfig((env) => {
  const base = typeof viteConfig === "function" ? viteConfig(env) : viteConfig;

  return mergeConfig(
    base,
    defineConfig({
      test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
      },
    }),
  );
});
