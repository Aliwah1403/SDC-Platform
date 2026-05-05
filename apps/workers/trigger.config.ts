import "dotenv/config";
import { defineConfig } from "@trigger.dev/sdk";

const triggerProject = process.env.TRIGGER_PROJECT_ID;

if (!triggerProject) {
  throw new Error("TRIGGER_PROJECT_ID required");
}

export default defineConfig({
  project: triggerProject,
  dirs: ["./src/trigger"],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10_000,
      factor: 2,
    },
  },
});
