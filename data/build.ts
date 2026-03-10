/**
 * Merge all public aviation data sources into enriched JSON files:
 *  - airports.json  — every IATA airport with coords, country, region, timezone, runways, etc.
 *  - airlines.json  — every airline with IATA/ICAO, country, active status
 *  - routes.json    — every known route (origin→dest, airline, codeshare, equipment)
 *  - planes.json    — aircraft type codes
 *
 * Sources:
 *  - OpenFlights (airports.dat, airlines.dat, routes.dat, planes.dat)
 *  - OurAirports (airports.csv, countries.csv, regions.csv, runways.csv)
 *
 * Run: cd data && bun run build.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const RAW = join(import.meta.dir, "raw");
const OUT = join(import.meta.dir, "out");

// ---------------------------------------------------------------------------
// CSV / DAT parsing helpers
// ---------------------------------------------------------------------------

/** Parse a simple comma-separated .dat file (no quoting beyond \N) */
function parseDat(filename: string): string[][] {
  const text = readFileSync(join(RAW, filename), "utf-8");
  return text
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((f) => f.replace(/^"|"$/g, "").trim()));
}

/** Parse a proper CSV with quoted fields */
function parseCsv(filename: string): Record<string, string>[] {
  const text = readFileSync(join(RAW, filename), "utf-8");
  const lines = text.trim().split("\n");
  const headers = parseQuotedLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseQuotedLine(line);
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] ?? "";
    }
    return row;
  });
}

function parseQuotedLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function clean(v: string): string | null {
  if (!v || v === "\\N" || v === "N/A" || v === "-" || v === "unknown") return null;
  return v;
}

// ---------------------------------------------------------------------------
// 1. Build airports
// ---------------------------------------------------------------------------

interface Airport {
  iata: string;
  icao: string | null;
  name: string;
  city: string | null;
  country: string; // ISO 2-letter
  countryName: string | null;
  region: string | null;
  continent: string | null;
  lat: number;
  lon: number;
  elevation: number | null; // feet
  timezone: string | null;
  type: string | null; // large_airport, medium_airport, etc.
  scheduledService: boolean;
  runways: RunwayInfo[] | null;
  wikipedia: string | null;
}

interface RunwayInfo {
  length: number; // feet
  width: number | null;
  surface: string | null;
  lighted: boolean;
}

function buildAirports() {
  console.log("Building airports...");

  // OurAirports — primary (most comprehensive, updated nightly)
  const oaAirports = parseCsv("ourairports-airports.csv");
  const oaCountries = parseCsv("ourairports-countries.csv");
  const oaRegions = parseCsv("ourairports-regions.csv");
  const oaRunways = parseCsv("ourairports-runways.csv");

  // OpenFlights — secondary (for timezone enrichment)
  const ofAirports = parseDat("airports.dat");

  // Lookup maps
  const countryMap = new Map<string, string>();
  for (const c of oaCountries) countryMap.set(c.code, c.name);

  const regionMap = new Map<string, string>();
  for (const r of oaRegions) regionMap.set(r.code, r.name);

  // Runways grouped by airport ident
  const runwayMap = new Map<string, RunwayInfo[]>();
  for (const r of oaRunways) {
    if (r.closed === "1") continue;
    const ident = r.airport_ident;
    if (!runwayMap.has(ident)) runwayMap.set(ident, []);
    const length = parseInt(r.length_ft);
    if (!length || isNaN(length)) continue;
    runwayMap.get(ident)!.push({
      length,
      width: r.width_ft ? parseInt(r.width_ft) || null : null,
      surface: clean(r.surface),
      lighted: r.lighted === "1",
    });
  }

  // OpenFlights timezone map (IATA → tz)
  const ofTzMap = new Map<string, string>();
  for (const row of ofAirports) {
    const iata = clean(row[4]);
    const tz = clean(row[11]);
    if (iata && tz) ofTzMap.set(iata, tz);
  }

  // Build final airport map (keyed by IATA)
  const airports = new Map<string, Airport>();

  for (const a of oaAirports) {
    const iata = clean(a.iata_code);
    if (!iata || iata.length !== 3) continue;

    // Skip closed/heliports/seaplane unless they have scheduled service
    const type = a.type;
    if (type === "closed" && a.scheduled_service !== "yes") continue;

    const lat = parseFloat(a.latitude_deg);
    const lon = parseFloat(a.longitude_deg);
    if (isNaN(lat) || isNaN(lon)) continue;

    const ident = a.ident;
    const rways = runwayMap.get(ident);

    airports.set(iata, {
      iata,
      icao: clean(a.icao_code),
      name: a.name,
      city: clean(a.municipality),
      country: a.iso_country,
      countryName: countryMap.get(a.iso_country) ?? null,
      region: regionMap.get(a.iso_region) ?? null,
      continent: clean(a.continent),
      lat: Math.round(lat * 1e6) / 1e6,
      lon: Math.round(lon * 1e6) / 1e6,
      elevation: a.elevation_ft ? parseInt(a.elevation_ft) || null : null,
      timezone: ofTzMap.get(iata) ?? null,
      type: clean(type),
      scheduledService: a.scheduled_service === "yes",
      runways: rways?.length ? rways : null,
      wikipedia: clean(a.wikipedia_link),
    });
  }

  // Backfill from OpenFlights (airports not in OurAirports)
  for (const row of ofAirports) {
    const iata = clean(row[4]);
    if (!iata || iata.length !== 3 || airports.has(iata)) continue;

    const lat = parseFloat(row[6]);
    const lon = parseFloat(row[7]);
    if (isNaN(lat) || isNaN(lon)) continue;

    airports.set(iata, {
      iata,
      icao: clean(row[5]),
      name: row[1],
      city: clean(row[2]),
      country: row[3],
      countryName: row[3], // OpenFlights uses full name in country field
      region: null,
      continent: null,
      lat: Math.round(lat * 1e6) / 1e6,
      lon: Math.round(lon * 1e6) / 1e6,
      elevation: row[8] ? parseInt(row[8]) || null : null,
      timezone: clean(row[11]),
      type: clean(row[12]),
      scheduledService: false,
      runways: null,
      wikipedia: null,
    });
  }

  console.log(`  ${airports.size} airports with IATA codes`);
  return airports;
}

