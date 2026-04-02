export const USERJOT_FEEDBACK_URL = "https://hemocell.userjot.com/";

export function isUserJotUrl(url) {
  if (!url || typeof url !== "string") return false;

  if (url.startsWith("about:blank") || url.startsWith("data:")) {
    return true;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === "userjot.com" || host.endsWith(".userjot.com");
  } catch {
    return false;
  }
}
