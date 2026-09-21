import { buildMatrix, capacityFor, DEPOT, fleetColor, haversineKm } from "./network";
import { decodeWithFleet, polishTours, runQPSO } from "./optimizer";
import { getCachedRouteGeometry } from "./osrm";
import type { Incident, OptionMetrics, Stop, VehicleRoute, WaitRerouteVehicleDetail, WaitVsRerouteComparison } from "./types";

const BASE_FUEL_PER_KM = 0.11; // Liters per km driving
const IDLE_FUEL_PER_MIN = 0.028; // Liters per minute crawling / idling in congestion
const CO2_PER_LITER = 2.31; // kg CO2 per liter diesel

function computeVehicleMetrics(tour: number[], matrix: ReturnType<typeof buildMatrix>, stopList: Stop[]) {
  let timeMin = 0;
  let distKm = 0;
  let prev = 0;
  for (const id of tour) {
    timeMin += matrix.time[prev][id + 1];
    distKm += matrix.dist[prev][id + 1];
    prev = id + 1;
  }
  if (tour.length) {
    timeMin += matrix.time[prev][0];
    distKm += matrix.dist[prev][0];
  }
  return { timeMin, distKm };
}

/** Check if an edge or stop lies within the congestion radius of any incident */
function tourIntersectsIncidents(tour: number[], stopList: Stop[], incidents: Incident[]): boolean {
  if (incidents.length === 0 || tour.length === 0) return false;
  const nodes = [DEPOT, ...tour.map((idx) => stopList[idx]), DEPOT];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
    for (const inc of incidents) {
      if (haversineKm(mid, inc) <= inc.radiusKm * 1.35 || haversineKm(b, inc) <= inc.radiusKm) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Calculate and compare WAIT vs REROUTE options:
 * - WAIT: fleet holds original schedule, traversing congestion delay & burning idle fuel
 * - REROUTE: QPSO dynamically seeks optimal detour paths around congestion fields
 */
export function calculateWaitVsReroute(
  stops: Stop[],
  incidents: Incident[],
  fleetSize: number,
): WaitVsRerouteComparison {
  const demands = stops.map((s) => s.demand);
  const cap = capacityFor(fleetSize, stops);

  // 1. Free-flow baseline (no incidents)
  const freeFlowMatrix = buildMatrix(stops, []);
  const baselineQ = runQPSO(freeFlowMatrix, demands, cap, fleetSize, 50, 20);
  const baselinePolished = polishTours(baselineQ.bestTours, freeFlowMatrix, demands, cap);
  const baselineTours = baselinePolished.tours;

  // Free-flow metrics
  let freeFlowTotalTime = 0;
  let freeFlowTotalDist = 0;
  baselineTours.forEach((tour) => {
    const m = computeVehicleMetrics(tour, freeFlowMatrix, stops);
    freeFlowTotalTime += m.timeMin;
    freeFlowTotalDist += m.distKm;
  });

  // 2. Active congested matrix
  const congestedMatrix = buildMatrix(stops, incidents);

  // OPTION A: WAIT (Maintain baseline tours on congested network)
  const waitRoutes: VehicleRoute[] = baselineTours.map((tour, i) => {
    const m = computeVehicleMetrics(tour, congestedMatrix, stops);
    const stopPoints = tour.map((pos) => stops[pos]).filter((s): s is Stop => Boolean(s));
    const tourPts = [DEPOT, ...stopPoints, DEPOT];
    return {
      vehicleId: i,
      label: String(i + 1),
      color: fleetColor(i),
      stopIds: stopPoints.map((s) => s.id),
      distanceKm: m.distKm,
      timeMin: m.timeMin,
      load: tour.reduce((s, pos) => s + (demands[pos] ?? 0), 0),
      geometry: getCachedRouteGeometry(tourPts),
    };
  });

  const waitTotalTime = waitRoutes.reduce((s, v) => s + v.timeMin, 0);
  const waitTotalDist = waitRoutes.reduce((s, v) => s + v.distanceKm, 0);
  const waitDelay = Math.max(0, waitTotalTime - freeFlowTotalTime);
  const waitFuel = waitTotalDist * BASE_FUEL_PER_KM + waitDelay * IDLE_FUEL_PER_MIN;
  const waitCo2 = waitFuel * CO2_PER_LITER;

  const waitOption: OptionMetrics = {
    title: "WAIT",
    timeMin: waitTotalTime,
    distKm: waitTotalDist,
    delayMin: waitDelay,
    fuelLiters: waitFuel,
    co2Kg: waitCo2,
    costScore: waitTotalTime + waitDelay * 0.75,
    routes: waitRoutes,
  };

  // OPTION B: REROUTE (Run QPSO on congested matrix)
  let rerouteTours = baselineTours;
  let rerouteTotalTime = waitTotalTime;
  let rerouteTotalDist = waitTotalDist;
  let rerouteRoutes: VehicleRoute[] = waitRoutes;

  if (incidents.length > 0) {
    const rerouteQ = runQPSO(congestedMatrix, demands, cap, fleetSize, 65, 24);
    const reroutePolished = polishTours(rerouteQ.bestTours, congestedMatrix, demands, cap);
    rerouteTours = reroutePolished.tours;

    rerouteRoutes = rerouteTours.map((tour, i) => {
      const m = computeVehicleMetrics(tour, congestedMatrix, stops);
      const stopPoints = tour.map((pos) => stops[pos]).filter((s): s is Stop => Boolean(s));
      const tourPts = [DEPOT, ...stopPoints, DEPOT];
      return {
        vehicleId: i,
        label: String(i + 1),
        color: fleetColor(i),
        stopIds: stopPoints.map((s) => s.id),
        distanceKm: m.distKm,
        timeMin: m.timeMin,
        load: tour.reduce((s, pos) => s + (demands[pos] ?? 0), 0),
        geometry: getCachedRouteGeometry(tourPts),
      };
    });

    rerouteTotalTime = rerouteRoutes.reduce((s, v) => s + v.timeMin, 0);
    rerouteTotalDist = rerouteRoutes.reduce((s, v) => s + v.distanceKm, 0);
  }

  const rerouteDelay = Math.max(0, rerouteTotalTime - freeFlowTotalTime);
  const rerouteFuel = rerouteTotalDist * BASE_FUEL_PER_KM;
  const rerouteCo2 = rerouteFuel * CO2_PER_LITER;

  const rerouteOption: OptionMetrics = {
    title: "REROUTE",
    timeMin: rerouteTotalTime,
    distKm: rerouteTotalDist,
    delayMin: rerouteDelay,
    fuelLiters: rerouteFuel,
    co2Kg: rerouteCo2,
    costScore: rerouteTotalTime + rerouteDelay * 0.4,
    routes: rerouteRoutes,
  };

  // Comparative calculations
  const timeSavedMin = waitTotalTime - rerouteTotalTime;
  const detourKm = rerouteTotalDist - waitTotalDist;
  const fuelDiffLiters = waitFuel - rerouteFuel;
  const co2DiffKg = waitCo2 - rerouteCo2;

  // Recommendation Decision Logic
  let recommendation: "REROUTE" | "WAIT" = "WAIT";
  let summaryReason = "";

  if (incidents.length === 0) {
    recommendation = "WAIT";
    summaryReason = "Roads are clear and traffic is free-flow. Scheduled routes are optimal (Wait = Reroute).";
  } else if (timeSavedMin >= 1.5) {
    recommendation = "REROUTE";
    const fuelClause = fuelDiffLiters > 0.1 ? ` and ${fuelDiffLiters.toFixed(1)} L fuel` : "";
    const detourClause = detourKm > 0.2 ? ` despite a +${detourKm.toFixed(1)} km detour` : "";
    summaryReason = `Rerouting via QPSO is strongly recommended. It saves ${timeSavedMin.toFixed(1)} min${fuelClause} by avoiding severe congestion${detourClause}.`;
  } else if (timeSavedMin > 0 && detourKm < 0.8) {
    recommendation = "REROUTE";
    summaryReason = `Rerouting via QPSO is recommended. Marginal time saving of ${timeSavedMin.toFixed(1)} min with negligible detour penalty.`;
  } else {
    recommendation = "WAIT";
    summaryReason = `Waiting out delay is recommended. The congestion delay (${waitDelay.toFixed(1)} min) is brief, whereas rerouting would add a +${Math.max(0, detourKm).toFixed(1)} km detour.`;
  }

  // Per-vehicle details
  const vehicles: WaitRerouteVehicleDetail[] = baselineTours.map((bTour, i) => {
    const isDirectlyAffected = tourIntersectsIncidents(bTour, stops, incidents);
    const wRoute = waitRoutes[i];
    const rRoute = rerouteRoutes[i];
    const wTime = wRoute ? wRoute.timeMin : 0;
    const rTime = rRoute ? rRoute.timeMin : 0;
    const wDist = wRoute ? wRoute.distanceKm : 0;
    const rDist = rRoute ? rRoute.distanceKm : 0;
    const tSavings = wTime - rTime;
    const dDetour = rDist - wDist;

    const vRec: "REROUTE" | "WAIT" = isDirectlyAffected && tSavings >= 1.0 ? "REROUTE" : "WAIT";

    return {
      vehicleId: i,
      label: String(i + 1),
      color: fleetColor(i),
      isDirectlyAffected,
      waitTimeMin: wTime,
      rerouteTimeMin: rTime,
      timeSavingsMin: tSavings,
      waitDistKm: wDist,
      rerouteDistKm: rDist,
      detourDistKm: dDetour,
      recommendation: vRec,
    };
  });

  return {
    hasIncident: incidents.length > 0,
    incidentCount: incidents.length,
    freeFlowTimeMin: freeFlowTotalTime,
    waitOption,
    rerouteOption,
    recommendation,
    timeSavedMin,
    detourKm,
    fuelDiffLiters,
    co2DiffKg,
    summaryReason,
    vehicles,
  };
}
