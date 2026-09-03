import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { Incident, LatLng, Stop, VehicleRoute } from "../lib/types";
import { DEPOT, haversineKm } from "../lib/network";

interface StopMarker {
  color: string;
  label: string;
}

interface Props {
  stops: Stop[];
  stopMarkers: Record<number, StopMarker>;
  incidents: Incident[];
  routes: VehicleRoute[];
  addMode: boolean;
  onAddStop: (lat: number, lng: number) => void;
  /** vehicleId → progress along its own route (0 = at depot) */
  trackProgress?: Record<number, number>;
}

const truckIcon = (color: string, label: string) =>
  L.divIcon({
    className: "qr-divicon",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;border-radius:8px;background:${color};border:2.5px solid #fff;box-shadow:0 3px 8px rgba(11,15,14,0.4);display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:9px;color:#fff">T${label}</div>`,
  });

function pointAlong(pts: LatLng[], t: number): LatLng {
  if (pts.length === 0) return { lat: 0, lng: 0 };
  if (pts.length === 1) return pts[0];
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = haversineKm(pts[i], pts[i + 1]);
    segs.push(d);
    total += d;
  }
  let target = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] === 0 ? 0 : Math.min(1, target / segs[i]);
      return {
        lat: pts[i].lat + (pts[i + 1].lat - pts[i].lat) * f,
        lng: pts[i].lng + (pts[i + 1].lng - pts[i].lng) * f,
      };
    }
    target -= segs[i];
  }
  return pts[pts.length - 1];
}

const bubbleIcon = (label: string, color: string) =>
  L.divIcon({
    className: "qr-divicon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${color};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px;color:#fff;box-shadow:0 2px 8px rgba(11,15,14,0.35)">${label}</div>`,
  });

const neutralIcon = (label: string) =>
  L.divIcon({
    className: "qr-divicon",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;border-radius:9999px;background:#fff;border:2.5px solid #0b0f0e;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:11px;color:#0b0f0e;box-shadow:0 2px 6px rgba(11,15,14,0.2)">${label}</div>`,
  });

const depotIcon = L.divIcon({
  className: "qr-divicon",
  iconSize: [56, 64],
  iconAnchor: [28, 58],
  html: `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
    <div style="background:#16a34a;color:#fff;font-family:'Instrument Sans',sans-serif;font-weight:700;font-size:12px;padding:4px 12px;border-radius:9999px;box-shadow:0 3px 8px rgba(22,163,74,0.4)">Start</div>
    <div style="width:16px;height:16px;border-radius:9999px;background:#16a34a;border:3px solid #fff;box-shadow:0 2px 6px rgba(11,15,14,0.3)"></div>
  </div>`,
});

const arrowIcon = (color: string, rot: number) =>
  L.divIcon({
    className: "qr-divicon",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="transform:rotate(${rot}deg)"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 3 L12 7 L2 11 L4.5 7 Z" fill="${color}" stroke="#fff" stroke-width="1"/></svg></div>`,
  });

const incidentIcon = (kind: "traffic" | "accident") => {
  const color = kind === "traffic" ? "#f5a524" : "#e5484d";
  const glyph =
    kind === "traffic"
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0b0f0e" stroke-width="2.6" stroke-linecap="round"><path d="M5 20h14M7 16l3-8 2 5 2-3 3 6"/></svg>`
      : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>`;
  return L.divIcon({
    className: "qr-divicon",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="position:relative;width:26px;height:26px">
      <div class="qr-pulse" style="background:${color}"></div>
      <div style="position:relative;width:26px;height:26px;border-radius:9999px;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(11,15,14,0.3)">${glyph}</div>
    </div>`,
  });
};

