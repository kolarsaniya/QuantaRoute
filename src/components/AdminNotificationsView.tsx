import { useState } from "react";
import {
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Inbox,
  MessageSquare,
  Plus,
  Search,
  Send,
  Truck,
} from "lucide-react";
import type { AppNotification } from "../lib/driverTypes";

interface Props {
  notifications: AppNotification[];
  onDraftClick: () => void;
  onAcknowledge: (id: string) => void;
  onMarkAllRead: () => void;
  onToast: (msg: string, tone?: "traffic" | "accident" | "info") => void;
}

export function AdminNotificationsView({
  notifications,
  onDraftClick,
  onAcknowledge,
  onMarkAllRead,
  onToast,
}: Props) {
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Received: sent by drivers or system to admin / all
  const receivedList = notifications.filter(
    (n) =>
      n.senderRole === "fleetdriver" ||
      (n.senderRole === "system" && n.recipientRole !== "fleetdriver") ||
      n.recipientRole === "admin" ||
      n.recipientRole === "all",
  );

  // Sent: sent by admin
  const sentList = notifications.filter((n) => n.senderRole === "admin");

  const currentList = activeTab === "received" ? receivedList : sentList;

  const filtered = currentList.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase()) ||
      n.senderName.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === "all" || n.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const unreadReceivedCount = receivedList.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green/15 text-green-deep font-bold">
              <Inbox size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                  Dispatch Communications & Notifications
                </h2>
                {unreadReceivedCount > 0 && (
                  <span className="rounded-full bg-red px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                    {unreadReceivedCount} new
                  </span>
                )}
              </div>
              <p className="text-[12px] text-ink-soft mt-0.5">
                Admin Console · Field reports, driver updates & outgoing fleet broadcasts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 py-2 text-[12px] font-bold text-ink hover:bg-card hover:border-ink transition"
            >
              <CheckCheck size={14} className="text-green" /> Mark all read
            </button>

            <button
              onClick={onDraftClick}
              className="flex items-center gap-2 rounded-xl bg-green px-4 py-2 text-[12px] font-bold text-white shadow-[0_3px_0_#0c7a37] hover:bg-green-deep active:translate-y-0.5 transition"
            >
              <Plus size={16} /> Draft Notification
            </button>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
          <div className="flex items-center gap-1 rounded-xl bg-paper p-1 border border-line">
            <button
              onClick={() => setActiveTab("received")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${
                activeTab === "received"
                  ? "bg-card text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Inbox size={14} /> Received from Drivers ({receivedList.length})
              {unreadReceivedCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-red" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("sent")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${
                activeTab === "sent"
                  ? "bg-card text-ink shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Send size={13} /> Sent Broadcasts ({sentList.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search driver, text..."
                className="w-full rounded-xl border border-line bg-paper py-1.5 pl-8 pr-3 text-[12px] text-ink placeholder:text-ink-faint focus:border-green focus:outline-none"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-line bg-paper py-1.5 px-3 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="route_update">Route Updates</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-12 text-center text-ink-faint text-[13px]">
            No notifications in this view.
          </div>
        ) : (
          filtered.map((n) => {
            const isDriverSender = n.senderRole === "fleetdriver";
            const isUrgent = n.priority === "urgent";
            const isIncident = n.type === "incident_report";

            return (
              <div
                key={n.id}
                className={`rounded-2xl border p-4 transition-all shadow-[0_2px_0_rgba(11,15,14,0.05)] ${
                  !n.read && activeTab === "received"
                    ? "bg-card border-green/60 ring-1 ring-green/30"
                    : "bg-card/80 border-line"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                        isUrgent
                          ? "bg-red text-white"
                          : n.priority === "route_update"
                            ? "bg-green text-white"
                            : n.priority === "maintenance"
                              ? "bg-amber text-night"
                              : "bg-paper text-ink-faint border border-line"
                      }`}
                    >
                      {n.priority}
                    </span>

                    <span className="font-display text-[12px] font-bold text-ink">
                      {activeTab === "received" ? (
                        <>
                          From: <span className="text-green-deep">{n.senderName}</span>
                        </>
                      ) : (
                        <>
                          To: <span className="text-ink">{n.recipientName || "All Drivers"}</span>
                        </>
                      )}
                    </span>

                    {isIncident && (
                      <span className="rounded bg-red/10 px-2 py-0.5 font-mono text-[9px] font-bold text-red border border-red/20">
                        Field Incident
                      </span>
                    )}
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
                  <div className="flex items-center gap-2 font-mono text-[11px] text-ink-faint">
                    {isDriverSender && (
                      <span className="flex items-center gap-1 text-ink-soft">
                        <Truck size={12} className="text-green" /> Driver Notification
                      </span>
                    )}
                    {n.acknowledged && (
                      <span className="flex items-center gap-1 text-green-deep font-bold">
                        <CheckCircle2 size={13} /> Acknowledged
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === "received" && !n.acknowledged && (
                      <button
                        onClick={() => onAcknowledge(n.id)}
                        className="flex items-center gap-1 rounded-xl bg-green px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-green-deep transition"
                      >
                        <Check size={13} /> Acknowledge
                      </button>
                    )}
                    <button
                      onClick={onDraftClick}
                      className="flex items-center gap-1 rounded-xl border border-line bg-paper px-3 py-1.5 text-[11px] font-bold text-ink hover:bg-card hover:border-ink transition"
                    >
                      <MessageSquare size={13} /> Reply
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
