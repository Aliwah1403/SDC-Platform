const appJson = require("./app.json");

const SUPABASE_CONFIG = {
  staging: {
    url: "https://pqwrxhqcgwrjazsurujm.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxd3J4aHFjZ3dyamF6c3VydWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NjY2MzMsImV4cCI6MjEwMjQ0MjYzM30.nCylaKuo6xq0YfxM7R82XCmG1YPZpxRMDL1g4djOTe8",
  },
  production: {
    url: "https://uphhntnjzfsckeuxjhco.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwaGhudG5qemZzY2tldXhqaGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTAyOTksImV4cCI6MjA4NTE4NjI5OX0.Jr2oeA5u238ntzQKYidXHBPJOd13F1a985QZtgUuX0g",
  },
};

const resolveAppEnv = () => {
  if (process.env.HEMO_APP_ENV === "development") return "development";
  if (process.env.EAS_BUILD_PROFILE === "development") return "development";
  if (process.env.HEMO_APP_ENV === "staging") return "staging";
  if (process.env.EAS_BUILD_PROFILE === "staging") return "staging";
  if (process.env.HEMO_APP_ENV === "production") return "production";
  // Inside an EAS build (any other profile, e.g. preview) production config is
  // the right default. On a developer's machine it is not: the dev-ness marker
  // lives in .env.local alongside the credentials, so if that file goes missing
  // a production default would silently hand production Supabase to whatever
  // binary connects to Metro. Default to development instead and let the
  // runtime guard in utils/auth/supabase.js fail loudly.
  if (process.env.EAS_BUILD_PROFILE || process.env.EAS_BUILD) return "production";
  return "development";
};

module.exports = () => {
  const appEnv = resolveAppEnv();
  const isDevelopment = appEnv === "development";
  // Development is intentionally not a key in SUPABASE_CONFIG: it resolves
  // straight from process.env below, with no fallback to the staging or
  // production entries. If those vars are unset (e.g. on an EAS builder,
  // which has no .env.local), this evaluates to undefined rather than
  // throwing here — a config-time throw would break the build itself. The
  // hard failure for a missing/misconfigured dev Supabase happens at
  // runtime in supabase.js instead.
  const supabase = isDevelopment
    ? {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL,
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      }
    : SUPABASE_CONFIG[appEnv];

  return {
    ...appJson.expo,
    ...(isDevelopment
      ? {
          name: "Hemo Dev",
          scheme: "hemoscd-dev",
          ios: {
            ...appJson.expo.ios,
            bundleIdentifier: "com.hemoscd.hemo.dev",
          },
        }
      : {}),
    extra: {
      ...appJson.expo.extra,
      appEnv,
      oauthRedirectUrl: isDevelopment
        ? "hemoscd-dev://auth/callback"
        : "hemoscd://auth/callback",
      publicShareBaseUrl: "https://hemo-scd.com",
      supabaseUrl: supabase.url,
      supabaseAnonKey: supabase.anonKey,
    },
  };
};
