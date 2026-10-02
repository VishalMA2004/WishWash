import unittest
from datetime import date

from app.domain.recommendations import estimate_drying_hours, score_day


def forecast_for(rain_start: int | None) -> tuple[dict, dict]:
    day = "2026-10-03"
    times = [f"{day}T{hour:02}:00" for hour in range(24)]
    rain_probabilities = [0] * 24
    precipitation = [0.0] * 24
    if rain_start is not None:
        for hour in range(rain_start, 24):
            rain_probabilities[hour] = 80
            precipitation[hour] = 1.2
    daily = {
        "time": [day], "temperature_2m_max": [27], "temperature_2m_min": [19],
        "precipitation_probability_max": [80 if rain_start else 5],
    }
    hourly = {
        "time": times, "temperature_2m": [26] * 24, "relative_humidity_2m": [50] * 24,
        "wind_speed_10m": [15] * 24, "shortwave_radiation": [400] * 24,
        "precipitation_probability": rain_probabilities, "precipitation": precipitation,
    }
    return daily, hourly


class RecommendationTests(unittest.TestCase):
    def test_drying_time_increases_with_humidity(self) -> None:
        dry_air = estimate_drying_hours(26, 40, 15, 400)
        humid_air = estimate_drying_hours(26, 90, 15, 400)
        self.assertGreater(humid_air, dry_air)

    def test_low_rain_day_is_recommended(self) -> None:
        daily, hourly = forecast_for(None)
        result = score_day(date(2026, 10, 3), daily, hourly, 0)
        self.assertEqual(result.status, "WASH")
        self.assertGreaterEqual(result.rain_free_hours, result.drying_hours)

    def test_rain_before_drying_finishes_is_avoided(self) -> None:
        daily, hourly = forecast_for(10)
        result = score_day(date(2026, 10, 3), daily, hourly, 0)
        self.assertEqual(result.status, "AVOID")
        self.assertLess(result.rain_free_hours, result.drying_hours)
        self.assertIn("Rain may arrive before clothes are dry", result.reasons)

    def test_afternoon_rain_does_not_override_safe_morning_drying_window(self) -> None:
        daily, hourly = forecast_for(14)
        result = score_day(date(2026, 10, 3), daily, hourly, 0)
        self.assertEqual(result.status, "WASH")
        self.assertEqual(result.rain_probability, 80)  # Daily context remains visible.
        self.assertIn("Low rain chance during drying", result.reasons)

    def test_later_start_checks_rain_from_the_selected_hour(self) -> None:
        daily, hourly = forecast_for(14)
        result = score_day(date(2026, 10, 3), daily, hourly, 0, start_hour=12)
        self.assertEqual(result.status, "AVOID")


if __name__ == "__main__":
    unittest.main()
