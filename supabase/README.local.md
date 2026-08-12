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

Copy `apps/mobile/.env.example` to the ignored `apps/mobile/.env.local`. A physical device must use the Mac's current LAN IP, not `localhost`:

```env
EXPO_PUBLIC_SUPABASE_URL=http://<MAC_LAN_IP>:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<LOCAL_PUBLISHABLE_KEY_FROM_SUPABASE_STATUS>
```

Then restart Expo so the variables are inlined:

```sh
cd apps/mobile
npx expo start -c
```

The phone and Mac must be on the same network. If requests stop working after changing networks, update the LAN IP in `.env.local`.

## Website

Copy `apps/web/.env.example` to the ignored `apps/web/.env.local` and use the local URL/key. Then:

```sh
cd apps/web
npm run dev
```

Vite reads `.env.local` only when the development server starts. If the server was already running when the file was created or changed, stop it with `Ctrl+C` and run `npm run dev` again. Hot reload does not reload environment files.

## Edge Functions and safe mode

The local stack automatically serves functions under `http://127.0.0.1:54321/functions/v1/`.

`supabase/functions/.env` is ignored and starts in safe mode. No Resend, Novu, Anthropic, Abstract, webhook, or other third-party credential is provided. Database triggers that could call production function URLs are replaced by local no-op functions in `seed.sql`.

To test one external integration later, copy the required variable from `supabase/functions/.env.example` into the ignored `.env`, use a sandbox/test credential, and enable only that integration deliberately. Do not copy a production service-role key into any client environment.

## Creating schema changes

Create a new migration and verify a clean replay:

```sh
supabase migration new <change_name>
supabase db reset --local
```

Review the generated SQL and local behavior before proposing any hosted deployment.
