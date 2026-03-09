// Types
export type {
  Airport,
  Flight,
  FlightLeg,
  FlightLayover,
  SearchParams,
  SearchResult,
} from './types'

// Search engine
export {
  type SearchQuery,
  type SeatType,
  type TripType,
  buildDatePairs,
  parseSearchQuery,
  searchSingle,
  MAX_RANGE_DAYS,
  MAX_TOTAL_SEARCHES,
} from './search'
export type { SearchResult as EngineSearchResult } from './search'

// Scrape
export { type ScrapeError, type ScrapeResult, fetchFlights, buildGoogleFlightsUrl } from './scrape'

// Protobuf
export { type FlightLeg as ProtoFlightLeg, type PassengerCounts, encodeFlightFilter } from './proto'

// Decode
export { type DecodedFlight, decodeLeg, decodeLayover, decodeResult, extractDataArray } from './decode'

// Airports
export { searchAirports, isValidAirport } from './airports'

// Dates
export { parseFlexDate, formatDateShort } from './dates'

// Booking / affiliate
export {
  type AffiliateConfig,
  type BookingFilters,
  type ProgramName,
  buildBookingUrl,
  buildBookingUrls,
  resolveIata,
  toBookingFilters,
  PROGRAM_LABELS,
  PROGRAM_NAMES,
} from './booking'

// Offer types (shared between CLI and TUI)
export type {
  Offer,
  CacheQuery,
  SearchEntry,
  SessionSearch,
  LatestSearch,
  Session,
  SessionState,
  SortKey,
} from './offer'

// Filter & sort
export {
  type FilterOpts,
  applyFilters,
  sortOffers,
  parsePrice,
  parseDur,
} from './filter'

// Config
export {
  type FltConfig,
  loadConfig,
  saveConfig,
  isValidKey,
  withDefaults,
} from './config'

// State / cache / session
export {
  CACHE_TTL_MS,
  addFavorite,
  assignFlightIds,
  buildCacheKey,
  buildCacheQuery,
  buildSearchRef,
  clearLatestSearch,
  closeActiveSession,
  createEmptySession,
  describeSearchRequest,
  ensureActiveSession,
  flightHash,
  getActiveSession,
  getFavorites,
  getSessionById,
  isFresh,
  isSessionNameTaken,
  listAvailableRefs,
  nukeCache,
  loadCachedSearch,
  loadSearchByRef,
  loadSession,
  loadSessionScopedSearches,
  loadSessionSearches,
  rememberSearch,
  removeFavorite,
  reopenSession,
  resolveOffer,
  saveCachedSearch,
  saveSession,
  setLatestSearch,
  startSession,
  throttle,
} from './state'

// Itinerary analysis
export {
  checkConnections,
  classifyGap,
  connectionGapMin,
  formatGap,
  formatTotal,
  totalTravelTime,
} from './itinerary'

// Takeout / markdown export
export {
  type BuildMarkdownOpts,
  type Itinerary,
  buildMarkdown,
  formatBooking,
  formatItinerary,
  formatSearchSection,
} from './takeout'

// Route graph (actual airline connections)
export {
  type RouteGraph,
  buildRouteGraph,
  routeAirports,
  directConnections,
} from './routes'

// Connection map (multi-stop route finder)
export {
  type ConnectionMapOptions,
  type ConnectionRoute,
  findConnectionRoutes,
  formatRoute,
  summarizeRoute,
} from './connections'

// Regions (hub groups for --exclude-region)
export { resolveRegions, mergeExclusions, listRegions } from './regions'

// Coordinates, distance & great-circle
export { AIRPORT_COORDS, getCoords, greatCirclePoints, haversineKm } from './coords'

// Date range / matrix helpers
export {
  type CellResult,
  dateRange,
  pickCheapest,
} from './date-range'
