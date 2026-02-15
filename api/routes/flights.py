from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from fast_flights import FlightData, Passengers
from fast_flights.core import get_flights_from_filter
from fast_flights.filter import TFSData
from fast_flights.cookies_impl import Cookies
import fast_flights.core as _ff_core
from fast_flights.primp import Client

from routes import FlightItem, SearchResponse


def _fetch_with_consent(params: dict, request_kwargs: dict | None = None):
    req_kwargs = request_kwargs.copy() if request_kwargs else {}
    req_kwargs.setdefault("cookies", Cookies.new().to_dict())
    client = Client(impersonate="chrome_126", verify=False)
    res = client.get("https://www.google.com/travel/flights", params=params, **req_kwargs)
    assert res.status_code == 200, f"{res.status_code} Result: {res.text_markdown}"
    return res


_ff_core.fetch = _fetch_with_consent

router = APIRouter()


@router.get("/api/flights")
def search_flights(
    from_airport: str = Query(min_length=2),
    to_airport: str = Query(min_length=2),
    date: str = Query(pattern=r"^\d{4}-\d{2}-\d{2}$"),
    return_date: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    adults: int = Query(default=1, ge=1, le=9),
    children: int = Query(default=0, ge=0, le=8),
    infants_in_seat: int = Query(default=0, ge=0, le=4),
    infants_on_lap: int = Query(default=0, ge=0, le=4),
    seat: Literal["economy", "premium-economy", "business", "first"] = "economy",
    max_stops: int | None = Query(default=None, ge=0, le=2),
    currency: str = Query(default="EUR", min_length=3, max_length=3),
) -> SearchResponse:
    flight_data = [FlightData(date=date, from_airport=from_airport, to_airport=to_airport)]

    trip = "one-way"
    if return_date:
        trip = "round-trip"
        flight_data.append(
            FlightData(date=return_date, from_airport=to_airport, to_airport=from_airport)
        )

    try:
        tfs = TFSData.from_interface(
            flight_data=flight_data,
            trip=trip,
            passengers=Passengers(
                adults=adults,
                children=children,
                infants_in_seat=infants_in_seat,
                infants_on_lap=infants_on_lap,
            ),
            seat=seat,
            max_stops=max_stops,
        )
        result = get_flights_from_filter(tfs, currency=currency, mode="fallback")
    except Exception as exc:
        msg = str(exc).split("\n", 1)[0]
        raise HTTPException(status_code=502, detail=f"Flight search failed: {msg}") from exc

    if result is None:
        raise HTTPException(status_code=502, detail="No results returned from flight search")

    return SearchResponse(
        current_price=result.current_price or "",
        flights=[
            FlightItem(
                is_best=f.is_best,
                name=f.name,
                departure=f.departure,
                arrival=f.arrival,
                arrival_time_ahead=f.arrival_time_ahead or "",
                duration=f.duration,
                stops=f.stops,
                delay=f.delay,
                price=f.price,
            )
            for f in result.flights
        ],
    )
