import airportsdata
from fastapi import APIRouter, Query

from routes import AirportItem

router = APIRouter()

_airports = airportsdata.load("IATA")
_search_index: list[tuple[str, dict]] = [
    (f"{a['iata']} {a['name']} {a['city']} {a['country']}".lower(), a)
    for a in _airports.values()
]


def _score(search: str, airport: dict) -> int:
    iata = airport["iata"].lower()
    city = airport["city"].lower()
    if iata == search:
        return 0
    if iata.startswith(search):
        return 1
    if city == search:
        return 2
    if city.startswith(search):
        return 3
    if search in airport["name"].lower():
        return 4
    return 5


@router.get("/api/airports")
def get_airports(q: str = Query(min_length=1)) -> list[AirportItem]:
    search = q.lower().strip()
    matches = [(a, _score(search, a)) for text, a in _search_index if search in text]
    matches.sort(key=lambda m: (m[1], m[0]["name"]))
    return [
        AirportItem(
            name=a["name"], code=a["iata"], city=a["city"], country=a["country"]
        )
        for a, _ in matches[:20]
    ]
