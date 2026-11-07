import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  projects: [
    {
      name: "firefox",
      use: {
        browserName: "firefox",
        viewport: { width: 1440, height: 900 },
        video: "on",
        screenshot: "on",
      },
    },
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3002",
  },
  reporter: [["list"]],
})