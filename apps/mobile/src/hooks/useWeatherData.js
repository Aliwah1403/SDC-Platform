import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { fetchCurrentWeather } from '@/utils/weather';

const STALE_MS = 60 * 60 * 1000; // 1 hour

export function useWeatherData(locationEnabled) {
  const [coords, setCoords] = useState(null);
  const [locationResolved, setLocationResolved] = useState(false);

  useEffect(() => {
    if (!locationEnabled) {
      setCoords(null);
      setLocationResolved(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setLocationResolved(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        if (!cancelled) {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocationResolved(true);
        }
      } catch {
        if (!cancelled) setLocationResolved(true);
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

  const isWeatherLoading = locationEnabled && (!locationResolved || isFetching);

  return { weather, isWeatherLoading };
}
