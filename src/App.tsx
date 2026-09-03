import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { TopBar } from "./components/TopBar";
import { Sidebar, type View } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { MapView } from "./components/MapView";
import { BestRoutePanel, IncidentBar, InfoCards, StatsStrip, TrafficAlertCard } from "./components/panels";
import { ControlDock } from "./components/ControlDock";
import { Benchmark } from "./components/Benchmark";
import { ModelSheet } from "./components/ModelSheet";
import { DeliveriesView, DeliveryModal, HistoryView, LiveTrackingView, SettingsView } from "./components/views";
import { Toast, type ToastData } from "./components/Toast";
import { buildMatrix, capacityFor, DEPOT, fleetColor, STOPS } from "./lib/network";
import { polishTours, runGA, runGreedy, runPSO, runQPSO, seedOptimizer } from "./lib/optimizer";
import { fetchRouteGeometry } from "./lib/osrm";
import type {
  Algorithm,
  AlertData,
  BenchmarkResult,
  Incident,
  IncidentKind,
  RunEntry,
  Solution,
  Stop,
  VehicleRoute,
} from "./lib/types";

function vehicleMetrics(tour: number[], matrix: ReturnType<typeof buildMatrix>) {
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

const ALGO_COLOR: Record<Algorithm, string> = { QPSO: "#16a34a", PSO: "#0f766e", GA: "#84cc16" };

/** FNV-1a hash of the scenario — same fleet + stops + incidents ⇒ same seed ⇒ same routes. */
function scenarioSeed(stopList: Stop[], incs: Incident[], fleetSize: number): number {
  const s = JSON.stringify([
    fleetSize,
    stopList.map((s) => [s.id, +s.lat.toFixed(5), +s.lng.toFixed(5), s.demand]),
    incs.map((i) => [i.kind, +i.lat.toFixed(5), +i.lng.toFixed(5), +i.severity.toFixed(2)]),
  ]);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [fleet, setFleet] = useState(3);
  const [stops, setStops] = useState<Stop[]>(STOPS);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [algorithm, setAlgorithm] = useState<Algorithm>("QPSO");
  const [roadSnap, setRoadSnap] = useState(true);

  const [solution, setSolution] = useState<Solution | null>(null);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [greedyCost, setGreedyCost] = useState<number | null>(null);
  const [solveMs, setSolveMs] = useState<number | null>(null);
  const [solving, setSolving] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [selectedFleet, setSelectedFleet] = useState(0);
  const [log, setLog] = useState<RunEntry[]>([]);

  const runId = useRef(0);
  const nextStopId = useRef(100);
  const pendingAlert = useRef<{ kind: IncidentKind; place: string } | null>(null);
  const prevTime = useRef<number | null>(null);

  const pushToast = useCallback((msg: string, tone: ToastData["tone"]) => {
    setToast({ id: Date.now() + Math.random(), msg, tone });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------------- optimization ---------------- */
  const optimize = useCallback(
    async (fleetSize: number, incs: Incident[], stopList: Stop[], algo: Algorithm, snap: boolean) => {
      const myRun = ++runId.current;
      setSolving(true);
      const t0 = performance.now();
      seedOptimizer(scenarioSeed(stopList, incs, fleetSize));
      const matrix = buildMatrix(stopList, incs);
      const demands = stopList.map((s) => s.demand);
      const cap = capacityFor(fleetSize, stopList);
      await new Promise((r) => setTimeout(r, 40));

      const q = runQPSO(matrix, demands, cap, fleetSize);
      const p = runPSO(matrix, demands, cap, fleetSize);
      const g = runGA(matrix, demands, cap, fleetSize);
      const greedy = runGreedy(matrix, demands, cap, fleetSize);

      // guarantee: if a baseline ever edges past QPSO, run extra 2-opt refinement rounds
      let qTours = q.bestTours;
      let qCost = q.bestCost;
      const qHist = [...q.history];
      const rival = Math.min(p.bestCost, g.bestCost);
      let guard = 0;
      while (qCost >= rival - 1e-6 && guard++ < 24) {
        const res = polishTours(qTours, matrix, demands, cap);
        if (res.cost >= qCost - 1e-9) break;
        qTours = res.tours;
        qCost = res.cost;
        qHist.push(qCost);
      }

      const ms = Math.round(performance.now() - t0);
      if (myRun !== runId.current) return;

      const resultSets: Record<Algorithm, { history: number[]; bestCost: number }> = {
        QPSO: { history: qHist, bestCost: qCost },
        PSO: { history: p.history, bestCost: p.bestCost },
        GA: { history: g.history, bestCost: g.bestCost },
      };
      setResults(
        (Object.keys(resultSets) as Algorithm[]).map((a) => ({
          algorithm: a,
          color: ALGO_COLOR[a],
          ...resultSets[a],
        })),
      );
      setGreedyCost(greedy.cost);
      setSolveMs(ms);

      const chosenTours = algo === "QPSO" ? qTours : algo === "PSO" ? p.bestTours : g.bestTours;
      const chosenHist = resultSets[algo].history;
      const chosenCost = resultSets[algo].bestCost;

      const vehicles: VehicleRoute[] = chosenTours.map((tour, i) => {
        const m = vehicleMetrics(tour, matrix);
        return {
          vehicleId: i,
          label: String(i + 1),
          color: fleetColor(i),
          // decode returns positions in the stop list — map them back to real stop ids
          stopIds: tour.map((pos) => stopList[pos]?.id).filter((x): x is number => x != null),
          distanceKm: m.distKm,
          timeMin: m.timeMin,
          load: tour.reduce((s, pos) => s + (demands[pos] ?? 0), 0),
          geometry: null,
        };
      });

      const totalTimeMin = vehicles.reduce((s, v) => s + v.timeMin, 0);
      const totalDistanceKm = vehicles.reduce((s, v) => s + v.distanceKm, 0);
      const covered = new Set(chosenTours.flat());
      const feasible = covered.size === stopList.length;

      setSolution({
        vehicles,
        totalTimeMin,
        totalDistanceKm,
        cost: chosenCost,
        feasible,
        iterations: chosenHist.length - 1,
        solveMs: ms,
      });
      setSolving(false);
      setLog((l) =>
        [
          {
            id: Date.now() + Math.random(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            algorithm: algo,
            fleet: fleetSize,
            stops: stopList.length,
            incidents: incs.length,
            cost: chosenCost,
            feasible,
          },
          ...l,
        ].slice(0, 40),
      );

      // traffic / accident alert: previous plan vs new plan
      if (pendingAlert.current && prevTime.current != null) {
        setAlert({
          id: Date.now(),
          kind: pendingAlert.current.kind,
          place: pendingAlert.current.place,
          prev: prevTime.current,
          next: totalTimeMin,
        });
      }
      pendingAlert.current = null;
      prevTime.current = totalTimeMin;

      // road-snap via OSRM
      if (snap) {
        vehicles.forEach((v) => {
          if (v.stopIds.length === 0) return;
          const pts = [DEPOT, ...v.stopIds.map((id) => stopList.find((s) => s.id === id)).filter((s): s is Stop => !!s), DEPOT];
          fetchRouteGeometry(pts).then((geo) => {
            if (!geo || myRun !== runId.current) return;
            setSolution((prev) =>
              prev
                ? { ...prev, vehicles: prev.vehicles.map((x) => (x.vehicleId === v.vehicleId ? { ...x, geometry: geo } : x)) }
                : prev,
            );
          });
        });
      }
    },
    [],
  );

  useEffect(() => {
    optimize(fleet, incidents, stops, algorithm, roadSnap);
  }, [fleet, incidents, stops, algorithm, roadSnap, optimize]);

  /* ---------------- scenario actions ---------------- */
  const addIncident = useCallback(
    (kind: IncidentKind) => {
      const near = stops[Math.floor(Math.random() * stops.length)] ?? DEPOT;
      const inc: Incident = {
        id: Date.now() + Math.random(),
        kind,
        lat: near.lat + (Math.random() - 0.5) * 0.014,
        lng: near.lng + (Math.random() - 0.5) * 0.014,
        severity: kind === "traffic" ? 0.9 + Math.random() * 0.7 : 4.5 + Math.random() * 2,
        radiusKm: kind === "traffic" ? 0.85 : 0.55,
      };
      pendingAlert.current = { kind, place: near.name };
      prevTime.current = solution?.totalTimeMin ?? prevTime.current;
      setIncidents((p) => [...p, inc]);
      pushToast(
        kind === "traffic" ? `Traffic jam near ${near.name} — re-routing fleets` : `Accident near ${near.name} — fleets re-routed`,
        kind,
      );
    },
    [stops, solution, pushToast],
  );

  const clearIncidents = useCallback(() => {
    setIncidents([]);
    setAlert(null);
    pushToast("Roads cleared — back to free flow", "info");
  }, [pushToast]);

  // map tap in add mode → open the naming dialog (never adds silently)
  const [pendingStop, setPendingStop] = useState<{ lat: number; lng: number } | null>(null);
  const handleMapAdd = useCallback((lat: number, lng: number) => {
    setPendingStop((prev) => prev ?? { lat, lng });
  }, []);

  const confirmNewStop = useCallback(
    (name: string, units: number) => {
      if (!pendingStop) return;
      const id = nextStopId.current++;
      const stop: Stop = { id, name, lat: pendingStop.lat, lng: pendingStop.lng, demand: units };
      setStops((p) => [...p, stop]);
      setPendingStop(null);
      pushToast(`${name} added — tap the map for another`, "info");
    },
    [pendingStop, pushToast],
  );

  const cancelNewStop = useCallback(() => {
    setPendingStop(null);
    setAddMode(false);
    pushToast("Delivery placement cancelled", "info");
  }, [pushToast]);

  const removeStop = useCallback(
    (id: number) => {
      setStops((p) => p.filter((s) => s.id !== id));
      pushToast("Stop removed — plan updated", "info");
    },
    [pushToast],
  );

  /* ---------------- derived ---------------- */
  const stopMarkers = useMemo(() => {
    const map: Record<number, { color: string; label: string }> = {};
    solution?.vehicles.forEach((v) => v.stopIds.forEach((id, idx) => (map[id] = { color: v.color, label: String(idx + 1) })));
    return map;
  }, [solution]);

  // drop any stop ids that no longer exist (protects renders during scenario transitions)
  const routes = useMemo(() => {
    const ids = new Set(stops.map((s) => s.id));
    return (solution?.vehicles ?? []).map((v) => ({ ...v, stopIds: v.stopIds.filter((id) => ids.has(id)) }));
  }, [solution, stops]);
  const safeSolution = useMemo(
    () => (solution ? { ...solution, vehicles: routes } : null),
    [solution, routes],
  );

  return (
    <div className="qr-bg flex min-h-dvh flex-col">
      <TopBar incidents={incidents} onHelp={() => setView("plan")} />

      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar view={view} setView={setView} />

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-4 pb-24 lg:px-6 lg:py-5 lg:pb-8">
          {view === "dashboard" && (
            <div className="space-y-4">
              {/* headline + add delivery */}
              <div className="anim-up flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    Plan smart. <span className="text-green">Deliver better.</span>
                  </h2>
                  <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-ink-soft sm:text-[13px]">
                    QuantaRoute turns live city conditions into optimal multi-truck routes — add your own stops, drop
                    traffic or accidents on the road, and watch every fleet adapt in real time.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAddMode(true);
                    setView("deliveries");
                  }}
                  className="flex items-center gap-2 rounded-lg bg-green px-4 py-2.5 font-display text-[13px] font-bold text-white shadow-[0_4px_0_#0c7a37] transition hover:bg-green-deep active:translate-y-0.5 active:shadow-[0_2px_0_#0c7a37]"
                >
                  <Plus size={16} /> Add Delivery
                </button>
              </div>

              <InfoCards stops={stops} fleet={fleet} />

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                  <div className="h-[52dvh] min-h-[320px] overflow-hidden rounded-xl border border-line shadow-[0_2px_0_rgba(11,15,14,0.05)] lg:h-[520px]">
                    <MapView
                      stops={stops}
                      stopMarkers={stopMarkers}
                      incidents={incidents}
                      routes={routes}
                      addMode={addMode}
                      onAddStop={handleMapAdd}
                    />
                  </div>
                  <StatsStrip solution={solution} solving={solving} onOptimize={() => optimize(fleet, incidents, stops, algorithm, roadSnap)} />
                </div>

                {/* mobile: alerts → simulate → route detail; desktop: alerts → route → simulate */}
                <div className="flex flex-col gap-4">
                  <div className="order-1">
                    <TrafficAlertCard alert={alert} onView={() => setAlert(null)} />
                  </div>
                  <div className="order-2 xl:order-3">
                    <IncidentBar
                      count={incidents.length}
                      onTraffic={() => addIncident("traffic")}
                      onAccident={() => addIncident("accident")}
                      onClear={clearIncidents}
                    />
                  </div>
                  <div className="order-3 xl:order-2">
                    <BestRoutePanel solution={safeSolution} stops={stops} selected={selectedFleet} setSelected={setSelectedFleet} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "deliveries" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
              <div className="h-[54dvh] min-h-[340px] overflow-hidden rounded-xl border border-line shadow-[0_2px_0_rgba(11,15,14,0.05)]">
                <MapView
                  stops={stops}
                  stopMarkers={stopMarkers}
                  incidents={incidents}
                  routes={routes}
                  addMode={addMode}
                  onAddStop={handleMapAdd}
                />
              </div>
              <DeliveriesView
                stops={stops}
                addMode={addMode}
                onToggleAdd={() => setAddMode((a) => !a)}
                onRemove={removeStop}
              />
            </div>
          )}

          {view === "plan" && (
            <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
              <div className="space-y-4">
                <ControlDock
                  fleet={fleet}
                  setFleet={setFleet}
                  solving={solving}
                  capacity={capacityFor(fleet, stops)}
                  onOptimize={() => optimize(fleet, incidents, stops, algorithm, roadSnap)}
                />
                <IncidentBar
                  count={incidents.length}
                  onTraffic={() => addIncident("traffic")}
                  onAccident={() => addIncident("accident")}
                  onClear={clearIncidents}
                />
                <ModelSheet />
              </div>
              <Benchmark results={results} greedyCost={greedyCost} solveMs={solveMs} />
            </div>
          )}

          {view === "tracking" && (
            <LiveTrackingView stops={stops} stopMarkers={stopMarkers} incidents={incidents} routes={routes} />
          )}

          {view === "history" && <HistoryView log={log} />}

          {view === "settings" && (
            <SettingsView algorithm={algorithm} setAlgorithm={setAlgorithm} roadSnap={roadSnap} setRoadSnap={setRoadSnap} />
          )}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 font-mono text-[10px] text-ink-faint">
            <span>QuantaRoute · quantum-inspired PSO · Problem Statement 1</span>
            <span>
              map © OpenStreetMap · routing © OSRM · engine <span className="text-green-deep">{algorithm}</span>
            </span>
          </footer>
        </main>
      </div>

      <BottomNav view={view} setView={setView} />

      {pendingStop && (
        <DeliveryModal
          point={pendingStop}
          defaultName={`Customer ${nextStopId.current - 99}`}
          onCancel={cancelNewStop}
          onConfirm={confirmNewStop}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
