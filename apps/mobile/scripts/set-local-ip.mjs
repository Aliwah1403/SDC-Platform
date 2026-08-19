#!/usr/bin/env node
// Point apps/mobile/.env.local at the Mac's current LAN IP.
//
// A physical device cannot reach the local Supabase stack on 127.0.0.1, so
// .env.local carries the Mac's LAN address instead. That address changes with
// the network, and the only symptom on-device is an opaque fetch timeout, so
// this rewrites it in one command:
//
//   npm run dev:ip
//
// EXPO_PUBLIC_* values are inlined into the bundle, so restart Metro with
// `npx expo start -c` afterwards.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ENV_PATH = join(dirname(dirname(fileURLToPath(import.meta.url))), ".env.local");
const DEFAULT_PORT = "54321";
const URL_KEY = "EXPO_PUBLIC_SUPABASE_URL";
const KEY_KEY = "EXPO_PUBLIC_SUPABASE_ANON_KEY";

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};

const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

// en0 is Wi-Fi on most Macs; en1 covers Ethernet/Thunderbolt setups.
const lanIp = ["en0", "en1"].map((i) => run("ipconfig", ["getifaddr", i])).find(Boolean);
if (!lanIp) {
  die("No LAN IP on en0 or en1 — are you connected to a network?");
}

// The publishable key only changes if the local stack is recreated, so a
// failure to read it is not fatal when .env.local already has one.
const readLocalKey = () => {
  const raw = run("supabase", ["status", "-o", "json"]);
  if (!raw) return "";
  try {
    const status = JSON.parse(raw);
    return status.PUBLISHABLE_KEY || status.ANON_KEY || "";
  } catch {
    return "";
  }
};

const setLine = (lines, key, value) => {
  const i = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (i === -1) return [...lines, `${key}=${value}`];
  return lines.map((l, n) => (n === i ? `${key}=${value}` : l));
};

const existing = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
const previousUrl = existing.match(new RegExp(`^${URL_KEY}=(.*)$`, "m"))?.[1] ?? "";
// Keep whatever port is already configured; only the host is stale.
const port = previousUrl.match(/:(\d+)\s*$/)?.[1] ?? DEFAULT_PORT;
const nextUrl = `http://${lanIp}:${port}`;

if (previousUrl === nextUrl) {
  console.log(`✓ .env.local already points at ${nextUrl} — nothing to do.`);
  process.exit(0);
}

let lines = existing ? existing.replace(/\n+$/, "").split("\n") : [];
lines = setLine(lines, "HEMO_APP_ENV", "development");
lines = setLine(lines, URL_KEY, nextUrl);

if (!existing.includes(`${KEY_KEY}=`)) {
  const key = readLocalKey();
  if (!key) {
    die(
      `.env.local has no ${KEY_KEY} and the local stack is not running.\n` +
        `  Run \`supabase start\` first, or add the key by hand — see supabase/README.local.md.`
    );
  }
  lines = setLine(lines, KEY_KEY, key);
  console.log(`  added ${KEY_KEY} from \`supabase status\``);
}

writeFileSync(ENV_PATH, `${lines.join("\n")}\n`);

console.log(`✓ ${existing ? "updated" : "created"} apps/mobile/.env.local`);
if (previousUrl) console.log(`    was: ${previousUrl}`);
console.log(`    now: ${nextUrl}`);
console.log("\n  Restart Metro so the new value is inlined:  npx expo start -c");
