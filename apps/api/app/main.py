from datetime import date, time

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.domain.recommendations import score_day
from app.infrastructure.weather import OpenMeteoProvider, WeatherProviderError, describe_weather, normalize

app = FastAPI(
    title="WishWash API",
    description="Weather-aware laundry planning API.",
    version="0.1.0",
    docs_url="/swagger",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
weather_provider = OpenMeteoProvider()


class RecommendationCheck(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    date: date
    start_time: time
    category: str = Field(default="Daily clothes", max_length=50)


@app.exception_handler(HTTPException)
async def handle_http_error(_: Request, error: HTTPException) -> JSONResponse:
    if isinstance(error.detail, dict) and error.detail.get("success") is False:
        return JSONResponse(status_code=error.status_code, content=error.detail, headers=error.headers)
    return JSONResponse(
        status_code=error.status_code,
        content={"success": False, "error": {"code": "HTTP_ERROR", "message": str(error.detail)}},
        headers=error.headers,
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": {"code": "REQUEST_INVALID", "message": "Check the request parameters and try again."}},
    )


@app.get("/api/v1/health", tags=["system"])
async def health() -> dict:
    return {"success": True, "data": {"status": "ok"}}


@app.get("/api/v1/weather/forecast", tags=["weather"])
async def get_forecast(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    location: str = Query(default="Your location", max_length=100),
) -> dict:
    try:
        raw = await weather_provider.forecast(latitude, longitude)
    except WeatherProviderError as error:
        raise HTTPException(
            status_code=503,
            detail={"success": False, "error": {"code": "WEATHER_PROVIDER_UNAVAILABLE", "message": "Weather information is temporarily unavailable."}},
        ) from error
    return {"success": True, "data": normalize(raw, location)}


@app.post("/api/v1/recommendations/evaluate", tags=["recommendations"])
async def evaluate_plan(plan: RecommendationCheck) -> dict:
    try:
        raw = await weather_provider.forecast(plan.latitude, plan.longitude)
    except WeatherProviderError as error:
        raise HTTPException(status_code=503, detail={"success": False, "error": {"code": "WEATHER_PROVIDER_UNAVAILABLE", "message": "Weather information is temporarily unavailable."}}) from error

    daily = raw.get("daily", {})
    days = daily.get("time", [])
    day_key = plan.date.isoformat()
    if day_key not in days:
        raise HTTPException(status_code=422, detail={"success": False, "error": {"code": "FORECAST_UNAVAILABLE", "message": "A forecast is not available for this date yet. You can still start laundry."}})
    hour = plan.start_time.hour + (1 if plan.start_time.minute else 0)
    item = score_day(plan.date, daily, raw["hourly"], days.index(day_key), hour, plan.category)
    return {"success": True, "data": {**item.__dict__, "condition": describe_weather((daily.get("weather_code") or [0])[days.index(day_key)]), "start_time": plan.start_time.isoformat(timespec="minutes"), "category": plan.category}}
