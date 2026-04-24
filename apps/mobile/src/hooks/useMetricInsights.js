import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/auth/supabase';
import { captureAIGeneration } from '@/utils/analytics';
import { useAuthStore } from '@/utils/auth/store';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function useMetricInsights(metric, currentValue, statusLabel, trendDelta, lowerIsBetter, opts = {}) {
  const [insight, setInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!metric || currentValue == null || !statusLabel || !user?.id) return;

    let cancelled = false;

    async function load() {
      const cacheKey = `metric_insight_${user.id}_${metric}`;

      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) {
          const { data, timestamp } = JSON.parse(raw);
          if (Date.now() - timestamp < CACHE_TTL_MS) {
            if (!cancelled) setInsight(data);
            return;
          }
        }
      } catch {}

      if (!cancelled) setIsLoading(true);

      try {
        const { data: fnResult, error } = await supabase.functions.invoke('generate-metric-insight', {
          body: {
            metric,
            currentValue,
            statusLabel,
            trendDelta,
            lowerIsBetter,
            range: opts.range ?? 30,
            unit: opts.unit ?? '',
            goal: opts.goal ?? null,
            scdType: opts.scdType ?? null,
          },
        });

        if (!error && fnResult?.data) {
          captureAIGeneration('metric_insights', fnResult.meta);
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: fnResult.data, timestamp: Date.now() }));
          if (!cancelled) setInsight(fnResult.data);
        }
      } catch {}

      if (!cancelled) setIsLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [metric, statusLabel, user?.id]);

  return { insight, isLoading };
}
