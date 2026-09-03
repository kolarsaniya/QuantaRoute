import type { LatLng } from "./types";

/**
 * Fetch road-snapped geometry from the public OSRM demo server
 * (OpenStreetMap road network). Falls back to null so callers can
 * draw straight lines when offline.
 */
export async function fetchRouteGeometry(points: LatLng[]): Promise<LatLng[] | null> {
  if (points.length < 2) return null;
  try {
    const coords = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal: ctrl.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    return (data.routes[0].geometry.coordinates as [number, number][]).map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return null;
  }
}