const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const SAT_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export function MapView({ stops, stopMarkers, incidents, routes, addMode, onAddStop, trackProgress }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routesLayer = useRef<L.LayerGroup | null>(null);
  const incidentLayer = useRef<L.LayerGroup | null>(null);
  const stopsLayer = useRef<L.LayerGroup | null>(null);
  const trackLayer = useRef<L.LayerGroup | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const [tileMode, setTileMode] = useState<"map" | "satellite">("map");
  const addCb = useRef(onAddStop);
  addCb.current = onAddStop;
  const addModeRef = useRef(addMode);
  addModeRef.current = addMode;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [DEPOT.lat, DEPOT.lng], zoom: 12 });
    tileRef.current = L.tileLayer(OSM_URL, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    routesLayer.current = L.layerGroup().addTo(map);
    incidentLayer.current = L.layerGroup().addTo(map);
    stopsLayer.current = L.layerGroup().addTo(map);
    trackLayer.current = L.layerGroup().addTo(map);

    L.marker([DEPOT.lat, DEPOT.lng], { icon: depotIcon, zIndexOffset: 500 }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (addModeRef.current) addCb.current(e.latlng.lat, e.latlng.lng);
    });

    const all: [number, number][] = [[DEPOT.lat, DEPOT.lng], ...stops.map((s) => [s.lat, s.lng] as [number, number])];
    map.fitBounds(L.latLngBounds(all).pad(0.12));

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    mapRef.current = map;
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tile toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileRef.current) return;
    map.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(tileMode === "map" ? OSM_URL : SAT_URL, {
      maxZoom: 19,
      attribution:
        tileMode === "map"
          ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          : "Imagery © Esri",
    }).addTo(map);
    tileRef.current.bringToBack();
  }, [tileMode]);

  // add-mode cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.toggle("qr-addmode", addMode);
  }, [addMode]);

  // stop markers
  useEffect(() => {
    const layer = stopsLayer.current;
    if (!layer) return;
    layer.clearLayers();
    stops.forEach((s, i) => {
      const m = stopMarkers[s.id];
      const icon = m ? bubbleIcon(m.label, m.color) : neutralIcon(String(i + 1));
      L.marker([s.lat, s.lng], { icon, zIndexOffset: 600 })
        .addTo(layer)
        .bindTooltip(`${s.name} · ${s.demand} units${m ? ` · Truck ${m.label}` : ""}`, {
          direction: "top",
          offset: [0, -14],
        });
    });
  }, [stops, stopMarkers]);

  // incidents
  useEffect(() => {
    const layer = incidentLayer.current;
    if (!layer) return;
    layer.clearLayers();
    for (const inc of incidents) {
      const color = inc.kind === "traffic" ? "#f5a524" : "#e5484d";
      L.circle([inc.lat, inc.lng], {
        radius: inc.radiusKm * 1000,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.14,
        dashArray: "4 6",
      })
        .addTo(layer)
        .bindTooltip(
          inc.kind === "traffic" ? `Traffic jam · ×${(1 + inc.severity).toFixed(1)} delay` : "Accident · road blocked",
          { direction: "top" },
        );
      L.marker([inc.lat, inc.lng], { icon: incidentIcon(inc.kind), zIndexOffset: 700 }).addTo(layer);
    }
  }, [incidents]);

  // routes + directional arrows
  useEffect(() => {
    const layer = routesLayer.current;
    if (!layer) return;
    layer.clearLayers();
    routes.forEach((r) => {
      const pts: LatLng[] =
        r.geometry ??
        [DEPOT, ...r.stopIds.map((id) => stops.find((s) => s.id === id)).filter((s): s is Stop => !!s), DEPOT];
      if (pts.length < 2) return;
      const latlngs = pts.map((p) => [p.lat, p.lng] as [number, number]);

      L.polyline(latlngs, { color: "#ffffff", weight: 8, opacity: 0.6, interactive: false }).addTo(layer);
      const line = L.polyline(latlngs, {
        color: r.color,
        weight: 4.5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
        className: "qr-route",
      }).addTo(layer);
      line.bindTooltip(`Truck ${r.label} · ${r.timeMin.toFixed(0)} min`, { sticky: true });

      // arrows at spaced samples
      const n = Math.min(9, Math.max(3, Math.floor(r.distanceKm / 2.2)));
      for (let k = 1; k <= n; k++) {
        const t = k / (n + 1);
        const target = t * (pts.length - 1);
        const i0 = Math.floor(target);
        const i1 = Math.min(pts.length - 1, i0 + 1);
        const f = target - i0;
        const lat = pts[i0].lat + (pts[i1].lat - pts[i0].lat) * f;
        const lng = pts[i0].lng + (pts[i1].lng - pts[i0].lng) * f;
        const rot = (-Math.atan2(pts[i1].lat - pts[i0].lat, pts[i1].lng - pts[i0].lng) * 180) / Math.PI;
        L.marker([lat, lng], { icon: arrowIcon(r.color, rot), zIndexOffset: 400, interactive: false }).addTo(layer);
      }
    });
    layer.eachLayer((l) => {
      if (l instanceof L.Polyline && (l.options as L.PolylineOptions).className === "qr-route") l.bringToFront();
    });
  }, [routes, stops]);

  // live-tracking truck markers
  useEffect(() => {
    const layer = trackLayer.current;
    if (!layer) return;
    layer.clearLayers();
    if (trackProgress == null) return;
    routes.forEach((r) => {
      if (r.stopIds.length === 0) return;
      const p = trackProgress[r.vehicleId];
      if (p == null) return;
      const pts: LatLng[] =
        r.geometry ??
        [DEPOT, ...r.stopIds.map((id) => stops.find((s) => s.id === id)).filter((s): s is Stop => !!s), DEPOT];
      if (pts.length < 2) return;
      const pos = pointAlong(pts, p);
      L.marker([pos.lat, pos.lng], { icon: truckIcon(r.color, r.label), zIndexOffset: 900, interactive: false }).addTo(
        layer,
      );
    });
  }, [trackProgress, routes, stops]);

  return (
    <div className="relative h-full w-full isolate overflow-hidden rounded-[inherit]">
      <div ref={containerRef} className="h-full w-full rounded-[inherit] overflow-hidden" />
      {/* tile toggle */}
      <div className="absolute bottom-4 left-4 z-[500] flex overflow-hidden rounded-lg border border-line bg-white shadow-md">
        {(["map", "satellite"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setTileMode(m)}
            className={`px-3.5 py-1.5 text-[12px] font-semibold capitalize transition ${
              tileMode === m ? "bg-ink text-white" : "bg-white text-ink-soft hover:bg-paper"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      {addMode && (
        <div className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-green px-4 py-1.5 text-[12px] font-bold text-white shadow-lg qr-blink">
          Tap the map to drop a delivery stop
        </div>
      )}
    </div>
  );
}
