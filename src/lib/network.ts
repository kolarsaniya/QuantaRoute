import type { Incident, LatLng, MatrixData, Stop } from "./types";

/** Depot — central dispatch hub (Cubbon Park, Bengaluru) */
export const DEPOT: Stop = {
  id: -1,
  name: "Central Depot",
  lat: 12.9767,
  lng: 77.5952,
  demand: 0,
};

/** Delivery destinations across the city */
export const STOPS: Stop[] = [
  { id: 0, name: "Indiranagar", lat: 12.9719, lng: 77.6412, demand: 4 },
  { id: 1, name: "Koramangala", lat: 12.9352, lng: 77.6245, demand: 6 },
  { id: 2, name: "Jayanagar", lat: 12.925, lng: 77.5838, demand: 3 },
  { id: 3, name: "Malleshwaram", lat: 13.0031, lng: 77.5659, demand: 5 },
  { id: 4, name: "Hebbal", lat: 13.0358, lng: 77.597, demand: 7 },
  { id: 5, name: "Marathahalli", lat: 12.9591, lng: 77.6974, demand: 6 },
  { id: 6, name: "HSR Layout", lat: 12.9116, lng: 77.6446, demand: 4 },
  { id: 7, name: "Rajajinagar", lat: 12.9909, lng: 77.552, demand: 5 },
  { id: 8, name: "BTM Layout", lat: 12.9166, lng: 77.6101, demand: 3 },
  { id: 9, name: "Yeshwanthpur", lat: 13.0283, lng: 77.5526, demand: 6 },
];

export const TOTAL_DEMAND = STOPS.reduce((s, x) => s + x.demand, 0);

/** High-contrast, clearly distinguishable route colors — cycled for any fleet size */
const FLEET_PALETTE = [
  "#16a34a", // green
  "#2563eb", // blue
  "#f97316", // orange
  "#db2777", // magenta
  "#0891b2", // cyan
  "#7c3aed", // violet
  "#dc2626", // red
  "#ca8a04", // gold
  "#0d9488", // teal
  "#65a30d", // lime
  "#475569", // slate
  "#e11d48", // rose
];
export const FLEET_COLORS = FLEET_PALETTE;
export function fleetColor(i: number): string {
  return FLEET_PALETTE[((i % FLEET_PALETTE.length) + FLEET_PALETTE.length) % FLEET_PALETTE.length];
}
export const FLEET_LABELS = ["1", "2", "3", "4", "5"];

const ROAD_FACTOR = 1.27; // road distance vs. straight line
const BASE_SPEED_KMH = 26; // free-flow urban speed

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Local congestion multiplier at a point given active incidents (dynamic weight update). */
export function congestionAt(p: LatLng, incidents: Incident[]): number {
  let c = 1;
  for (const inc of incidents) {
    const d = haversineKm(p, inc);
    c += inc.severity * Math.exp(-((d / inc.radiusKm) ** 2));
  }
  return Math.min(c, 9);
}

export function edgeTimeMin(a: LatLng, b: LatLng, incidents: Incident[]): { time: number; dist: number } {
  const dist = haversineKm(a, b) * ROAD_FACTOR;
  const mid: LatLng = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  const time = (dist / BASE_SPEED_KMH) * 60 * congestionAt(mid, incidents);
  return { time, dist };
}

/** Build the weighted adjacency matrix (depot + stops). Edge weights = congested travel time. */
export function buildMatrix(stops: Stop[], incidents: Incident[]): MatrixData {
  const nodes: LatLng[] = [DEPOT, ...stops];
  const n = nodes.length;
  const time: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const e = edgeTimeMin(nodes[i], nodes[j], incidents);
      time[i][j] = time[j][i] = e.time;
      dist[i][j] = dist[j][i] = e.dist;
    }
  }
  return { time, dist };
}

/** Vehicle capacity for a given fleet size — always fits the largest single drop. */
export function capacityFor(fleetSize: number, stops: Stop[] = STOPS): number {
  const total = stops.reduce((s, x) => s + x.demand, 0);
  const maxD = Math.max(1, ...stops.map((x) => x.demand));
  return Math.max(maxD, Math.ceil(total / fleetSize)) + 2;
}

export function avgCongestion(incidents: Incident[]): number {
  if (incidents.length === 0) return 1;
  let s = 0;
  for (const st of STOPS) s += congestionAt(st, incidents);
  return s / STOPS.length;
}
