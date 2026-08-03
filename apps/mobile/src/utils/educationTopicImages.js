import { supabase } from "@/utils/auth/supabase";

// Per-topic photo backgrounds for education article cards, shared between
// the Insights "Understanding SCD" row and the article screen's "Others you
// might like" carousel. Images live in the `education-images` Supabase
// Storage bucket (public read, migration `education_images_bucket`) and are
// uploaded by hand via the Studio dashboard — one file per topic named
// "<topic>.jpg" (e.g. "pain.jpg"). Writes aren't open to the app; this is
// curated editorial content, not user uploads.
//
// A topic with no file uploaded yet just renders `fallbackColor` — see
// EducationCardBackground, which treats a failed image load the same way.
const FALLBACK_COLORS = {
  pain: "#781D11",
  hydration: "#A9334D",
  sleep: "#4A1309",
  triggers: "#F0531C",
  movement: "#D09F9A",
};

export const TOPIC_IMAGES = Object.fromEntries(
  Object.entries(FALLBACK_COLORS).map(([topic, fallbackColor]) => [
    topic,
    {
      imageUrl: supabase.storage.from("education-images").getPublicUrl(`${topic}.jpg`).data.publicUrl,
      fallbackColor,
    },
  ]),
);
