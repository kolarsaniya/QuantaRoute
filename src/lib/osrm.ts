import type { LatLng, Stop, VehicleRoute } from "./types";
import { DEPOT } from "./network";
import precomputedRoadsRaw from "./precomputedRoads.json";

const precomputed = precomputedRoadsRaw as unknown as Record<string, [number, number][]>;

/** In-memory cache for dynamic leg queries */
const legCache = new Map<string, LatLng[]>();

/** Pre-seed legCache with all precomputed OpenStreetMap road segments */
for (const [key, coords] of Object.entries(precomputed)) {
  const pts: LatLng[] = coords.map(([lat, lng]) => ({ lat, lng }));
  legCache.set(key, pts);
}

/** In-memory cache for full tour geometries */
const tourCache = new Map<string, LatLng[]>();

function pointsKey(points: LatLng[]): string {
  return points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";");
}

export function getCachedRouteGeometry(points: LatLng[]): LatLng[] | null {
  return tourCache.get(pointsKey(points)) ?? null;
}

/**
 * Fetch real driving road geometry for a single leg between point A and point B from OSRM.
 */
export async function fetchLegGeometry(a: LatLng & { id?: number }, b: LatLng & { id?: number }): Promise<LatLng[]> {
  const idKey = a.id !== undefined && b.id !== undefined ? `${a.id}:${b.id}` : null;
  if (idKey && legCache.has(idKey)) {
    return legCache.get(idKey)!;
  }

  const coordKey = `${a.lat.toFixed(5)},${a.lng.toFixed(5)}->${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;
  if (legCache.has(coordKey)) {
    return legCache.get(coordKey)!;
  }

  try {
    const coords = `${a.lng.toFixed(6)},${a.lat.toFixed(6)};${b.lng.toFixed(6)},${b.lat.toFixed(6)}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal: ctrl.signal },
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
        const coordsList = data.routes[0].geometry.coordinates as [number, number][];
        const geo: LatLng[] = coordsList.map(([lng, lat]) => ({ lat, lng }));
        if (geo.length > 1) {
          if (idKey) legCache.set(idKey, geo);
          legCache.set(coordKey, geo);
          return geo;
        }
      }
    }
  } catch {
    // network fallback below
  }

  // Direct line between A and B if OSRM is unreachable for custom stop
  const direct: LatLng[] = [
    { lat: a.lat, lng: a.lng },
    { lat: b.lat, lng: b.lng },
  ];
  if (idKey) legCache.set(idKey, direct);
  legCache.set(coordKey, direct);
  return direct;
}

/**
 * Fetch and construct the complete road-snapped geometry for a tour.
 * Seamlessly stitches real OpenStreetMap road segments leg-by-leg.
 */
export async function fetchRouteGeometry(points: (LatLng & { id?: number })[]): Promise<LatLng[] | null> {
  if (points.length < 2) return null;
  const key = pointsKey(points);
  const cached = tourCache.get(key);
  if (cached && cached.length > 0) return cached;

  const fullTourPath: LatLng[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const legPts = await fetchLegGeometry(from, to);
    if (i > 0 && legPts.length > 0) {
      // Avoid duplicate junction points
      fullTourPath.push(...legPts.slice(1));
    } else {
      fullTourPath.push(...legPts);
    }
  }

  if (fullTourPath.length > 0) {
    // Guarantee that route starts and ends at the exact terminal coordinates (Central Depot)
    fullTourPath[0] = { lat: points[0].lat, lng: points[0].lng };
    fullTourPath[fullTourPath.length - 1] = {
      lat: points[points.length - 1].lat,
      lng: points[points.length - 1].lng,
    };
    tourCache.set(key, fullTourPath);
    return fullTourPath;
  }
  return null;
}

/**
 * Snap an entire fleet of routes to actual OpenStreetMap roads.
 * Attaches real road geometry coordinates to every active vehicle.
 */
export async function snapVehicleRoutes(
  vehicles: VehicleRoute[],
  stops: Stop[],
): Promise<VehicleRoute[]> {
  const updated = await Promise.all(
    vehicles.map(async (v) => {
      if (v.stopIds.length === 0) return v;

      const stopObjects = v.stopIds
        .map((id) => stops.find((s) => s.id === id))
        .filter((s): s is Stop => Boolean(s));

      if (stopObjects.length === 0) return v;

      const tourPoints: (LatLng & { id?: number })[] = [DEPOT, ...stopObjects, DEPOT];

      // Check synchronous cache first
      const cached = getCachedRouteGeometry(tourPoints);
      if (cached && cached.length > v.stopIds.length + 2) {
        return { ...v, geometry: cached };
      }

      // Fetch / stitch real road segments
      const geo = await fetchRouteGeometry(tourPoints);
      return geo ? { ...v, geometry: geo } : v;
    }),
  );

  return updated;
}
