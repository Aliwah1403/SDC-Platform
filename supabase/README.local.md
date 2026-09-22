# Local Supabase development

This project mirrors the hosted SCD Project schema in a local Docker-based Supabase stack. Local development is intentionally isolated from hosted production.

## Safety boundary

- `supabase start`, `supabase stop`, and `supabase db reset --local` are local operations.
- Never run `supabase db push`, `supabase migration repair --linked`, `supabase functions deploy`, or remote SQL without the user's explicit approval for that exact action.
- Never seed production data locally. The committed seed contains schema support data and local-only safety overrides, not patient data.

## Start and inspect

From the repository root:

```sh
supabase start
supabase status
```

- API: http://127.0.0.1:54321
- Studio: http://127.0.0.1:54323
- Mailpit: http://127.0.0.1:54324

To rebuild the local database from all migrations and the seed:

```sh
supabase db reset --local
```

To stop it:

```sh
supabase stop
```

## Mobile app

A physical device cannot reach the local stack on `localhost`, so `apps/mobile/.env.local` carries the Mac's current LAN IP. With the stack running, generate or refresh it in one command:

```sh
cd apps/mobile
npm run dev:ip
npx expo start -c
```

`dev:ip` reads the LAN IP from `en0` (falling back to `en1`), rewrites the host in `EXPO_PUBLIC_SUPABASE_URL` while keeping the existing port, and creates the file — pulling the publishable key from `supabase status` — if it does not exist yet. It also ensures `HEMO_APP_ENV=development` is set.

The resulting file:

```env
HEMO_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=http://<MAC_LAN_IP>:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<LOCAL_PUBLISHABLE_KEY_FROM_SUPABASE_STATUS>
```

The `-c` matters: `EXPO_PUBLIC_*` values are inlined into the bundle, so a plain restart keeps serving the old address.

The phone and Mac must be on the same network, and some guest/corporate networks block device-to-device traffic outright. **The only on-device symptom of a stale IP is an opaque `fetch failed: The request timed out`** — if you see that, run `npm run dev:ip` before debugging anything else.

`HEMO_APP_ENV=development` is what makes `app.config.js` resolve the development identity (`Hemo Dev`, `com.hemoscd.hemo.dev`) and read Supabase from this file. Without any signal a local `expo start` still defaults to `development`, so a missing `.env.local` fails loudly at startup rather than silently falling back to hosted Supabase.

## Website

Copy `apps/web/.env.example` to the ignored `apps/web/.env.local` and use the local URL/key. Then:

```sh
cd apps/web
npm run dev
```

Vite reads `.env.local` only when the development server starts. If the server was already running when the file was created or changed, stop it with `Ctrl+C` and run `npm run dev` again. Hot reload does not reload environment files.

## Edge Functions and safe mode

The local stack automatically serves functions under `http://127.0.0.1:54321/functions/v1/`.

If `supabase status` lists `supabase_edge_runtime_hemo-scd-local` under stopped services, start the local function watcher from the repository root:

```sh
supabase functions serve --env-file supabase/functions/.env
```

Keep that process running while testing the mobile app. This serves local source changes immediately and does not deploy anything to a hosted Supabase project.

`supabase/functions/.env` is ignored and starts in safe mode. No Resend, Novu, Anthropic, Abstract, webhook, or other third-party credential is provided. Database triggers that could call production function URLs are replaced by local no-op functions in `seed.sql`.

To test one external integration later, copy the required variable from `supabase/functions/.env.example` into the ignored `.env`, use a sandbox/test credential, and enable only that integration deliberately. Do not copy a production service-role key into any client environment.

### Care-location background enrichment

Care-location saves do not wait for a provider. The mobile app saves first, the queue Edge Function starts the `enrich-care-location` Trigger.dev task, and verified phone or website details found later are applied automatically only when those fields are still blank.

Local end-to-end testing needs both processes running:

1. For the Geoapify fallback, add `GEOAPIFY_API_KEY`, `GEOAPIFY_RATE_LIMIT_SALT`, and `CARE_LOCATION_GEOAPIFY_ENABLED=true`. For Gemini Search grounding, add `GEMINI_API_KEY`, `CARE_LOCATION_GEMINI_RATE_LIMIT_SALT`, and `CARE_LOCATION_GEMINI_ENABLED=true` (optionally set `CARE_LOCATION_GEMINI_MODEL`; it defaults to `gemini-3.6-flash`). Gemini does not require Geoapify credentials and never uses the Geoapify result cache. Add the same development `TRIGGER_SECRET_KEY` used by Trigger.dev to the ignored `supabase/functions/.env` file.
2. Keep the local Edge Function runtime running with the command above.
3. Configure the ignored `apps/workers/.env` with the local `API_URL` and legacy `SERVICE_ROLE_KEY` JWT from `supabase status -o env`, plus the Trigger.dev development secret. Do not use `PUBLISHABLE_KEY`/`ANON_KEY`; RLS will hide the queued row and the job cannot finish.
4. In another terminal, start the worker:

```sh
cd apps/workers
npm run dev:local
```

`dev:local` reads the local URL and service-role JWT directly from the running Supabase stack, overriding any stale Supabase values in `apps/workers/.env`. The service-role key belongs only in the worker environment. Never put it in `apps/mobile`, an `EXPO_PUBLIC_*` variable, or source control. Without the worker, locations still save successfully but enrichment remains queued. Without the Trigger secret in the function environment, the save still succeeds and the enrichment request is marked failed so it can be retried.

Gemini Search grounding is limited to facility identity (name, address, coordinates, and country) and public official/operator or government/health-authority contact evidence. The interim grounded response is held in memory only and is temporarily submitted to Gemini a second time to produce a structured result for the same user. Verified contacts are atomically applied only to blank fields, so a value entered by the user while the job runs is never overwritten. Persisted provenance contains only the grounded attribution required for display and the accepted phone/website evidence. If attribution HTML or source links are missing, the result is treated as `no_match`. The backend must not log prompts, raw Gemini responses, keys, or user/patient identifiers, and it must not crawl source links; attribution links open without click tracking. The Gemini rate-limit salt is required and provider-prefixed counters are isolated from Geoapify counters.

## Creating schema changes

Create a new migration and verify a clean replay:

```sh
supabase migration new <change_name>
supabase db reset --local
```

Review the generated SQL and local behavior before proposing any hosted deployment.