// ---------------------------------------------------------------------------
// 2. Build airlines
// ---------------------------------------------------------------------------

interface Airline {
  id: number;
  name: string;
  iata: string | null;
  icao: string | null;
  callsign: string | null;
  country: string | null;
  active: boolean;
}

function buildAirlines() {
  console.log("Building airlines...");
  const rows = parseDat("airlines.dat");
  const airlines = new Map<number, Airline>();

  for (const row of rows) {
    const id = parseInt(row[0]);
    if (isNaN(id) || id < 1) continue;

    airlines.set(id, {
      id,
      name: row[1],
      iata: clean(row[3]),
      icao: clean(row[4]),
      callsign: clean(row[5]),
      country: clean(row[6]),
      active: row[7] === "Y",
    });
  }

  console.log(`  ${airlines.size} airlines`);
  return airlines;
}

// ---------------------------------------------------------------------------
// 3. Build planes
// ---------------------------------------------------------------------------

interface Plane {
  name: string;
  iata: string | null;
  icao: string | null;
}

function buildPlanes() {
  console.log("Building planes...");
  const rows = parseDat("planes.dat");
  const planes: Plane[] = [];

  for (const row of rows) {
    planes.push({
      name: row[0],
      iata: clean(row[1]),
      icao: clean(row[2]),
    });
  }

  console.log(`  ${planes.length} aircraft types`);
  return planes;
}

// ---------------------------------------------------------------------------
// 4. Build routes (enriched with airport/airline data)
// ---------------------------------------------------------------------------

interface Route {
  airline: string; // IATA or ICAO
  airlineName: string | null;
  src: string; // IATA
  dst: string; // IATA
  codeshare: boolean;
  stops: number;
  equipment: string[]; // aircraft IATA codes
}

function buildRoutes(airports: Map<string, Airport>, airlines: Map<number, Airline>) {
  console.log("Building routes...");
  const rows = parseDat("routes.dat");
  const routes: Route[] = [];
  let skipped = 0;

  for (const row of rows) {
    const src = clean(row[2]);
    const dst = clean(row[4]);
    if (!src || !dst) {
      skipped++;
      continue;
    }

    // Resolve airline name
    const airlineId = parseInt(row[1]);
    const airline = !isNaN(airlineId) ? airlines.get(airlineId) : null;
    const airlineCode = clean(row[0]) ?? "??";

    const equipment = clean(row[8]);

    routes.push({
      airline: airlineCode,
      airlineName: airline?.name ?? null,
      src,
      dst,
      codeshare: row[6] === "Y",
      stops: parseInt(row[7]) || 0,
      equipment: equipment ? equipment.split(" ").filter(Boolean) : [],
    });
  }

  console.log(`  ${routes.length} routes (${skipped} skipped — missing airport codes)`);
  return routes;
}

