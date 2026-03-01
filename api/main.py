from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.airports import router as airports_router
from routes.flights import router as flights_router

app = FastAPI(title="Flights API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3847"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(airports_router)
app.include_router(flights_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
