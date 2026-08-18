import Constants from "expo-constants";
import { appEnvironment } from "@/utils/auth/supabase";

const appExtra = Constants.expoConfig?.extra ?? {};
const DEFAULT_PUBLIC_SHARE_BASE_URL = "https://hemo-scd.com";
const LOCAL_PUBLIC_SHARE_BASE_URL = "http://localhost:5173";

export function buildPublicShareUrl(route, token) {
  const normalizedRoute = String(route ?? "").replace(/^\/+|\/+$/g, "");
  const normalizedToken = encodeURIComponent(String(token ?? ""));
  const baseUrl = __DEV__
    ? LOCAL_PUBLIC_SHARE_BASE_URL
    : (appExtra.publicShareBaseUrl ?? DEFAULT_PUBLIC_SHARE_BASE_URL);

  const url = new URL(`${baseUrl.replace(/\/+$/g, "")}/${normalizedRoute}/${normalizedToken}`);

  if (appEnvironment === "staging") {
    url.searchParams.set("env", "staging");
  }

  return url.toString();
}
