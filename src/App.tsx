import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Truck } from "lucide-react";
import { TopBar, type UserRole } from "./components/TopBar";
import { Sidebar, type View } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { MapView } from "./components/MapView";
import { BestRoutePanel, IncidentBar, InfoCards, StatsStrip, TrafficAlertCard } from "./components/panels";
import { ControlDock } from "./components/ControlDock";
import { WaitRerouteComparator } from "./components/WaitRerouteComparator";
import { ModelSheet } from "./components/ModelSheet";
import { DeliveriesView, DeliveryModal, HistoryView, LiveTrackingView, SettingsView } from "./components/views";
import { FleetManagerDashboard } from "./components/FleetManagerDashboard";
import { FleetVehiclesView } from "./components/FleetVehiclesView";
import { FleetManifestView } from "./components/FleetManifestView";
import { FleetMaintenanceView } from "./components/FleetMaintenanceView";
import { DriverAssistantView } from "./components/DriverAssistantView";
import { DriverDeliveriesView } from "./components/DriverDeliveriesView";
import { DriverReportsView } from "./components/DriverReportsView";
import { DriverNotificationsView } from "./components/DriverNotificationsView";
import { AdminNotificationsView } from "./components/AdminNotificationsView";
import { AddFleetModal } from "./components/AddFleetModal";
import { ProfileModal } from "./components/ProfileModal";
import { DraftNotificationModal } from "./components/DraftNotificationModal";
import { HelpModal } from "./components/HelpModal";
import { Toast, type ToastData } from "./components/Toast";
import { buildMatrix, capacityFor, DEPOT, fleetColor, STOPS } from "./lib/network";
import { polishTours, runQPSO, seedOptimizer } from "./lib/optimizer";
import { calculateWaitVsReroute } from "./lib/waitReroute";
import { getCachedRouteGeometry, snapVehicleRoutes } from "./lib/osrm";
import {
  INITIAL_DRIVERS,
  INITIAL_NOTIFICATIONS,
  type AppNotification,
  type DriverIncidentReport,
  type DriverProfile,
} from "./lib/driverTypes";
import type {
  AlertData,
  Incident,
  IncidentKind,
  RunEntry,
  RunStatus,
  Solution,
  Stop,
  VehicleRoute,
  WaitVsRerouteComparison,
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
  const [role, setRole] = useState<UserRole>("admin");
  const [drivers, setDrivers] = useState<DriverProfile[]>(INITIAL_DRIVERS);
  const [driverReports, setDriverReports] = useState<DriverIncidentReport[]>([]);
  const [driverNotifications, setDriverNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Modal dialog states
  const [addFleetOpen, setAddFleetOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [draftNotifOpen, setDraftNotifOpen] = useState(false);

  // Active driver for in-cab assistant (Driver #1 · Rajesh Kumar)
  const activeDriver = drivers[0];

  const [view, setView] = useState<View>("dashboard");
  const [fleet, setFleet] = useState(3);
  const [stops, setStops] = useState<Stop[]>(STOPS);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [roadSnap, setRoadSnap] = useState(true);

  const handleRoleChange = useCallback((newRole: UserRole) => {
    setRole(newRole);
    if (newRole === "fleetdriver") {
      setView("driver-assistant");
    } else if (newRole === "fleetmanager") {
      setView("fleet-dashboard");
    } else {
      setView("dashboard");
    }
  }, []);

  // WAIT vs REROUTE state
  const [activeRouteMode, setActiveRouteMode] = useState<"reroute" | "wait">("reroute");
  const [waitVsReroute, setWaitVsReroute] = useState<WaitVsRerouteComparison | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [solution, setSolution] = useState<Solution | null>(null);
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
  const prevIncidents = useRef<number>(0);

  const pushToast = useCallback((msg: string, tone?: ToastData["tone"]) => {
    setToast({ id: Date.now() + Math.random(), msg, tone: tone || "info" });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------------- optimization (QPSO exclusively) ---------------- */
  const optimize = useCallback(
    async (fleetSize: number, incs: Incident[], stopList: Stop[], snap: boolean) => {
      const myRun = ++runId.current;
      setSolving(true);
      const t0 = performance.now();
      seedOptimizer(scenarioSeed(stopList, incs, fleetSize));
      const matrix = buildMatrix(stopList, incs);
      const demands = stopList.map((s) => s.demand);
      const cap = capacityFor(fleetSize, stopList);
      await new Promise((r) => setTimeout(r, 40));

      // Pure Quantum PSO run
      const q = runQPSO(matrix, demands, cap, fleetSize, 70, 26);
      const polished = polishTours(q.bestTours, matrix, demands, cap, 5);
      const chosenTours = polished.cost < q.bestCost ? polished.tours : q.bestTours;
      const chosenCost = Math.min(q.bestCost, polished.cost);
      const chosenHist = q.history;

      // Calculate and compare WAIT vs REROUTE
      const comparison = calculateWaitVsReroute(stopList, incs, fleetSize);

      const ms = Math.round(performance.now() - t0);
      if (myRun !== runId.current) return;

      setWaitVsReroute(comparison);
      setSolveMs(ms);

      const vehicles: VehicleRoute[] = chosenTours.map((tour, i) => {
        const m = vehicleMetrics(tour, matrix);
        const stopIds = tour.map((pos) => stopList[pos]?.id).filter((x): x is number => x != null);
        const stopPoints = stopIds.map((id) => stopList.find((s) => s.id === id)).filter((s): s is Stop => Boolean(s));
        const pts = [DEPOT, ...stopPoints, DEPOT];
        return {
          vehicleId: i,
          label: String(i + 1),
          color: fleetColor(i),
          stopIds,
          distanceKm: m.distKm,
          timeMin: m.timeMin,
          load: tour.reduce((s, pos) => s + (demands[pos] ?? 0), 0),
          geometry: getCachedRouteGeometry(pts),
        };
      });

      const totalTimeMin = vehicles.reduce((s, v) => s + v.timeMin, 0);
      const totalDistanceKm = vehicles.reduce((s, v) => s + v.distanceKm, 0);
      const covered = new Set(chosenTours.flat());
      const feasible = covered.size === stopList.length;

      // Situation-aware status and human-readable trigger description
      let runStatus: RunStatus = "OPTIMAL";
      let situationDesc = "Free flow — optimal baseline";
      const maxTruckLoad = Math.max(0, ...chosenTours.map((t) => t.reduce((s, p) => s + (demands[p] ?? 0), 0)));
      const isOverCapacity = maxTruckLoad > cap;

      if (isOverCapacity) {
        runStatus = "OVERLOAD";
        situationDesc = `Capacity exceeded (${maxTruckLoad}/${cap} units)`;
      } else if (incs.length === 0) {
        if (prevIncidents.current > 0) {
          runStatus = "CLEARED";
          situationDesc = "Incidents cleared — free flow restored";
        } else {
          runStatus = "OPTIMAL";
          situationDesc = "Free flow — optimal baseline";
        }
      } else {
        const hasAccident = incs.some((i) => i.kind === "accident");
        const hasTraffic = incs.some((i) => i.kind === "traffic");
        const alertPlace = pendingAlert.current?.place;
        const fallbackPlace = incs[0] ? `corridor near Stop ${Math.round(incs[0].lat * 100) % 10 + 1}` : "active corridor";
        const place = alertPlace ?? fallbackPlace;

        if (hasAccident) {
          if (comparison.recommendation === "REROUTE") {
            runStatus = "REROUTED";
            situationDesc = `Accident near ${place} — QPSO detour bypass`;
          } else {
            runStatus = "ACCIDENT";
            situationDesc = `Accident near ${place} — road blocked`;
          }
        } else if (hasTraffic) {
          if (comparison.recommendation === "REROUTE") {
            runStatus = "REROUTED";
            situationDesc = `Heavy traffic near ${place} — QPSO saves ${comparison.timeSavedMin.toFixed(0)}m`;
          } else {
            runStatus = "WAITING";
            situationDesc = `Traffic delay near ${place} — waiting is faster`;
          }
        }
      }
      prevIncidents.current = incs.length;

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
            fleet: fleetSize,
            stops: stopList.length,
            incidents: incs.length,
            cost: chosenCost,
            feasible,
            status: runStatus,
            situation: situationDesc,
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

      // road-snap via OSRM for BOTH reroute and wait routes
      if (snap) {
        Promise.all([
          snapVehicleRoutes(vehicles, stopList),
          snapVehicleRoutes(comparison.waitOption.routes, stopList),
        ]).then(([snappedVehicles, snappedWait]) => {
          if (myRun !== runId.current) return;
          setSolution((prev) =>
            prev ? { ...prev, vehicles: snappedVehicles } : prev,
          );
          setWaitVsReroute((prev) =>
            prev
              ? {
                  ...prev,
                  waitOption: { ...prev.waitOption, routes: snappedWait },
                  rerouteOption: { ...prev.rerouteOption, routes: snappedVehicles },
                }
              : prev,
          );
        });
      }
    },
    [],
  );

  useEffect(() => {
    optimize(fleet, incidents, stops, roadSnap);
  }, [fleet, incidents, stops, roadSnap, optimize]);

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
        kind === "traffic"
          ? `Traffic jam near ${near.name} — comparing WAIT vs REROUTE`
          : `Accident near ${near.name} — comparing WAIT vs REROUTE`,
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
  // Drop any stop ids that no longer exist
  const rerouteRoutes = useMemo(() => {
    const ids = new Set(stops.map((s) => s.id));
    return (solution?.vehicles ?? []).map((v) => ({ ...v, stopIds: v.stopIds.filter((id) => ids.has(id)) }));
  }, [solution, stops]);

  const waitRoutes = useMemo(() => {
    if (!waitVsReroute) return rerouteRoutes;
    const ids = new Set(stops.map((s) => s.id));
    return waitVsReroute.waitOption.routes.map((v) => ({ ...v, stopIds: v.stopIds.filter((id) => ids.has(id)) }));
  }, [waitVsReroute, rerouteRoutes, stops]);

  // Active primary route based on user toggle (REROUTE vs WAIT)
  const activeRoutes = activeRouteMode === "wait" ? waitRoutes : rerouteRoutes;

  // Node bubble colors and drop labels dynamically match the active mode (WAIT vs REROUTE)
  const stopMarkers = useMemo(() => {
    const map: Record<number, { color: string; label: string }> = {};
    activeRoutes.forEach((v) => {
      v.stopIds.forEach((id, idx) => {
        map[id] = { color: v.color, label: String(idx + 1) };
      });
    });
    return map;
  }, [activeRoutes]);

  // Alternate route (rendered as dashed ghost line when comparing)
  const altRoutes =
    incidents.length > 0 && waitVsReroute
      ? activeRouteMode === "wait"
        ? rerouteRoutes
        : waitRoutes
      : undefined;

  // Driver route isolation (strictly Vehicle #1 / vehicleId 0)
  const isDriver = role === "fleetdriver";

  const driverActiveRoutes = useMemo(() => {
    const r = activeRoutes.find((v) => v.vehicleId === 0) || activeRoutes[0];
    return r ? [r] : [];
  }, [activeRoutes]);

  const driverAltRoutes = useMemo(() => {
    if (!altRoutes) return undefined;
    const r = altRoutes.find((v) => v.vehicleId === 0) || altRoutes[0];
    return r ? [r] : undefined;
  }, [altRoutes]);

  const driverStops = useMemo(() => {
    const r = driverActiveRoutes[0];
    if (!r) return stops;
    const stopIdSet = new Set(r.stopIds);
    return stops.filter((s) => stopIdSet.has(s.id));
  }, [driverActiveRoutes, stops]);

  const driverStopMarkers = useMemo(() => {
    const map: Record<number, { color: string; label: string }> = {};
    const r = driverActiveRoutes[0];
    if (r) {
      r.stopIds.forEach((id, idx) => {
        map[id] = { color: r.color, label: String(idx + 1) };
      });
    }
    return map;
  }, [driverActiveRoutes]);

  /* ---------------- driver management & reporting ---------------- */
  const handleUpdateDriver = useCallback(
    (updated: DriverProfile) => {
      setDrivers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      pushToast(`Driver ${updated.name}'s profile updated by Admin`, "info");
    },
    [pushToast],
  );

  const handleAddNewFleet = useCallback(
    (newDriver: DriverProfile) => {
      setDrivers((prev) => [...prev, newDriver]);
      setFleet((prev) => Math.min(5, Math.max(prev, newDriver.vehicleNumber)));
      setAddFleetOpen(false);
      pushToast(`Vehicle #${newDriver.vehicleNumber} & Driver ${newDriver.name} added to fleet!`, "info");

      const welcomeNotif: AppNotification = {
        id: `NOTIF-${Date.now()}`,
        senderRole: "admin",
        senderName: "Fleet Admin",
        recipientRole: "fleetdriver",
        recipientId: newDriver.id,
        recipientName: newDriver.name,
        title: `Vehicle #${newDriver.vehicleNumber} Assigned`,
        message: `Welcome ${newDriver.name}! You are assigned to ${newDriver.vehicleModel} (${newDriver.plate}). Shift: ${newDriver.shift}.`,
        timestamp: "Just now",
        priority: "general",
        read: false,
        acknowledged: false,
        type: "notification",
      };
      setDriverNotifications((prev) => [welcomeNotif, ...prev]);
    },
    [pushToast],
  );

  const handleSendNotification = useCallback(
    (notif: AppNotification) => {
      setDriverNotifications((prev) => [notif, ...prev]);
      setDraftNotifOpen(false);
      pushToast(`Notification dispatched to ${notif.recipientName || notif.recipientRole}!`, "info");
    },
    [pushToast],
  );

  const handleAcknowledgeNotification = useCallback(
    (id: string) => {
      setDriverNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, acknowledged: true, read: true } : n)),
      );
      pushToast("Notification acknowledged", "info");
    },
    [pushToast],
  );

  const handleMarkAllNotificationsRead = useCallback(() => {
    setDriverNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    pushToast("All notifications marked as read", "info");
  }, [pushToast]);

  const handleSendReplyToAdmin = useCallback(
    (replyText: string) => {
      const replyNotif: AppNotification = {
        id: `NOTIF-${Date.now()}`,
        senderRole: "fleetdriver",
        senderName: activeDriver?.name || "Driver",
        recipientRole: "admin",
        recipientName: "Super Admin",
        title: `Reply from ${activeDriver?.name || "Driver"}`,
        message: replyText,
        timestamp: "Just now",
        priority: "general",
        read: false,
        acknowledged: false,
        type: "status_reply",
      };
      setDriverNotifications((prev) => [replyNotif, ...prev]);
      pushToast(`Reply sent to Dispatch: "${replyText}"`, "info");
    },
    [activeDriver, pushToast],
  );

  const handleDriverSubmitReport = useCallback(
    (report: DriverIncidentReport) => {
      setDriverReports((prev) => [report, ...prev]);

      const notif: AppNotification = {
        id: `NOTIF-${Date.now()}`,
        senderRole: "fleetdriver",
        senderName: report.driverName,
        recipientRole: "admin",
        recipientName: "Super Admin",
        title: `Driver Report: ${report.title}`,
        message: `${report.driverName} (${report.vehiclePlate}): ${report.description}`,
        timestamp: "Just now",
        priority: report.severity === "critical" ? "urgent" : "route_update",
        read: false,
        acknowledged: false,
        type: "incident_report",
      };
      setDriverNotifications((prev) => [notif, ...prev]);

      if (report.type === "traffic" || report.type === "roadblock") {
        addIncident("traffic");
      } else if (report.type === "breakdown" || report.type === "sos") {
        addIncident("accident");
      }
    },
    [addIncident],
  );

  const unreadNotifCount = useMemo(() => {
    return driverNotifications.filter((n) => {
      if (n.read) return false;
      if (role === "admin") {
        return (
          n.recipientRole === "admin" ||
          n.recipientRole === "all" ||
          n.senderRole === "fleetdriver"
        );
      }
      if (role === "fleetmanager") {
        return n.recipientRole === "fleetmanager" || n.recipientRole === "all";
      }
      if (role === "fleetdriver") {
        return (
          n.recipientRole === "fleetdriver" ||
          n.recipientRole === "all" ||
          n.recipientId === activeDriver?.id
        );
      }
      return false;
    }).length;
  }, [driverNotifications, role, activeDriver]);

  const safeSolution = useMemo(
    () => (solution ? { ...solution, vehicles: activeRoutes } : null),
    [solution, activeRoutes],
  );

  return (
    <div className="qr-bg flex min-h-dvh flex-col w-full max-w-full overflow-x-hidden">
      <TopBar
        incidents={incidents}
        onHelp={() => setHelpOpen(true)}
        onToast={pushToast}
        role={role}
        onRoleChange={handleRoleChange}
        activeDriver={activeDriver}
        onViewProfile={() => setProfileOpen(true)}
        unreadCount={unreadNotifCount}
        onOpenNotifications={() =>
          setView(role === "admin" ? "admin-notifications" : "driver-notifications")
        }
      />

      <div className="flex flex-1 flex-col lg:flex-row w-full max-w-full min-w-0">
        <Sidebar
          view={view}
          setView={setView}
          role={role}
          unreadNotificationsCount={unreadNotifCount}
        />

        <main className="mx-auto w-full max-w-[1400px] min-w-0 flex-1 px-3 py-3 pb-24 sm:px-4 sm:py-4 lg:px-6 lg:py-5 lg:pb-8 overflow-x-hidden">
          {view === "dashboard" && (
            <div className="space-y-4 min-w-0">
              {/* headline + add delivery */}
              <div className="anim-up flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    Plan smart. <span className="text-green">Deliver better.</span>
                  </h2>
                  <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-ink-soft sm:text-[13px]">
                    QuantaRoute powers multi-truck dispatching with Quantum-Inspired Particle Swarm Optimization (QPSO).
                    Simulate city congestion, evaluate whether to WAIT or REROUTE, and dispatch with precision.
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

              <InfoCards stops={stops} />

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] min-w-0">
                <div className="space-y-4 min-w-0">
                  <div className="relative isolate z-0 h-[52dvh] min-h-[320px] overflow-hidden rounded-xl border border-line shadow-[0_2px_0_rgba(11,15,14,0.05)] lg:h-[520px]">
                    <MapView
                      stops={stops}
                      stopMarkers={stopMarkers}
                      incidents={incidents}
                      routes={activeRoutes}
                      altRoutes={altRoutes}
                      addMode={addMode}
                      onAddStop={handleMapAdd}
                    />

                    {/* Active Route Mode Indicator overlay on map */}
                    {incidents.length > 0 && (
                      <div className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 rounded-lg border border-line/70 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
                        <span className="text-[11px] font-semibold text-ink-soft">Displaying:</span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                            activeRouteMode === "reroute" ? "bg-green text-white" : "bg-amber text-ink"
                          }`}
                        >
                          {activeRouteMode}
                        </span>
                        <button
                          onClick={() => setActiveRouteMode((m) => (m === "reroute" ? "wait" : "reroute"))}
                          className="ml-1 text-[11px] text-ink-faint hover:text-ink underline transition"
                        >
                          switch to {activeRouteMode === "reroute" ? "wait" : "reroute"}
                        </button>
                      </div>
                    )}
                  </div>
                  <StatsStrip solution={safeSolution} solving={solving} onOptimize={() => optimize(fleet, incidents, stops, roadSnap)} />
                </div>

                {/* mobile: alerts → simulate → route detail; desktop: alerts → route → simulate */}
                <div className="flex flex-col gap-4 min-w-0">
                  <div className="order-1">
                    <TrafficAlertCard
                      alert={alert}
                      onView={() => setView("compare")}
                      waitMin={waitVsReroute?.waitOption.timeMin}
                      rerouteMin={waitVsReroute?.rerouteOption.timeMin}
                      timeSaved={waitVsReroute?.timeSavedMin}
                    />
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
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px] min-w-0">
              <div className="relative isolate z-0 h-[54dvh] min-h-[340px] overflow-hidden rounded-xl border border-line shadow-[0_2px_0_rgba(11,15,14,0.05)]">
                <MapView
                  stops={stops}
                  stopMarkers={stopMarkers}
                  incidents={incidents}
                  routes={activeRoutes}
                  altRoutes={altRoutes}
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

          {view === "compare" && (
            <div className={isDriver ? "space-y-4 min-w-0" : "grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] min-w-0"}>
              <div className="space-y-4 min-w-0">
                {/* Map view at top — matching Dashboard, Deliveries, and Tracking */}
                <div className="relative isolate z-0 h-[50dvh] min-h-[300px] overflow-hidden rounded-xl border border-line shadow-[0_2px_0_rgba(11,15,14,0.05)] lg:h-[480px]">
                  <MapView
                    stops={isDriver ? driverStops : stops}
                    stopMarkers={isDriver ? driverStopMarkers : stopMarkers}
                    incidents={incidents}
                    routes={isDriver ? driverActiveRoutes : activeRoutes}
                    altRoutes={isDriver ? driverAltRoutes : altRoutes}
                    addMode={false}
                    onAddStop={handleMapAdd}
                  />

                  {/* Driver Route Isolation Badge */}
                  {isDriver && (
                    <div className="absolute top-3 left-3 z-[500] flex items-center gap-1.5 rounded-lg border border-green/30 bg-night/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
                      <Truck size={13} className="text-green-bright" />
                      <span className="font-mono text-[11px] font-bold text-white">
                        Showing Your Route Only · Vehicle #1
                      </span>
                    </div>
                  )}

                  {/* Active Route Mode Indicator overlay on map */}
                  <div className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 rounded-lg border border-line/70 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
                    <span className="text-[11px] font-semibold text-ink-soft">Active View:</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        activeRouteMode === "reroute" ? "bg-green text-white" : "bg-amber text-ink"
                      }`}
                    >
                      {activeRouteMode}
                    </span>
                    <button
                      onClick={() => setActiveRouteMode((m) => (m === "reroute" ? "wait" : "reroute"))}
                      className="ml-1 text-[11px] text-ink-faint hover:text-ink underline transition font-medium"
                    >
                      switch to {activeRouteMode === "reroute" ? "wait" : "reroute"}
                    </button>
                  </div>
                </div>

                {/* Comparator Details */}
                {waitVsReroute ? (
                  <WaitRerouteComparator
                    comparison={waitVsReroute}
                    activeMode={activeRouteMode}
                    onSelectMode={setActiveRouteMode}
                    onAddTraffic={() => addIncident("traffic")}
                    onAddAccident={() => addIncident("accident")}
                    onClearIncidents={clearIncidents}
                    solveMs={solveMs}
                    driverVehicleId={isDriver ? 0 : undefined}
                    driverName={isDriver ? activeDriver.name : undefined}
                  />
                ) : (
                  <div className="rounded-xl border border-line bg-card p-6 text-center text-[13px] text-ink-faint">
                    Calculating WAIT vs REROUTE options…
                  </div>
                )}
              </div>

              {/* Side controls (only for Admin and Fleet Manager, hidden for Fleet Driver on mobile) */}
              {!isDriver && (
                <div className="space-y-4 min-w-0">
                  <ControlDock
                    solving={solving}
                    onOptimize={() => optimize(fleet, incidents, stops, roadSnap)}
                  />
                  <IncidentBar
                    count={incidents.length}
                    onTraffic={() => addIncident("traffic")}
                    onAccident={() => addIncident("accident")}
                    onClear={clearIncidents}
                  />
                  <ModelSheet />
                </div>
              )}
            </div>
          )}

          {view === "tracking" && (
            <LiveTrackingView stops={stops} stopMarkers={stopMarkers} incidents={incidents} routes={activeRoutes} />
          )}

          {view === "history" && <HistoryView log={log} />}

          {view === "settings" && (
            <SettingsView roadSnap={roadSnap} setRoadSnap={setRoadSnap} />
          )}

          {/* Admin Notifications View */}
          {view === "admin-notifications" && (
            <AdminNotificationsView
              notifications={driverNotifications}
              onDraftClick={() => setDraftNotifOpen(true)}
              onAcknowledge={handleAcknowledgeNotification}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onToast={pushToast}
            />
          )}

          {/* Fleet Manager Views */}
          {view === "fleet-dashboard" && (
            <FleetManagerDashboard
              stops={stops}
              stopMarkers={stopMarkers}
              incidents={incidents}
              routes={activeRoutes}
              altRoutes={altRoutes}
              solution={safeSolution}
              waitVsReroute={waitVsReroute}
              onNavigateTab={(tab) => setView(tab)}
              onAddTraffic={() => addIncident("traffic")}
              onAddAccident={() => addIncident("accident")}
              onClearIncidents={clearIncidents}
              onToast={pushToast}
              onDraftClick={() => setDraftNotifOpen(true)}
            />
          )}

          {view === "fleet-vehicles" && (
            <FleetVehiclesView
              routes={activeRoutes}
              stops={stops}
              drivers={drivers}
              onUpdateDriver={handleUpdateDriver}
              onToast={pushToast}
              onAddNewFleetClick={() => setAddFleetOpen(true)}
            />
          )}

          {view === "fleet-manifest" && (
            <FleetManifestView
              routes={activeRoutes}
              stops={stops}
              onToast={pushToast}
            />
          )}

          {view === "fleet-maintenance" && (
            <FleetMaintenanceView onToast={pushToast} />
          )}

          {/* Fleet Driver Views */}
          {view === "driver-assistant" && (
            <DriverAssistantView
              driver={activeDriver}
              stops={stops}
              route={activeRoutes[0]}
              incidents={incidents}
              notifications={driverNotifications}
              onNavigateTab={(tab) => setView(tab)}
              onReportIncident={(type, note) => {
                handleDriverSubmitReport({
                  id: `REP-${Date.now().toString().slice(-6)}`,
                  driverId: activeDriver.id,
                  driverName: activeDriver.name,
                  vehiclePlate: activeDriver.plate,
                  type: type,
                  title:
                    type === "traffic"
                      ? "Heavy Traffic Jam"
                      : type === "breakdown"
                        ? "Vehicle Breakdown"
                        : type === "roadblock"
                          ? "Road Blocked"
                          : "Customer Absent",
                  description: note || `Driver reported ${type}`,
                  locationName: stops[0]?.name || "Bangalore Central",
                  lat: stops[0]?.lat || 12.9716,
                  lng: stops[0]?.lng || 77.5946,
                  severity: type === "breakdown" ? "high" : "medium",
                  timestamp: "Just now",
                  status: "reported",
                });
              }}
              onAcknowledgeNotification={handleAcknowledgeNotification}
              onToast={pushToast}
              onDraftClick={() => setDraftNotifOpen(true)}
            />
          )}

          {view === "driver-deliveries" && (
            <DriverDeliveriesView
              driver={activeDriver}
              stops={stops}
              route={activeRoutes[0]}
              onToast={pushToast}
            />
          )}

          {view === "driver-reports" && (
            <DriverReportsView
              driver={activeDriver}
              stops={stops}
              reports={driverReports}
              onSubmitReport={handleDriverSubmitReport}
              onToast={pushToast}
            />
          )}

          {view === "driver-notifications" && (
            <DriverNotificationsView
              driver={activeDriver}
              notifications={driverNotifications}
              onAcknowledge={handleAcknowledgeNotification}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onSendReplyToAdmin={handleSendReplyToAdmin}
              onToast={pushToast}
            />
          )}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 font-mono text-[10px] text-ink-faint">
            <span>QuantaRoute · Quantum-Inspired PSO</span>
            <span>
              map © OpenStreetMap · routing © OSRM · engine <span className="text-green-deep">QPSO</span>
            </span>
          </footer>
        </main>
      </div>

      <BottomNav
        view={view}
        setView={setView}
        role={role}
        unreadNotificationsCount={unreadNotifCount}
      />

      {pendingStop && (
        <DeliveryModal
          point={pendingStop}
          defaultName={`Customer ${nextStopId.current - 99}`}
          onCancel={cancelNewStop}
          onConfirm={confirmNewStop}
        />
      )}
      <Toast toast={toast} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {addFleetOpen && (
        <AddFleetModal
          existingCount={drivers.length}
          onClose={() => setAddFleetOpen(false)}
          onAdd={handleAddNewFleet}
        />
      )}

      {profileOpen && (
        <ProfileModal
          role={role}
          driver={activeDriver}
          onClose={() => setProfileOpen(false)}
          onEditDriverClick={() => {
            setProfileOpen(false);
            setView("fleet-vehicles");
          }}
        />
      )}

      {draftNotifOpen && (
        <DraftNotificationModal
          senderRole={role}
          senderName={
            role === "admin"
              ? "Super Admin"
              : role === "fleetmanager"
                ? "Fleet Operations Manager"
                : activeDriver?.name || "Driver"
          }
          drivers={drivers}
          onClose={() => setDraftNotifOpen(false)}
          onSend={handleSendNotification}
        />
      )}
    </div>
  );
}
