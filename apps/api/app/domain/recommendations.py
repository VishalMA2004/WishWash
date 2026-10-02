from dataclasses import dataclass
from datetime import date, datetime
from typing import Any


@dataclass(frozen=True)
class Recommendation:
    date: str
    label: str
    high: float
    low: float
    rain_probability: int
    drying_window_rain_probability: int
    condition: str
    status: str
    drying_hours: int
    rain_free_hours: int
    reasons: list[str]


def estimate_drying_hours(temperature: float, humidity: float, wind_speed: float, radiation: float) -> int:
    """Simple, intentionally conservative rule estimate for a typical outdoor load."""
    hours = 4.4
    hours += max(0, 60 - humidity) * -0.012
    hours += max(0, humidity - 60) * 0.035
    hours -= max(0, temperature - 20) * 0.025
    hours -= min(wind_speed, 25) * 0.018
    hours -= min(radiation, 700) * 0.0007
    return max(2, min(8, round(hours)))


def score_day(day: date, daily: dict[str, Any], hourly: dict[str, Any], index: int, start_hour: int = 8, category: str = "Daily clothes") -> Recommendation:
    dates = hourly.get("time", [])
    start = f"{day.isoformat()}T{start_hour:02}:00"
    window_indexes = [i for i, timestamp in enumerate(dates) if timestamp >= start and timestamp < f"{day.isoformat()}T20:00"]
    temps = hourly.get("temperature_2m", [])
    humidity = hourly.get("relative_humidity_2m", [])
    wind = hourly.get("wind_speed_10m", [])
    radiation = hourly.get("shortwave_radiation", [])
    rain_probs = hourly.get("precipitation_probability", [])
    precipitation = hourly.get("precipitation", [])

    # Use daytime conditions to estimate drying duration for an ordinary load.
    sample_indexes = [i for i in window_indexes if 8 <= int(dates[i][11:13]) < 18]
    average = lambda values: sum(values[i] for i in sample_indexes if i < len(values)) / max(1, len([i for i in sample_indexes if i < len(values)])) if values else 50.0
    category_extra = {"towels": 1, "bedsheets": 2, "blankets": 3, "curtains": 2, "custom": 1}.get(category.casefold(), 0)
    dry_hours = min(10, estimate_drying_hours(average(temps), average(humidity), average(wind), average(radiation)) + category_extra)

    # Simulate an 08:00 wash. The safe window ends at the first material rain risk,
    # and evaluates the whole expected drying period rather than a daily rain average.
    drying_indexes = [i for i in window_indexes if start_hour <= int(dates[i][11:13]) < start_hour + dry_hours]
    rain_free_hours = 0
    for i in drying_indexes:
        probability = rain_probs[i] if i < len(rain_probs) else 0
        amount = precipitation[i] if i < len(precipitation) else 0
        if probability >= 45 or amount >= 0.3:
            break
        rain_free_hours += 1

    rain_probability = int((daily.get("precipitation_probability_max") or [0])[index] or 0)
    drying_window_rain_probability = max((rain_probs[i] for i in drying_indexes if i < len(rain_probs)), default=rain_probability)
    condition = "Rain likely" if rain_probability >= 45 else ("Partly cloudy" if radiation and average(radiation) > 100 else "Cloudy")
    reasons: list[str] = []
    if rain_free_hours >= dry_hours:
        reasons.append(f"{rain_free_hours}-hour rain-free drying window")
    else:
        reasons.append("Rain may arrive before clothes are dry")
    if average(humidity) <= 65:
        reasons.append("Comfortable humidity")
    else:
        reasons.append("High humidity may slow drying")
    if average(wind) >= 10:
        reasons.append("A helpful breeze")
    if drying_window_rain_probability < 20:
        reasons.append("Low rain chance during drying")

    # Rain after the predicted clothes-dry time should not cause a high-risk
    # recommendation for an early wash. Use daily max only as display context.
    if rain_free_hours < dry_hours:
        status = "AVOID"
    elif drying_window_rain_probability >= 30:
        status = "CAUTION"
    else:
        status = "WASH"

    low = (daily.get("temperature_2m_min") or [0])[index]
    high = (daily.get("temperature_2m_max") or [0])[index]
    return Recommendation(day.isoformat(), "", float(high), float(low), rain_probability, drying_window_rain_probability, condition, status, dry_hours, rain_free_hours, reasons)


def recommend_week(daily: dict[str, Any], hourly: dict[str, Any], current_local_time: str = "") -> list[Recommendation]:
    results = []
    for index, raw_date in enumerate(daily.get("time", [])[:7]):
        start_hour = 8
        if current_local_time.startswith(raw_date):
            parsed = datetime.fromisoformat(current_local_time)
            start_hour = max(8, parsed.hour + (1 if parsed.minute > 0 else 0))
        results.append(score_day(date.fromisoformat(raw_date), daily, hourly, index, start_hour))
    return results
