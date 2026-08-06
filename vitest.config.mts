import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/contracts/generated/**",
        "src/app/**/{default,error,layout,loading,not-found,page,route,template}.{ts,tsx}",
        "src/app/**/{manifest,robots,sitemap}.{ts,tsx}",
        "src/{middleware,proxy}.{ts,tsx}",
        "src/test/**",
        "**/*.d.ts",
      ],
    },
  },
});
