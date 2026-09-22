import "dotenv/config";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const workersDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(workersDir, "../..");

const status = execFileSync("supabase", ["status", "-o", "env"], {
  cwd: repositoryRoot,
  encoding: "utf8",
});
const local = Object.fromEntries(
  status
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2].replace(/^"|"$/g, "")]),
);

if (!local.API_URL || !local.SERVICE_ROLE_KEY) {
  throw new Error("Local Supabase is not running or did not return its service-role credentials");
}
if (!process.env.TRIGGER_SECRET_KEY) {
  throw new Error("TRIGGER_SECRET_KEY is missing from apps/workers/.env");
}

const envPath = path.join(workersDir, ".env");
const temporaryDir = mkdtempSync(path.join(os.tmpdir(), "hemo-trigger-local-"));
const temporaryEnvPath = path.join(temporaryDir, ".env");
let envContents = readFileSync(envPath, "utf8");
const replaceVariable = (name, value) => {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  envContents = pattern.test(envContents) ? envContents.replace(pattern, line) : `${envContents.trimEnd()}\n${line}\n`;
};
replaceVariable("SUPABASE_URL", local.API_URL);
replaceVariable("SUPABASE_SERVICE_ROLE_KEY", local.SERVICE_ROLE_KEY);
writeFileSync(temporaryEnvPath, envContents, { mode: 0o600 });

const child = spawn("npx", [
  "trigger.dev@latest", "dev", "start", "--profile", "hemo", "--env-file", temporaryEnvPath,
], {
  cwd: workersDir,
  env: process.env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  rmSync(temporaryDir, { recursive: true, force: true });
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
