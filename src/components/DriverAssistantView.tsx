import { useState, useRef, useEffect, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BatteryCharging,
  Bot,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Fuel,
  Gauge,
  MapPin,
  MessageSquare,
  Mic,
  Navigation,
  Phone,
  Radio,
  Send,
  Sparkles,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { MapView } from "./MapView";
import type { DriverNotification, DriverProfile } from "../lib/driverTypes";
import type { Incident, Stop, VehicleRoute } from "../lib/types";

interface Props {
  driver: DriverProfile;
  stops: Stop[];
  route?: VehicleRoute;
  incidents: Incident[];
  notifications: DriverNotification[];
  onNavigateTab: (tab: any) => void;
  onReportIncident: (type: any, note?: string) => void;
  onAcknowledgeNotification: (id: string) => void;
  onToast: (msg: string, tone?: "traffic" | "accident" | "info") => void;
  onDraftClick?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "assistant" | "driver";
  text: string;
  time: string;
  action?: { label: string; onClick: () => void };
}

export function DriverAssistantView({
  driver,
  stops,
  route,
  incidents,
  notifications,
  onNavigateTab,
  onReportIncident,
  onAcknowledgeNotification,
  onToast,
  onDraftClick,
}: Props) {
  // Driver's assigned stops
  const assignedStopIds = route?.stopIds ?? [1, 2, 6];
  const assignedStops = assignedStopIds
    .map((id) => stops.find((s) => s.id === id))
    .filter((s): s is Stop => Boolean(s));

  // Driver map route isolation: strictly only his vehicle's route and stops, never other trucks
  const driverOnlyRoutes = useMemo(() => (route ? [route] : []), [route]);
  const driverOnlyStops = useMemo(
    () => stops.filter((s) => assignedStopIds.includes(s.id)),
    [stops, assignedStopIds],
  );
  const driverStopMarkers = useMemo(() => {
    const res: Record<number, { color: string; label: string }> = {};
    driverOnlyStops.forEach((s, idx) => {
      res[s.id] = { color: route?.color || "#15803d", label: String(idx + 1) };
    });
    return res;
  }, [driverOnlyStops, route]);

  // Current next stop
  const [completedStopIds, setCompletedStopIds] = useState<number[]>([]);
  const remainingStops = assignedStops.filter((s) => !completedStopIds.includes(s.id));
  const nextStop = remainingStops[0] ?? assignedStops[0] ?? {
    id: 1,
    name: "Indiranagar",
    lat: 12.9784,
    lng: 77.6408,
    demand: 4,
  };

  // Chat conversation with AI Copilot
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-0",
      sender: "assistant",
      text: `Good day, ${driver.name}! I'm your QuantaRoute In-Cab Copilot. I'm actively monitoring your route (#${driver.vehicleNumber} ${driver.vehicleModel}), live Bangalore traffic, and power level. Tap a quick question below or ask me anything!`,
      time: "Just now",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Urgent notifications from admin/system
  const urgentNotif = notifications.find((n) => !n.acknowledged && (n.priority === "urgent" || n.priority === "route_update"));

  const handleSendPrompt = (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "driver",
      text,
      time: now,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");

    // Generate intelligent assistant response
    setTimeout(() => {
      const q = text.toLowerCase();
      let reply = "";
      let action: { label: string; onClick: () => void } | undefined = undefined;

      if (q.includes("next") || q.includes("stop") || q.includes("where")) {
        if (remainingStops.length > 0) {
          reply = `Your next scheduled stop is ${nextStop.name} (Stop #${nextStop.id}). You have ${nextStop.demand} package units to deliver. Estimated arrival is in 8 minutes under current traffic.`;
          action = {
            label: "Open Navigation",
            onClick: () => handleStartNavigation(nextStop),
          };
        } else {
          reply = `Great job! You have completed all scheduled deliveries for today's manifest. You can head back to the Central Hub depot.`;
        }
      } else if (q.includes("traffic") || q.includes("delay") || q.includes("jam")) {
        if (incidents.length > 0) {
          const inc = incidents[0];
          reply = `Caution: Active ${inc.kind} reported near ${stops.find((s) => s.id === Math.round(inc.id % stops.length))?.name || "Majestic"}. QuantaRoute has pre-computed a detour via Cubbon Rd saving 12 minutes!`;
          action = {
            label: "View Wait vs Reroute",
            onClick: () => onNavigateTab("compare"),
          };
        } else {
          reply = `Traffic is currently running smooth across your corridor with free-flow speeds of 38-42 km/h. No major delays reported.`;
        }
      } else if (q.includes("battery") || q.includes("fuel") || q.includes("charge") || q.includes("range")) {
        const pct = driver.batteryOrFuelLevel;
        const estRange = Math.round(pct * 1.4);
        reply = `Your ${driver.vehicleModel} battery is at ${pct}%. Estimated remaining range is ~${estRange} km, which is sufficient for your remaining ${remainingStops.length} stops (${Math.round(remainingStops.length * 5.2)} km).`;
      } else if (q.includes("charger") || q.includes("station") || q.includes("charging")) {
        reply = `Nearest Fast-Charging Station: BESCOM Fast EV Hub, Koramangala (2.4 km away). Charging bay #3 has been pre-reserved for you from 01:15 PM.`;
      } else if (q.includes("dispatch") || q.includes("admin") || q.includes("manager") || q.includes("call")) {
        reply = `Fleet Manager Suresh Murthy is on active duty. Contact dispatch at +91 80 4455 6677 or tap below to send an instant message.`;
        action = {
          label: "View Admin Messages",
          onClick: () => onNavigateTab("driver-notifications"),
        };
      } else if (q.includes("report")) {
        reply = `Opening instant incident reporting portal. You can report traffic congestion, mechanical issues, or customer unavailability.`;
        action = {
          label: "Open Report Portal",
          onClick: () => onNavigateTab("driver-reports"),
        };
      } else {
        reply = `Understood. I have logged that into your vehicle logbook. I am keeping your route optimized in real-time. Let me know if you need route adjustments or dispatch assistance.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "assistant",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action,
        },
      ]);
    }, 450);
  };

  const handleStartNavigation = (stop: Stop) => {
    onToast(`GPS Turn-by-Turn started for ${stop.name}`, "info");
    // Open Google Maps navigation in new tab if requested
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMarkDelivered = (stopId: number) => {
    setCompletedStopIds((prev) => [...prev, stopId]);
    onToast(`Stop #${stopId} marked DELIVERED! Proof of delivery synced with Fleet Manager.`, "info");
  };

  const quickChips = [
    "What's my next stop?",
    "Check traffic on my route",
    "Battery level & range",
    "Find nearest EV fast charger",
    "Contact Fleet Dispatch",
  ];

  return (
    <div className="space-y-4">
      {/* Top Driver HUD Banner */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green text-white font-bold font-mono text-lg shadow-md">
              {driver.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                  {driver.name}
                </h2>
                <span className="rounded-full bg-green/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-green-deep border border-green/30">
                  Driver Active
                </span>
              </div>
              <p className="text-[12px] text-ink-soft">
                Vehicle #{driver.vehicleNumber} · {driver.vehicleModel} ·{" "}
                <span className="font-mono font-semibold text-ink">{driver.plate}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2">
              <BatteryCharging size={18} className="text-green" />
              <div className="leading-tight">
                <span className="text-[10px] font-bold uppercase text-ink-faint">Battery</span>
                <p className="font-mono text-[13px] font-bold text-ink">{driver.batteryOrFuelLevel}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2">
              <Gauge size={18} className="text-amber" />
              <div className="leading-tight">
                <span className="text-[10px] font-bold uppercase text-ink-faint">Est. Range</span>
                <p className="font-mono text-[13px] font-bold text-ink">
                  {Math.round(driver.batteryOrFuelLevel * 1.4)} km
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2">
              <CheckCircle2 size={18} className="text-green" />
              <div className="leading-tight">
                <span className="text-[10px] font-bold uppercase text-ink-faint">Remaining</span>
                <p className="font-mono text-[13px] font-bold text-ink">
                  {remainingStops.length} stops
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Admin Dispatch Alert Banner */}
        {urgentNotif && (
          <div className="mt-4 anim-pop flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber/40 bg-amber/10 p-3.5">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={20} className="text-amber shrink-0 animate-pulse" />
              <div>
                <p className="font-display text-[13px] font-bold text-ink">
                  Broadcast from {urgentNotif.sender}: {urgentNotif.title}
                </p>
                <p className="text-[12px] text-ink-soft">{urgentNotif.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAcknowledgeNotification(urgentNotif.id)}
                className="rounded-lg bg-amber px-3 py-1.5 text-[11px] font-bold text-night shadow-sm hover:bg-amber/90 transition"
              >
                Acknowledge Alert
              </button>
              <button
                onClick={() => onNavigateTab("driver-notifications")}
                className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-[11px] font-bold text-ink hover:bg-paper transition"
              >
                View Inbox
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Priority Next Stop HUD + In-Cab Copilot Chat */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Next Stop HUD Card (Left 5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border-2 border-green/50 bg-card p-5 shadow-[0_4px_0_rgba(21,128,61,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green px-3 py-1 rounded-bl-xl font-mono text-[10px] font-bold text-white uppercase tracking-wider">
              Next Delivery
            </div>

            <div className="flex items-center gap-2 text-green font-bold text-[12px] uppercase tracking-wider mb-2">
              <Navigation size={14} className="animate-bounce" /> Current Waypoint
            </div>

            <h3 className="font-display text-2xl font-bold text-ink">
              {nextStop.name}
            </h3>
            <p className="text-[13px] text-ink-soft mt-0.5">
              Bangalore Urban Delivery Hub · Destination #{nextStop.id}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-line bg-paper/80 p-3">
                <span className="text-[10px] font-bold uppercase text-ink-faint block">Package Load</span>
                <span className="font-mono text-lg font-bold text-ink mt-0.5 block">
                  {nextStop.demand} Units
                </span>
                <span className="text-[10px] text-ink-soft">Fragile / Express</span>
              </div>

              <div className="rounded-xl border border-line bg-paper/80 p-3">
                <span className="text-[10px] font-bold uppercase text-ink-faint block">Estimated Arrival</span>
                <span className="font-mono text-lg font-bold text-green-deep mt-0.5 block">
                  ~8 mins
                </span>
                <span className="text-[10px] text-ink-soft">4.2 km via Ring Rd</span>
              </div>
            </div>

            {/* In-Cab Action Buttons */}
            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => handleStartNavigation(nextStop)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-green py-3 text-[14px] font-bold text-white shadow-[0_4px_0_#0c7a37] hover:bg-green-deep active:translate-y-0.5 transition"
              >
                <Navigation size={18} /> Start GPS Navigation
                <ExternalLink size={14} className="opacity-75" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${driver.phone}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-paper py-2.5 text-[12px] font-bold text-ink hover:bg-card hover:border-ink transition text-center"
                >
                  <Phone size={14} className="text-green" /> Call Customer
                </a>

                <button
                  onClick={() => handleMarkDelivered(nextStop.id)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-green/40 bg-green/10 py-2.5 text-[12px] font-bold text-green-deep hover:bg-green/20 transition"
                >
                  <CheckCircle2 size={14} /> Delivered
                </button>
              </div>

              <button
                onClick={() => onNavigateTab("driver-reports")}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red/30 bg-red/5 py-2 text-[12px] font-bold text-red hover:bg-red/10 transition"
              >
                <AlertTriangle size={14} /> Report Road Incident / Issue
              </button>
            </div>
          </div>

          {/* Quick Incident Reporting Triggers */}
          <div className="rounded-2xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
            <h4 className="font-display text-[13px] font-bold text-ink mb-3 flex items-center gap-1.5">
              <Radio size={15} className="text-green" /> Quick Field Reports
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <button
                onClick={() => onReportIncident("traffic", "Heavy congestion near next stop")}
                className="flex items-center gap-2 rounded-xl border border-line bg-paper p-2.5 text-left font-semibold text-ink hover:border-amber hover:bg-amber/10 transition"
              >
                <span className="h-2 w-2 rounded-full bg-amber shrink-0" />
                <span>Heavy Traffic Jam</span>
              </button>

              <button
                onClick={() => onReportIncident("breakdown", "Flat tire or mechanical failure")}
                className="flex items-center gap-2 rounded-xl border border-line bg-paper p-2.5 text-left font-semibold text-ink hover:border-red hover:bg-red/10 transition"
              >
                <span className="h-2 w-2 rounded-full bg-red shrink-0" />
                <span>Vehicle Breakdown</span>
              </button>

              <button
                onClick={() => onReportIncident("roadblock", "Road closed / flooded")}
                className="flex items-center gap-2 rounded-xl border border-line bg-paper p-2.5 text-left font-semibold text-ink hover:border-night hover:bg-card transition"
              >
                <span className="h-2 w-2 rounded-full bg-night shrink-0" />
                <span>Road Blocked</span>
              </button>

              <button
                onClick={() => onReportIncident("customer_unavailable", "Customer phone not reachable")}
                className="flex items-center gap-2 rounded-xl border border-line bg-paper p-2.5 text-left font-semibold text-ink hover:border-blue-500 hover:bg-blue-500/10 transition"
              >
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span>Customer Absent</span>
              </button>
            </div>
          </div>

          {/* Driver Isolated Route Map: shows strictly only his route, not other trucks */}
          <div className="relative isolate z-0 h-[260px] overflow-hidden rounded-2xl border border-line shadow-[0_2px_0_rgba(11,15,14,0.05)]">
            <MapView
              stops={driverOnlyStops}
              stopMarkers={driverStopMarkers}
              incidents={incidents}
              routes={driverOnlyRoutes}
              altRoutes={undefined}
              addMode={false}
              onAddStop={() => {}}
            />
            {/* Map Isolation Indicator Badge */}
            <div className="absolute top-3 left-3 z-[500] flex items-center gap-2 rounded-lg border border-line/80 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow-md backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-green qr-blink" />
              <span>In-Cab GPS Map</span>
              <span className="font-mono text-[10px] text-green-deep">
                (Truck #{driver.vehicleNumber} Route Only)
              </span>
            </div>
          </div>
        </div>

        {/* In-Cab AI Assistant Copilot (Right 7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-line bg-card shadow-[0_2px_0_rgba(11,15,14,0.05)] overflow-hidden min-h-[480px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-line bg-card-soft px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green text-white shadow-sm">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold text-ink">In-Cab AI Assistant</h3>
                  <span className="flex items-center gap-1 rounded bg-green/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-green-deep">
                    <Sparkles size={10} /> Online
                  </span>
                </div>
                <p className="text-[11px] text-ink-faint">Hands-free co-pilot for route & delivery</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onDraftClick && (
                <button
                  onClick={onDraftClick}
                  className="flex items-center gap-1 rounded-lg bg-green/15 px-2.5 py-1 text-[11px] font-bold text-green-deep hover:bg-green/25 transition"
                >
                  <Send size={11} /> Message Dispatch
                </button>
              )}
              <button
                onClick={() => onNavigateTab("driver-notifications")}
                className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1 text-[11px] font-bold text-ink-soft hover:text-ink transition"
              >
                <MessageSquare size={12} /> Inbox ({notifications.filter((n) => !n.read).length})
              </button>
            </div>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[360px] sm:max-h-[420px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "driver" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-[13px] leading-relaxed shadow-sm ${
                    m.sender === "driver"
                      ? "bg-green text-white font-medium rounded-tr-none"
                      : "bg-paper border border-line text-ink rounded-tl-none"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.action && (
                    <button
                      onClick={m.action.onClick}
                      className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 font-mono text-[11px] font-bold text-green-deep shadow-sm hover:bg-white transition"
                    >
                      {m.action.label} <ChevronRight size={13} />
                    </button>
                  )}
                </div>
                <span className="mt-1 font-mono text-[10px] text-ink-faint px-1">
                  {m.time}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Preset Quick Chips */}
          <div className="border-t border-line/60 bg-paper/40 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint px-1 mb-1.5">
              Quick Driver Queries:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(chip)}
                  className="rounded-full border border-line bg-card px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:border-green hover:text-green-deep hover:bg-green/5 transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar */}
          <div className="border-t border-line bg-card p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(inputVal);
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => {
                  onToast("Voice listening... 'Say: What is my next stop?'", "info");
                  handleSendPrompt("What's my next stop?");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-paper text-ink-soft hover:text-green hover:border-green transition shrink-0"
                title="Voice Query"
              >
                <Mic size={18} />
              </button>

              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask assistant about stops, traffic, or battery..."
                className="flex-1 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:border-green focus:outline-none"
              />

              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-green text-white shadow-[0_2px_0_#0c7a37] hover:bg-green-deep disabled:opacity-40 transition shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
