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
  algorithm: "QPSO";
  fleet: number;
  stops: number;
  incidents: number;
  cost: number;
  feasible: boolean;
}

export type Algorithm = "QPSO";

export interface MatrixData {
  time: number[][]; // minutes, node 0 = depot
  dist: number[][]; // km
}

export interface OptionMetrics {
  title: "WAIT" | "REROUTE";
  timeMin: number;
  distKm: number;
  delayMin: number;
  fuelLiters: number;
  co2Kg: number;
  costScore: number;
  routes: VehicleRoute[];
}

export interface WaitRerouteVehicleDetail {
  vehicleId: number;
  label: string;
  color: string;
  isDirectlyAffected: boolean;
  waitTimeMin: number;
  rerouteTimeMin: number;
  timeSavingsMin: number; // waitTimeMin - rerouteTimeMin
  waitDistKm: number;
  rerouteDistKm: number;
  detourDistKm: number; // rerouteDistKm - waitDistKm
  recommendation: "REROUTE" | "WAIT";
}

export interface WaitVsRerouteComparison {
  hasIncident: boolean;
  incidentCount: number;
  freeFlowTimeMin: number;
  waitOption: OptionMetrics;
  rerouteOption: OptionMetrics;
  recommendation: "REROUTE" | "WAIT";
  timeSavedMin: number; // waitOption.timeMin - rerouteOption.timeMin (positive = reroute is faster)
  detourKm: number;     // rerouteOption.distKm - waitOption.distKm
  fuelDiffLiters: number; // waitOption.fuelLiters - rerouteOption.fuelLiters (positive = reroute saves fuel)
  co2DiffKg: number;      // waitOption.co2Kg - rerouteOption.co2Kg
  summaryReason: string;
  vehicles: WaitRerouteVehicleDetail[];
}
