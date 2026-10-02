# Weather and recommendation engine

The MVP uses hourly Open-Meteo forecast fields. The engine models an 08:00 outdoor wash, estimates typical drying duration using daytime temperature, humidity, wind and shortwave radiation, and counts consecutive forecast hours without material rain through the expected drying window.

`WASH` means the modeled drying duration fits in the rain-free window and rain probability during those drying hours is low. `CAUTION` is used for moderate rain probability inside the drying window. `AVOID` means rain is expected before the load can dry. Whole-day rain chance is retained as forecast context; later rain should not mark a morning load unsafe if it has time to dry first. Explanations are returned with each day.

The heuristic is not clothing-specific and does not yet model rain timing intervals, shade, indoor drying, load size, user preferences, daylight boundaries, or forecast uncertainty. It must be validated against real outcomes before being used for strong safety claims.
