const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
const BASE = 'https://api.openweathermap.org/data/2.5/weather';

export async function fetchCurrentWeather(lat, lon) {
  if (!API_KEY) throw new Error('EXPO_PUBLIC_OPENWEATHER_API_KEY not set');
  const res = await fetch(`${BASE}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
  if (!res.ok) throw new Error(`OpenWeatherMap ${res.status}`);
  const json = await res.json();
  return {
    temp: json.main.temp,
    feelsLike: json.main.feels_like,
    humidity: json.main.humidity,
    condition: json.weather?.[0]?.main ?? 'Clear',
    description: json.weather?.[0]?.description ?? '',
    cityName: json.name ?? '',
  };
}
