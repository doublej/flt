from pydantic import BaseModel


class AirportItem(BaseModel):
    name: str
    code: str
    city: str
    country: str


class FlightItem(BaseModel):
    is_best: bool
    name: str
    departure: str
    arrival: str
    arrival_time_ahead: str
    duration: str
    stops: int
    delay: str | None
    price: str


class SearchResponse(BaseModel):
    current_price: str
    flights: list[FlightItem]
