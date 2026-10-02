from datetime import datetime, timezone

import httpx

from app.config import settings


class WeatherProviderError(Exception):
    pass


class OpenMeteoProvider:
    """Open-Meteo adapter. Provider payload details stay outside the domain layer."""

    async def forecast(self, latitude: float, longitude: float) -> dict:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "timezone": "auto",
            "forecast_days": 7,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,shortwave_radiation",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,weather_code,sunrise,sunset",
        }
        try:
            async with httpx.AsyncClient(timeout=12) as client:
                response = await client.get(f"{settings.weather_base_url}/forecast", params=params)
                response.raise_for_status()
                return response.json()
        except (httpx.HTTPError, ValueError) as error:
            raise WeatherProviderError from error


def describe_weather(code: int) -> str:
    if code == 0:
        return "Clear sky"
    if code in (1, 2):
        return "Mostly sunny" if code == 1 else "Partly cloudy"
    if code == 3:
        return "Overcast"
    if code in (45, 48):
        return "Foggy"
    if code in (51, 53, 55, 56, 57):
        return "Drizzle"
    if code in (61, 63, 65, 66, 67, 80, 81, 82):
        return "Rain showers"
    if code in (71, 73, 75, 77, 85, 86):
        return "Snow"
    if code in (95, 96, 99):
        return "Thunderstorms"
    return "Variable conditions"


def normalize(raw: dict, location: str) -> dict:
    current = raw["current"]
    hourly = raw["hourly"]
    daily = raw["daily"]
    from app.domain.recommendations import recommend_week

    days = recommend_week(daily, hourly, current.get("time", ""))
    return {
        "location": location,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "current": {
            "temperature": current["temperature_2m"],
            "feels_like": current["apparent_temperature"],
            "humidity": current["relative_humidity_2m"],
            "wind_speed": current["wind_speed_10m"],
            "rain_probability": _current_rain_probability(hourly, current.get("time", "")),
            "condition": describe_weather(current["weather_code"]),
        },
        "days": [
            {
                **item.__dict__,
                "condition": describe_weather((daily.get("weather_code") or [0])[index]),
            }
            for index, item in enumerate(days)
        ],
    }


def _current_rain_probability(hourly: dict, provider_local_time: str) -> int:
    now_local = provider_local_time[:13] + ":00" if provider_local_time else datetime.now().astimezone().strftime("%Y-%m-%dT%H:00")
    times = hourly.get("time", [])
    index = next((i for i, value in enumerate(times) if value >= now_local), 0)
    probs = hourly.get("precipitation_probability", [])
    return int(probs[index]) if index < len(probs) else 0
