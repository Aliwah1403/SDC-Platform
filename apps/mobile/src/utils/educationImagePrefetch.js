import { Image } from "expo-image";
import { TOPIC_IMAGES } from "@/utils/educationTopicImages";

const prefetchedUrls = new Set();

function normalizeUrls(urls = []) {
  return Array.from(
    new Set(
      urls
        .filter(Boolean)
        .map((url) => String(url).trim())
        .filter((url) => /^https?:\/\//i.test(url)),
    ),
  );
}

export function getStaticEducationImageUrls() {
  return normalizeUrls(Object.values(TOPIC_IMAGES).map((topic) => topic.imageUrl));
}

export async function prefetchEducationImages(extraUrls = []) {
  const urls = normalizeUrls([...getStaticEducationImageUrls(), ...extraUrls]).filter(
    (url) => !prefetchedUrls.has(url),
  );

  if (urls.length === 0) return { attempted: 0, succeeded: 0, failed: 0 };

  urls.forEach((url) => prefetchedUrls.add(url));

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const ok = await Image.prefetch(url, "memory-disk");
      if (!ok) throw new Error(`Image prefetch returned false for ${url}`);
      return url;
    }),
  );

  const failed = results.filter((result) => result.status === "rejected").length;
  if (failed > 0) {
    console.warn(`[education] ${failed}/${urls.length} education images failed to prefetch`);
  }

  return {
    attempted: urls.length,
    succeeded: urls.length - failed,
    failed,
  };
}
