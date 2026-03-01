from pydantic import BaseModel


class AirportItem(BaseModel):
    name: str
    code: str
    city: str
    country: str


class FlightLeg(BaseModel):
    airline: str
    airline_name: str
    flight_number: str
    aircraft: str
    departure_airport: str
    arrival_airport: str
    departure_time: str
    arrival_time: str
    duration: int  # minutes


class FlightLayover(BaseModel):
    airport: str
    airport_name: str
    duration: int  # minutes


class FlightItem(BaseModel):
    is_best: bool
    name: str
    departure: str
    arrival: str
    arrival_time_ahead: str
    duration: str
    stops: int | str
    delay: str | None
    price: str
    departure_date: str
    return_date: str | None = None
    legs: list[FlightLeg] = []
    layovers: list[FlightLayover] = []


class SearchResponse(BaseModel):
    current_price: str
    flights: list[FlightItem]
    google_flights_url: str
