import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import date as date_type, timedelta
from functools import partial
from typing import Annotated, Literal
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query
from fast_flights import FlightData, Passengers
from fast_flights.core import get_flights_from_filter
from fast_flights.filter import TFSData
from fast_flights.cookies_impl import Cookies
import fast_flights.core as _ff_core
from fast_flights.primp import Client
from starlette.responses import StreamingResponse

from routes import FlightItem, FlightLeg, FlightLayover, SearchResponse

logger = logging.getLogger(__name__)


def _fetch_with_consent(params: dict, request_kwargs: dict | None = None):
    req_kwargs = request_kwargs.copy() if request_kwargs else {}
    req_kwargs.setdefault("cookies", Cookies.new().to_dict())
    client = Client(impersonate="chrome_126", verify=False)
    res = client.get("https://www.google.com/travel/flights", params=params, **req_kwargs)
    assert res.status_code == 200, f"{res.status_code} Result: {res.text_markdown}"
    return res


_ff_core.fetch = _fetch_with_consent

router = APIRouter()

CURRENCY_SYMBOLS = {"EUR": "€", "USD": "$", "GBP": "£", "JPY": "¥"}
MAX_RANGE_DAYS = 7
MAX_TOTAL_SEARCHES = 21
_pool = ThreadPoolExecutor(max_workers=3)
SEARCH_TIMEOUT_S = 30


def _date_range(start: str, end: str) -> list[str]:
    s = date_type.fromisoformat(start)
    e = date_type.fromisoformat(end)
    days = min((e - s).days, MAX_RANGE_DAYS - 1)
    return [(s + timedelta(days=i)).isoformat() for i in range(days + 1)]


def _format_time(t: tuple[int, int]) -> str:
    return f"{t[0]:02d}:{t[1]:02d}"


def _format_duration(minutes: int) -> str:
    h, m = divmod(minutes, 60)
    if h and m:
        return f"{h}h {m}m"
    return f"{h}h" if h else f"{m}m"


def _format_price(price: float, currency: str) -> str:
    symbol = CURRENCY_SYMBOLS.get(currency, "")
    value = int(price)
    return f"{symbol}{value:,}" if symbol else f"{value:,} {currency}"


def _days_ahead(dep: tuple[int, int, int], arr: tuple[int, int, int]) -> str:
    diff = (date_type(*arr) - date_type(*dep)).days
    return f"+{diff}" if diff > 0 else ""


def _itinerary_to_item(itin, is_best: bool, dep_date: str, ret_date: str | None) -> FlightItem:
    summary = itin.itinerary_summary
    legs = [
        FlightLeg(
            airline=f.airline, airline_name=f.airline_name,
            flight_number=f.flight_number, aircraft=f.aircraft,
            departure_airport=f.departure_airport, arrival_airport=f.arrival_airport,
            departure_time=_format_time(f.departure_time),
            arrival_time=_format_time(f.arrival_time), duration=f.travel_time,
        )
        for f in itin.flights
    ]
    layovers = [
        FlightLayover(
            airport=lo.departure_airport,
            airport_name=lo.departure_airport_name,
            duration=lo.minutes,
        )
        for lo in itin.layovers
    ]
    return FlightItem(
        is_best=is_best,
        name=", ".join(itin.airline_names) or itin.airline_code,
        departure=_format_time(itin.departure_time),
        arrival=_format_time(itin.arrival_time),
        arrival_time_ahead=_days_ahead(itin.departure_date, itin.arrival_date),
        duration=_format_duration(itin.travel_time),
        stops=len(itin.layovers),
        delay=None,
        price=_format_price(summary.price, summary.currency),
        departure_date=dep_date, return_date=ret_date,
        legs=legs, layovers=layovers,
    )


def _search_single(
    dep_date: str,
    ret_date: str | None,
    from_airport: str,
    to_airport: str,
    passengers: Passengers,
    seat: str,
    max_stops: int | None,
    currency: str,
) -> tuple[str, str | None, list[FlightItem], str, str]:
    flight_data = [FlightData(date=dep_date, from_airport=from_airport, to_airport=to_airport)]
    trip = "one-way"
    if ret_date:
        trip = "round-trip"
        flight_data.append(
            FlightData(date=ret_date, from_airport=to_airport, to_airport=from_airport)
        )

    tfs = TFSData.from_interface(
        flight_data=flight_data,
        trip=trip,
        passengers=passengers,
        seat=seat,
        max_stops=max_stops,
    )
    url = "https://www.google.com/travel/flights?" + urlencode({
        "tfs": tfs.as_b64().decode("utf-8"),
        "hl": "en",
        "curr": currency,
    })

    try:
        result = get_flights_from_filter(tfs, currency=currency, mode="common", data_source="js")
    except (AssertionError, IndexError, TypeError):
        logger.warning("JS decoder failed for %s→%s on %s", from_airport, to_airport, dep_date, exc_info=True)
        return dep_date, ret_date, [], "", url
    if result is None:
        return dep_date, ret_date, [], "", url

    flights: list[FlightItem] = []
    for is_best, itins in [(True, result.best or []), (False, result.other or [])]:
        for itin in itins:
            try:
                flights.append(_itinerary_to_item(itin, is_best, dep_date, ret_date))
            except (IndexError, TypeError, AttributeError):
                logger.warning("Skipping malformed itinerary", exc_info=True)

    return dep_date, ret_date, flights, "", url


