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
  if (process.env.HEMO_APP_ENV === "staging") return "staging";
  if (process.env.EAS_BUILD_PROFILE === "staging") return "staging";
  return "production";
};

module.exports = () => {
  const appEnv = resolveAppEnv();
  const supabase = SUPABASE_CONFIG[appEnv];

  return {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      appEnv,
      oauthRedirectUrl: "hemoscd://auth/callback",
      publicShareBaseUrl: "https://hemo-scd.com",
      supabaseUrl: supabase.url,
      supabaseAnonKey: supabase.anonKey,
    },
  };
};
