import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Both published packages ship ESM with extensionless relative imports.
  // A bundler resolves those; Node does not, so a Node-based test runner
  // needs them inlined.
  optimizeDeps: { include: ["@ksp-gonogo/ui-kit", "@ksp-gonogo/sitrep-sdk"] },
});
