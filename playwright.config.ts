import { defineConfig } from "@playwright/test";
import { existsSync } from "fs";

// E2E_EMAIL / E2E_KEY (and _2): the editor accounts the tests sign in with.
if (existsSync(".env.e2e.local")) process.loadEnvFile(".env.e2e.local");

// BASE_URL: the site under test (a preview deployment or a local production build).
export default defineConfig({
  testDir: "tests",
  timeout: 120_000,
  workers: 1, // tests share one content store, so they run one after another
  reporter: [["list"]],
  // BASELINE_DIR: screenshots of 506e2ae taken on the same machine as the test run (fonts render per machine)
  snapshotPathTemplate: `${process.env.BASELINE_DIR || "docs/selona-editor/baseline"}/{arg}{ext}`,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3311",
    launchOptions: process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {},
    trace: "off",
  },
});
