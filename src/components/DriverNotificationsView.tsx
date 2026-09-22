import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
} from "lucide-react";
import type { DriverNotification, DriverProfile } from "../lib/driverTypes";

interface Props {
  driver: DriverProfile;
  notifications: DriverNotification[];
  onAcknowledge: (id: string) => void;
  onMarkAllRead: () => void;
  onSendReplyToAdmin: (text: string) => void;
  onToast: (msg: string, tone?: "traffic" | "accident" | "info") => void;
}

export function DriverNotificationsView({
  driver,
  notifications,
  onAcknowledge,
  onMarkAllRead,
  onSendReplyToAdmin,
  onToast,
}: Props) {
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");
  const [customReply, setCustomReply] = useState("");

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "urgent") return n.priority === "urgent" || n.priority === "route_update";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const quickReplies = [
    "Understood, on it!",
    "Arriving in 10 minutes",
    "Stuck in traffic near Indiranagar",
    "Delivery completed successfully",
  ];

  const handleSendQuickReply = (text: string) => {
    onSendReplyToAdmin(text);
    onToast(`Reply sent to Admin & Fleet Manager: "${text}"`, "info");
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green/15 text-green-deep font-bold">
              <Bell size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                  Notifications & Dispatch Inbox
                </h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[12px] text-ink-soft mt-0.5">
                Driver: {driver.name} (Vehicle #{driver.vehicleNumber}) · Direct communications from Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 py-2 text-[12px] font-bold text-ink hover:bg-card hover:border-ink transition"
          >
            <CheckCheck size={14} className="text-green" /> Mark all as read
          </button>
        </div>

        {/* Filter Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
              filter === "all"
                ? "bg-ink text-white"
                : "bg-paper text-ink-soft border border-line hover:bg-card"
            }`}
          >
            All Messages ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
              filter === "unread"
                ? "bg-ink text-white"
                : "bg-paper text-ink-soft border border-line hover:bg-card"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("urgent")}
            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
              filter === "urgent"
                ? "bg-ink text-white"
                : "bg-paper text-ink-soft border border-line hover:bg-card"
            }`}
          >
            Urgent & Route Updates
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Notifications Stream (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card p-12 text-center text-ink-faint text-[13px]">
              No notifications in this filter view.
            </div>
          ) : (
            filtered.map((n) => {
              const isUrgent = n.priority === "urgent";
              const isRoute = n.priority === "route_update";
              const isMaint = n.priority === "maintenance";

              return (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-4 transition-all shadow-[0_2px_0_rgba(11,15,14,0.05)] ${
                    !n.read
                      ? "bg-card border-green/50 ring-1 ring-green/30"
                      : "bg-card/80 border-line"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                          isUrgent
                            ? "bg-red text-white"
                            : isRoute
                              ? "bg-green text-white"
                              : isMaint
                                ? "bg-amber text-night"
                                : "bg-paper text-ink-faint border border-line"
                        }`}
                      >
                        {n.priority}
                      </span>
                      <span className="font-display text-[12px] font-bold text-ink-soft">
                        From: {n.senderName || "Dispatch"}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-ink-faint flex items-center gap-1">
                      <Clock size={11} /> {n.timestamp}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-ink mt-2">
                    {n.title}
                  </h3>

                  <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
                      {n.acknowledged ? (
                        <span className="flex items-center gap-1 text-green-deep font-bold">
                          <CheckCircle2 size={13} /> Acknowledged by Driver
                        </span>
                      ) : (
                        <span className="text-amber font-semibold">
                          Acknowledgement Requested
                        </span>
                      )}
                    </div>

                    {!n.acknowledged && (
                      <button
                        onClick={() => onAcknowledge(n.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-green px-3.5 py-1.5 text-[12px] font-bold text-white shadow-sm hover:bg-green-deep transition active:translate-y-0.5"
                      >
                        <Check size={14} /> Confirm & Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Driver Response to Admin Dispatch (Right 4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-line bg-card p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)] space-y-4 h-fit">
          <div className="border-b border-line/60 pb-3">
            <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
              <MessageSquare size={16} className="text-green" /> Quick Reply to Admin
            </h3>
            <p className="text-[11px] text-ink-faint mt-0.5">
              Send instant one-tap status updates directly to the Fleet Operations console.
            </p>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2">
              1-Tap Fast Responses:
            </span>
            <div className="space-y-2">
              {quickReplies.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSendQuickReply(r)}
                  className="w-full rounded-xl border border-line bg-paper p-2.5 text-left text-[12px] font-semibold text-ink hover:border-green hover:bg-green/5 transition"
                >
                  "{r}"
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customReply.trim()) {
                handleSendQuickReply(customReply);
                setCustomReply("");
              }
            }}
            className="pt-2 border-t border-line/60 space-y-2"
          >
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Custom Status Message
            </label>
            <textarea
              value={customReply}
              onChange={(e) => setCustomReply(e.target.value)}
              placeholder="e.g. Waiting at customer gate, will be clear in 5 mins..."
              rows={3}
              className="w-full rounded-xl border border-line bg-paper p-2.5 text-[12px] text-ink placeholder:text-ink-faint focus:border-green focus:outline-none"
            />
            <button
              type="submit"
              disabled={!customReply.trim()}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-ink py-2 text-[12px] font-bold text-white shadow-sm hover:bg-black disabled:opacity-40 transition"
            >
              <Send size={14} /> Send to Admin Console
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