def _build_date_pairs(
    dep_dates: list[str],
    ret_dates: list[str] | None,
) -> list[tuple[str, str | None]]:
    if not ret_dates:
        return [(d, None) for d in dep_dates]
    pairs: list[tuple[str, str | None]] = [(d, r) for d in dep_dates for r in ret_dates if r >= d]
    return pairs[:MAX_TOTAL_SEARCHES]


@dataclass
class SearchQuery:
    from_airport: str = Query(min_length=2)
    to_airport: str = Query(min_length=2)
    date: str = Query(pattern=r"^\d{4}-\d{2}-\d{2}$")
    return_date: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    date_end: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    return_date_end: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    adults: int = Query(default=1, ge=1, le=9)
    children: int = Query(default=0, ge=0, le=8)
    infants_in_seat: int = Query(default=0, ge=0, le=4)
    infants_on_lap: int = Query(default=0, ge=0, le=4)
    seat: Literal["economy", "premium-economy", "business", "first"] = "economy"
    max_stops: int | None = Query(default=None, ge=0, le=2)
    currency: str = Query(default="EUR", min_length=3, max_length=3)


def _prepare_search(q: SearchQuery):
    passengers = Passengers(
        adults=q.adults, children=q.children,
        infants_in_seat=q.infants_in_seat, infants_on_lap=q.infants_on_lap,
    )
    dep_dates = _date_range(q.date, q.date_end) if q.date_end else [q.date]
    ret_dates = (
        _date_range(q.return_date, q.return_date_end)
        if q.return_date and q.return_date_end
        else ([q.return_date] if q.return_date else None)
    )
    pairs = _build_date_pairs(dep_dates, ret_dates)
    search = partial(
        _search_single,
        from_airport=q.from_airport, to_airport=q.to_airport,
        passengers=passengers, seat=q.seat, max_stops=q.max_stops, currency=q.currency,
    )
    return search, pairs


@router.get("/api/flights")
async def search_flights(q: Annotated[SearchQuery, Depends()]) -> SearchResponse:
    search, pairs = _prepare_search(q)
    loop = asyncio.get_event_loop()

    if len(pairs) == 1:
        try:
            _, _, flights, current_price, url = await asyncio.wait_for(
                loop.run_in_executor(_pool, partial(search, pairs[0][0], pairs[0][1])),
                timeout=SEARCH_TIMEOUT_S,
            )
        except Exception as exc:
            msg = str(exc).split("\n", 1)[0]
            raise HTTPException(status_code=502, detail=f"Flight search failed: {msg}") from exc
        if not flights and not url:
            raise HTTPException(status_code=502, detail="No results returned from flight search")
        return SearchResponse(current_price=current_price, flights=flights, google_flights_url=url)

    tasks = [
        loop.run_in_executor(_pool, partial(search, d, r))
        for d, r in pairs
    ]
    all_flights: list[FlightItem] = []
    first_url = ""
    first_price = ""

    for coro in asyncio.as_completed(tasks):
        try:
            _, _, flights, price, url = await coro
            all_flights.extend(flights)
            if not first_url and url:
                first_url = url
                first_price = price
        except Exception:
            logger.warning("Date pair search failed", exc_info=True)

    if not all_flights and not first_url:
        raise HTTPException(status_code=502, detail="No results returned from flight search")

    return SearchResponse(
        current_price=first_price,
        flights=all_flights,
        google_flights_url=first_url,
    )


def _sse_event(event: str, data: dict | list) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.get("/api/flights/stream")
async def stream_flights(q: Annotated[SearchQuery, Depends()]):
    search, pairs = _prepare_search(q)

    async def generate():
        loop = asyncio.get_event_loop()
        total = len(pairs)
        completed = 0
        first_url = ""
        first_price = ""

        yield _sse_event("progress", {"completed": 0, "total": total})

        tasks = [
            asyncio.wait_for(
                loop.run_in_executor(_pool, partial(search, d, r)),
                timeout=SEARCH_TIMEOUT_S,
            )
            for d, r in pairs
        ]
        for coro in asyncio.as_completed(tasks):
            completed += 1
            try:
                _, _, flights, price, url = await coro
                if flights:
                    yield _sse_event("flights", [f.model_dump() for f in flights])
                if not first_url and url:
                    first_url = url
                    first_price = price
            except Exception as exc:
                yield _sse_event("error", {"detail": str(exc).split("\n", 1)[0]})
            yield _sse_event("progress", {"completed": completed, "total": total})

        yield _sse_event("done", {
            "current_price": first_price,
            "google_flights_url": first_url,
        })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
