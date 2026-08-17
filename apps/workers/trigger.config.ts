import "dotenv/config";
import { defineConfig } from "@trigger.dev/sdk";

const TRIGGER_PROJECT_REF = "proj_vpubthrmfojwpyyfujpj";
const triggerProject = process.env.TRIGGER_PROJECT_ID ?? TRIGGER_PROJECT_REF;

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
