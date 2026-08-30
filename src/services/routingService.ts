// =============================================
// OSRM ROAD ROUTING SERVICE
// Uses the free public OSRM server to convert
// straight-line hops into road-following paths.
// All results are memory-cached so repeated
// calls (e.g. traffic refresh) cost nothing.
// =============================================

type LngLat = [number, number]; // GeoJSON order: [lng, lat]

const OSRM = "https://router.project-osrm.org/route/v1/driving";

// In-memory cache: "lng1,lat1:lng2,lat2" → road coordinates
const cache = new Map<string, LngLat[]>();

function cacheKey(from: LngLat, to: LngLat): string {
  return `${from[0]},${from[1]}:${to[0]},${to[1]}`;
}

// Fetch with a hard timeout so slow/rate-limited responses
// don't stall the map indefinitely.
async function fetchWithTimeout(
  url: string,
  timeoutMs = 7000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns road-following coordinates from `from` to `to`.
 * Throws on network error / no route — caller should fall
 * back to straight-line coords.
 */
export async function getRoadRoute(
  from: LngLat,
  to: LngLat
): Promise<LngLat[]> {
  const key = cacheKey(from, to);

  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const url =
    `${OSRM}/${from[0]},${from[1]};${to[0]},${to[1]}` +
    `?overview=full&geometries=geojson`;

  const res = await fetchWithTimeout(url);

  if (!res.ok) {
    throw new Error(`OSRM HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    code: string;
    routes?: Array<{
      geometry: { coordinates: LngLat[] };
    }>;
  };

  if (json.code !== "Ok" || !json.routes?.length) {
    throw new Error("OSRM: no route found");
  }

  const coords = json.routes[0].geometry.coordinates;
  cache.set(key, coords);
  return coords;
}
