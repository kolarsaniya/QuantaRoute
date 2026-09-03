export interface LatLng {
  lat: number;
  lng: number;
}

export interface Stop extends LatLng {
  id: number;
  name: string;
  demand: number; // delivery units
}

export type IncidentKind = "traffic" | "accident";

export interface Incident extends LatLng {
  id: number;
  kind: IncidentKind;
  severity: number; // congestion multiplier contribution
  radiusKm: number;
}

export interface VehicleRoute {
  vehicleId: number;
  label: string;
  color: string;
  stopIds: number[];
  distanceKm: number;
  timeMin: number;
  load: number;
  geometry: LatLng[] | null; // road-snapped path from OSRM, null = straight lines
}

export interface Solution {
  vehicles: VehicleRoute[];
  totalTimeMin: number;
  totalDistanceKm: number;
  cost: number;
  feasible: boolean;
  iterations: number;
  solveMs: number;
}

export interface BenchmarkResult {
  algorithm: string;
  color: string;
  history: number[]; // best cost per iteration
  bestCost: number;
}

export interface AlertData {
  id: number;
  kind: "traffic" | "accident";
  place: string;
  prev: number;
  next: number;
}

export interface RunEntry {
  id: number;
  time: string;
  algorithm: string;
  fleet: number;
  stops: number;
  incidents: number;
  cost: number;
  feasible: boolean;
}

export type Algorithm = "QPSO" | "PSO" | "GA";

export interface MatrixData {
  time: number[][]; // minutes, node 0 = depot
  dist: number[][]; // km
}
