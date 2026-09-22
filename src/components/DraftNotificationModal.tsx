import { useState } from "react";
import { Bell, Send, Sparkles, X } from "lucide-react";
import type { AppNotification, DriverProfile } from "../lib/driverTypes";
import type { UserRole } from "./TopBar";

interface Props {
  senderRole: UserRole;
  senderName: string;
  drivers: DriverProfile[];
  onClose: () => void;
  onSend: (notif: AppNotification) => void;
}

export function DraftNotificationModal({
  senderRole,
  senderName,
  drivers,
  onClose,
  onSend,
}: Props) {
  const [recipient, setRecipient] = useState<string>(
    senderRole === "fleetdriver" ? "admin" : "all_drivers",
  );
  const [priority, setPriority] = useState<AppNotification["priority"]>("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const quickTemplates =
    senderRole === "fleetdriver"
      ? [
          { title: "Traffic Delay", msg: "Encountering heavy congestion. Estimated delay: 15 mins." },
          { title: "Delivery Completed", msg: "Package handed over and recipient signature recorded." },
          { title: "Customer Not Available", msg: "Customer phone is unreachable. Waiting at gate." },
          { title: "Vehicle Check", msg: "EV battery level low. Heading to nearest charging station." },
        ]
      : [
          { title: "Priority Dispatch", msg: "High priority order scheduled. Please prioritize next delivery." },
          { title: "Quantum Reroute Active", msg: "Road congestion detected ahead. Please follow in-cab detour." },
          { title: "Charging Slot Reserved", msg: "Fast charging bay reserved for your vehicle at Depot Hub." },
          { title: "End of Shift Reminder", msg: "Please return vehicle to central depot by 06:00 PM." },
        ];

  const handleApplyTemplate = (t: { title: string; msg: string }) => {
    setTitle(t.title);
    setMessage(t.msg);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    let recRole: AppNotification["recipientRole"] = "all";
    let recId: string | undefined = undefined;
    let recName: string = "All Drivers";

    if (recipient === "admin") {
      recRole = "admin";
      recName = "Admin Console";
    } else if (recipient === "fleetmanager") {
      recRole = "fleetmanager";
      recName = "Fleet Operations Manager";
    } else if (recipient === "all_drivers") {
      recRole = "all";
      recName = "All Fleet Drivers";
    } else {
      recRole = "fleetdriver";
      recId = recipient;
      const targetDriver = drivers.find((d) => d.id === recipient);
      recName = targetDriver ? `${targetDriver.name} (Truck #${targetDriver.vehicleNumber})` : "Driver";
    }

    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      senderRole,
      senderName,
      recipientRole: recRole,
      recipientId: recId,
      recipientName: recName,
      title: title.trim(),
      message: message.trim(),
      timestamp: "Just now",
      priority,
      read: false,
      acknowledged: false,
      type: "notification",
    };

    onSend(newNotif);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-night/80 p-0 sm:p-4 backdrop-blur-sm">
      <div className="anim-up w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-2xl border border-line bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-card-soft px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green text-white shadow-sm">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">Draft Dispatch Notification</h3>
              <p className="text-[11px] text-ink-soft">
                Sending as <span className="font-semibold text-ink">{senderName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint hover:bg-paper hover:text-ink transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Recipient */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
              Select Recipient *
            </label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper py-2.5 px-3 text-[13px] font-semibold text-ink focus:border-green focus:outline-none"
            >
              {senderRole !== "fleetdriver" && (
                <>
                  <option value="all_drivers">Broadcast to All Fleet Drivers</option>
                  <option value="fleetmanager">Fleet Operations Manager</option>
                  <optgroup label="Individual Drivers">
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · Truck #{d.vehicleNumber} ({d.plate})
                      </option>
                    ))}
                  </optgroup>
                </>
              )}

              {senderRole === "fleetdriver" && (
                <>
                  <option value="admin">Admin Dispatch Console</option>
                  <option value="fleetmanager">Fleet Operations Manager</option>
                </>
              )}

              {senderRole === "fleetmanager" && (
                <option value="admin">Admin Control Center</option>
              )}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2 text-[11px] font-bold">
              {[
                { id: "general", label: "General", color: "bg-paper text-ink-soft border-line" },
                { id: "route_update", label: "Route", color: "bg-green/15 text-green-deep border-green/30" },
                { id: "maintenance", label: "Maintenance", color: "bg-amber/15 text-amber border-amber/30" },
                { id: "urgent", label: "Urgent", color: "bg-red/15 text-red border-red/30" },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id as any)}
                  className={`rounded-xl border py-2 text-center transition ${
                    priority === p.id
                      ? `${p.color} ring-2 ring-ink/20 shadow-sm font-extrabold`
                      : "border-line bg-paper/50 text-ink-faint hover:bg-paper"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fast Templates */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1 mb-1.5">
              <Sparkles size={11} className="text-green" /> 1-Tap Fast Templates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((t, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyTemplate(t)}
                  className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:border-green hover:text-green-deep transition"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Subject / Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
              Title / Subject *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Priority Delivery Notice or Traffic Alert"
              required
              className="w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink placeholder:text-ink-faint focus:border-green focus:outline-none"
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
              Message Content *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type dispatch instructions, road alerts, or status update..."
              required
              rows={3}
              className="w-full rounded-xl border border-line bg-paper p-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-green focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-paper px-4 py-2.5 text-[12px] font-semibold text-ink-soft hover:bg-card hover:text-ink transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !message.trim()}
              className="flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-[12px] font-bold text-white shadow-[0_3px_0_#0c7a37] hover:bg-green-deep disabled:opacity-40 transition active:translate-y-0.5"
            >
              <Send size={15} /> Send Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
