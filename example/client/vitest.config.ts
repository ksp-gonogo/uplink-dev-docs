import { defineConfig } from "vitest/config";

// No @ksp-gonogo aliases: this client imports only published packages, so a test cannot reach API that was never published.
export default defineConfig({
  test: {
    name: "example",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["dist/**", "**/node_modules/**"],
    server: {
      deps: {
        inline: [
          "@ksp-gonogo/ui-kit",
          "@ksp-gonogo/sitrep-sdk",
          "@ksp-gonogo/uplink-tools",
        ],
      },
    },
  },
});
