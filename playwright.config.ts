import { defineConfig } from "@playwright/test";

// BASE_URL: the site under test (a preview deployment or a local production build).
export default defineConfig({
  testDir: "tests",
  timeout: 120_000,
  workers: 1, // tests share one content store, so they run one after another
  reporter: [["list"]],
  snapshotPathTemplate: "docs/selona-editor/baseline/{arg}{ext}",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3311",
    launchOptions: process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {},
    trace: "off",
  },
});
