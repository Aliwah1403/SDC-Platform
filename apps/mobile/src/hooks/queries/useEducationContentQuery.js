import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEducationCategories, fetchEducationArticles } from "@/services/supabase/education";
import {
  EDUCATION_CATEGORIES as BUNDLED_CATEGORIES,
  EDUCATION_ARTICLES as BUNDLED_ARTICLES,
} from "@/utils/educationContent";
import { prefetchEducationImages } from "@/utils/educationImagePrefetch";
import { queryKeys } from "@/hooks/queryKeys";

// Phase 2 of EDUCATION-CONTENT-PLAN.md — Supabase becomes the source of
// truth once content is clinically reviewed and published there; the
// bundled educationContent.js stays forever as the offline/error fallback
// (a user mid-crisis with no signal must still get the article). No table
// row is ever missing a field this hook needs — the migration seeded every
// row from the same content as the bundle, just starting `published: false`
// until a reviewer flips it.
//
// Feeds the exact same shapes `educationContent.js` always exported, so
// screens/guards/analytics need no changes beyond swapping the import for
// this hook. `isNewArticle` is a pure function of the article it's given, so
// it's re-exported as-is — no data dependency to route through here.
export { isNewArticle } from "@/utils/educationContent";

async function fetchEducationContent() {
  const [categories, articles] = await Promise.all([
    fetchEducationCategories(),
    fetchEducationArticles(),
  ]);
  return { categories, articles };
}

export function useEducationContentQuery() {
  const { data, isError, error } = useQuery({
    queryKey: queryKeys.education("public"),
    queryFn: fetchEducationContent,
  });

  useEffect(() => {
    if (isError) {
      console.warn("[education] Supabase fetch failed, falling back to bundled content", error);
    }
  }, [isError, error]);

  useEffect(() => {
    if ((data?.articles?.length ?? 0) === 0) return;
    prefetchEducationImages(data.articles.map((article) => article.photoUrl)).catch((prefetchError) => {
      console.warn("[education] Failed to prefetch article images", prefetchError);
    });
  }, [data?.articles]);

  const remoteReady = !isError && (data?.categories?.length ?? 0) > 0 && (data?.articles?.length ?? 0) > 0;

  return useMemo(() => {
    const categoriesBySlug = remoteReady
      ? Object.fromEntries(data.categories.map((c) => [c.slug, c]))
      : BUNDLED_CATEGORIES;
    const articlesByTopic = remoteReady
      ? Object.fromEntries(data.articles.map((a) => [a.topic, a]))
      : BUNDLED_ARTICLES;

    function getEducationArticle(topic) {
      return articlesByTopic[topic] ?? null;
    }

    function getRelatedArticles(topic) {
      const current = articlesByTopic[topic];
      const others = Object.values(articlesByTopic).filter((a) => a.topic !== topic);
      if (!current) return others;
      const sameCategory = others.filter((a) => a.category === current.category);
      const rest = others.filter((a) => a.category !== current.category);
      return [...sameCategory, ...rest];
    }

    function getCategories() {
      return Object.values(categoriesBySlug).sort((a, b) => a.sortOrder - b.sortOrder);
    }

    function getCategory(slug) {
      return categoriesBySlug[slug] ?? null;
    }

    function getArticlesByCategory(categorySlug) {
      return Object.values(articlesByTopic)
        .filter((a) => a.category === categorySlug)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return {
      isRemote: remoteReady,
      articles: articlesByTopic,
      getEducationArticle,
      getRelatedArticles,
      getCategories,
      getCategory,
      getArticlesByCategory,
    };
  }, [remoteReady, data]);
}
