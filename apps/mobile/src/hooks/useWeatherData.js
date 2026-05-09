import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { fetchCurrentWeather } from '@/utils/weather';

const STALE_MS = 60 * 60 * 1000; // 1 hour

export function useWeatherData(locationEnabled) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!locationEnabled) {
      setCoords(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        if (!cancelled) {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }
      } catch {
        // silently ignore — weather is non-critical
      }
    })();

    return () => { cancelled = true; };
  }, [locationEnabled]);

  const { data: weather = null, isFetching } = useQuery({
    queryKey: ['weather', coords?.lat?.toFixed(2), coords?.lon?.toFixed(2)],
    queryFn: () => fetchCurrentWeather(coords.lat, coords.lon),
    enabled: !!coords,
    staleTime: STALE_MS,
    gcTime: STALE_MS,
    retry: 1,
  });

  // True only when location is on and we haven't resolved weather yet
  const isWeatherLoading = locationEnabled && (coords === null || isFetching);

  return { weather, isWeatherLoading };
}
