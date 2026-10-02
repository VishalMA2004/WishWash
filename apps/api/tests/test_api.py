import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.infrastructure.weather import WeatherProviderError
from app.main import app, weather_provider


class ForecastApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_forecast_returns_normalized_weather_and_recommendations(self) -> None:
        raw = {
            "current": {"time": "2026-10-02T08:00", "temperature_2m": 26, "relative_humidity_2m": 50, "apparent_temperature": 27, "wind_speed_10m": 12, "weather_code": 1},
            "daily": {"time": ["2026-10-02"], "temperature_2m_max": [28], "temperature_2m_min": [19], "precipitation_probability_max": [60], "weather_code": [1]},
            "hourly": {
                "time": [f"2026-10-02T{hour:02}:00" for hour in range(24)],
                "temperature_2m": [26] * 24, "relative_humidity_2m": [50] * 24,
                "wind_speed_10m": [12] * 24, "shortwave_radiation": [350] * 24,
                "precipitation_probability": [5] * 24, "precipitation": [0] * 24,
            },
        }
        with patch.object(weather_provider, "forecast", new_callable=AsyncMock, return_value=raw):
            response = self.client.get("/api/v1/weather/forecast?latitude=12&longitude=77&location=Test")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["current"]["temperature"], 26)
        self.assertEqual(body["data"]["days"][0]["drying_window_rain_probability"], 5)
        self.assertEqual(body["data"]["days"][0]["status"], "WASH")

    def test_provider_failure_uses_standard_error_shape(self) -> None:
        with patch.object(weather_provider, "forecast", new_callable=AsyncMock, side_effect=WeatherProviderError):
            response = self.client.get("/api/v1/weather/forecast?latitude=12&longitude=77")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"]["code"], "WEATHER_PROVIDER_UNAVAILABLE")
        self.assertFalse(response.json()["success"])

    def test_invalid_coordinates_use_standard_error_shape(self) -> None:
        response = self.client.get("/api/v1/weather/forecast?latitude=200&longitude=77")
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["error"]["code"], "REQUEST_INVALID")

    def test_manual_check_uses_selected_start_time_and_laundry_category(self) -> None:
        probabilities = [5] * 24
        precipitation = [0] * 24
        for hour in range(10, 24):
            probabilities[hour] = 80
            precipitation[hour] = 1
        raw = {
            "current": {"time": "2026-10-02T08:00", "temperature_2m": 26, "relative_humidity_2m": 50, "apparent_temperature": 27, "wind_speed_10m": 12, "weather_code": 1},
            "daily": {"time": ["2026-10-02"], "temperature_2m_max": [28], "temperature_2m_min": [19], "precipitation_probability_max": [80], "weather_code": [61]},
            "hourly": {
                "time": [f"2026-10-02T{hour:02}:00" for hour in range(24)],
                "temperature_2m": [26] * 24, "relative_humidity_2m": [50] * 24,
                "wind_speed_10m": [12] * 24, "shortwave_radiation": [350] * 24,
                "precipitation_probability": probabilities, "precipitation": precipitation,
            },
        }
        with patch.object(weather_provider, "forecast", new_callable=AsyncMock, return_value=raw):
            response = self.client.post("/api/v1/recommendations/evaluate", json={
                "latitude": 12, "longitude": 77, "date": "2026-10-02", "start_time": "08:00", "category": "Bedsheets",
            })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["drying_hours"], 6)
        self.assertEqual(response.json()["data"]["status"], "AVOID")


if __name__ == "__main__":
    unittest.main()