// ---------------------------------------------------------------------------
// 5. Build route index (airport → connected airports)
// ---------------------------------------------------------------------------

interface RouteConnection {
  dst: string;
  airlines: string[];
  direct: boolean;
}

function buildRouteIndex(routes: Route[]) {
  console.log("Building route index...");

  // airport → dest → { airlines, direct }
  const index = new Map<string, Map<string, { airlines: Set<string>; direct: boolean }>>();

  for (const r of routes) {
    if (!index.has(r.src)) index.set(r.src, new Map());
    const dests = index.get(r.src)!;

    if (!dests.has(r.dst)) dests.set(r.dst, { airlines: new Set(), direct: false });
    const conn = dests.get(r.dst)!;
    conn.airlines.add(r.airline);
    if (r.stops === 0) conn.direct = true;
  }

  // Flatten to serializable
  const result: Record<string, RouteConnection[]> = {};
  for (const [src, dests] of index) {
    result[src] = Array.from(dests.entries())
      .map(([dst, info]) => ({
        dst,
        airlines: Array.from(info.airlines).sort(),
        direct: info.direct,
      }))
      .sort((a, b) => a.dst.localeCompare(b.dst));
  }

  const airportCount = Object.keys(result).length;
  const totalConnections = Object.values(result).reduce((s, arr) => s + arr.length, 0);
  console.log(`  ${airportCount} airports with ${totalConnections} connections`);

  return result;
}

// ---------------------------------------------------------------------------
// 6. Stats summary
// ---------------------------------------------------------------------------

function buildStats(
  airports: Map<string, Airport>,
  airlines: Map<number, Airline>,
  routes: Route[],
  routeIndex: Record<string, RouteConnection[]>,
  planes: Plane[]
) {
  const activeAirlines = Array.from(airlines.values()).filter((a) => a.active).length;
  const scheduledAirports = Array.from(airports.values()).filter((a) => a.scheduledService).length;
  const directRoutes = routes.filter((r) => r.stops === 0).length;

  // Top connected airports
  const topAirports = Object.entries(routeIndex)
    .map(([iata, conns]) => ({ iata, connections: conns.length }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 30);

  return {
    generatedAt: new Date().toISOString(),
    sources: [
      "OpenFlights (routes.dat, airports.dat, airlines.dat, planes.dat)",
      "OurAirports (airports.csv, countries.csv, regions.csv, runways.csv)",
    ],
    counts: {
      airports: airports.size,
      scheduledServiceAirports: scheduledAirports,
      airlines: airlines.size,
      activeAirlines,
      routes: routes.length,
      directRoutes,
      aircraftTypes: planes.length,
      connectedAirports: Object.keys(routeIndex).length,
    },
    topConnectedAirports: topAirports,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const { mkdirSync } = await import("fs");
mkdirSync(OUT, { recursive: true });

const airports = buildAirports();
const airlines = buildAirlines();
const planes = buildPlanes();
const routes = buildRoutes(airports, airlines);
const routeIndex = buildRouteIndex(routes);
const stats = buildStats(airports, airlines, routes, routeIndex, planes);

// Convert airports map to object keyed by IATA
const airportsObj: Record<string, Omit<Airport, "iata">> = {};
for (const [iata, airport] of airports) {
  const { iata: _, ...rest } = airport;
  airportsObj[iata] = rest;
}

// Convert airlines map — key by IATA code where available, fall back to ID
const airlinesObj: Record<string, Omit<Airline, "id">> = {};
for (const [, airline] of airlines) {
  const key = airline.iata ?? airline.icao ?? String(airline.id);
  const { id: _, ...rest } = airline;
  airlinesObj[key] = rest;
}

function writeJson(filename: string, data: unknown) {
  const path = join(OUT, filename);
  const json = JSON.stringify(data, null, 2);
  writeFileSync(path, json);
  const sizeMb = (Buffer.byteLength(json) / 1024 / 1024).toFixed(1);
  console.log(`Wrote ${path} (${sizeMb} MB)`);
}

writeJson("airports.json", airportsObj);
writeJson("airlines.json", airlinesObj);
writeJson("routes.json", routes);
writeJson("route-index.json", routeIndex);
writeJson("planes.json", planes);
writeJson("stats.json", stats);

console.log("\nDone! Stats:");
console.log(JSON.stringify(stats, null, 2));
