import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  use: { baseURL: "http://localhost:3001", headless: true },
  webServer: {
    command: "npm run start -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
  },
});
