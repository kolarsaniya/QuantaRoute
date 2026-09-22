import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  LogOut,
  ShieldCheck,
  Sun,
  Sunset,
  Sunrise,
  Truck,
  User,
  UserCheck,
} from "lucide-react";
import logo from "../assets/logo.png";
import type { Incident } from "../lib/types";
import type { DriverProfile } from "../lib/driverTypes";

export type UserRole = "admin" | "fleetmanager" | "fleetdriver";

interface Props {
  incidents: Incident[];
  onHelp: () => void;
  onToast?: (msg: string, tone: "traffic" | "accident" | "info") => void;
  role: UserRole;
  onRoleChange: (r: UserRole) => void;
  activeDriver?: DriverProfile;
  onViewProfile?: () => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
}

const DEFAULT_ROLES: Record<UserRole, { name: string; email: string; badge: string; initials: string }> = {
  admin: {
    name: "Admin",
    email: "admin@quantaroute.com",
    badge: "Super Admin",
    initials: "AD",
  },
  fleetmanager: {
    name: "Fleet Manager",
    email: "fleetmanager@quantaroute.com",
    badge: "Fleet Dispatcher",
    initials: "FM",
  },
  fleetdriver: {
    name: "Rajesh Kumar (Driver)",
    email: "driver.rajesh@quantaroute.com",
    badge: "Vehicle #1 · Tata Ace EV",
    initials: "RK",
  },
};

function greeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return { text: `Good Morning, ${name}!`, icon: Sunrise };
  if (h < 17) return { text: `Good Afternoon, ${name}!`, icon: Sun };
  return { text: `Good Evening, ${name}!`, icon: Sunset };
}

export function TopBar({
  incidents,
  onHelp,
  onToast,
  role,
  onRoleChange,
  activeDriver,
  onViewProfile,
  unreadCount = 0,
  onOpenNotifications,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current =
    role === "fleetdriver" && activeDriver
      ? {
          name: `${activeDriver.name} (Driver)`,
          email: activeDriver.email,
          badge: `Vehicle #${activeDriver.vehicleNumber} · ${activeDriver.vehicleModel}`,
          initials: activeDriver.avatarInitials,
        }
      : DEFAULT_ROLES[role];
  const g = greeting(current.name);
  const GreetIcon = g.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

  const traffic =
    incidents.length === 0
      ? { label: "Smooth", dot: "bg-green-bright", text: "text-green-bright" }
      : incidents.some((i) => i.kind === "accident")
        ? { label: "Blocked", dot: "bg-red", text: "text-red" }
        : { label: "Busy", dot: "bg-amber", text: "text-amber" };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-night-line bg-night select-none">
      <div className="flex w-full items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6">
        {/* brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <img
            src={logo}
            alt="QuantaRoute logo"
            className="h-8 w-8 rounded-xl border border-night-line object-cover sm:h-10 sm:w-10 shrink-0"
          />
          <div className="leading-none">
            <h1 className="font-display text-sm font-bold tracking-wide text-white sm:text-base">
              QUANTA<span className="text-green-bright">ROUTE</span>
            </h1>
            <p className="mt-0.5 text-[10px] font-medium text-white/55 sm:text-[11px]">Smart Route Assistant</p>
          </div>
        </div>

        {/* greeting chip */}
        <div className="ml-2 hidden items-center gap-3 rounded-xl bg-night-soft px-4 py-2 md:flex">
          <GreetIcon size={18} className="text-amber shrink-0" />
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-white">{g.text}</p>
            <p className="text-[11px] text-white/50">Plan smart. Deliver better.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          {/* live traffic */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="leading-tight">
              <p className="text-[11px] font-semibold text-white/70">Live Traffic</p>
              <p className={`flex items-center gap-1.5 text-[12px] font-bold ${traffic.text}`}>
                <span className={`h-2 w-2 rounded-full ${traffic.dot} qr-blink`} /> {traffic.label}
              </p>
            </div>
          </div>

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative flex items-center justify-center rounded-lg p-2 text-white/75 hover:bg-night-soft hover:text-white transition"
              title="Notifications & Dispatches"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 font-mono text-[9px] font-bold text-white shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onHelp}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-white/75 transition hover:bg-night-soft hover:text-white sm:px-2.5 sm:py-2 sm:text-[13px]"
            title="Help & Guide"
          >
            <CircleHelp size={16} /> <span className="hidden sm:inline">Help</span>
          </button>

          {/* User profile menu: Admin, Fleet Manager, Driver, Sign out */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-xl border border-night-line bg-night-soft px-2.5 py-1.5 text-[12px] font-semibold text-white transition hover:border-green sm:gap-2 sm:px-3 sm:py-2 sm:text-[13px]"
              aria-label="User Profile"
              aria-expanded={menuOpen}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green text-[10px] font-bold text-white sm:text-[11px]">
                {current.initials}
              </span>
              <span className="max-w-[90px] truncate sm:max-w-none">{current.name}</span>
              <ChevronDown size={14} className={`shrink-0 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="anim-pop absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-night-line bg-night-soft shadow-2xl z-50">
                <div className="border-b border-night-line px-4 py-3 bg-night/50">
                  <p className="text-[13px] font-bold text-white">{current.name}</p>
                  <p className="truncate font-mono text-[10px] text-white/50">{current.email}</p>
                  <span className="mt-1.5 inline-block rounded bg-green/20 px-2 py-0.5 font-mono text-[9px] font-semibold text-green-bright">
                    {current.badge}
                  </span>
                </div>

                {onViewProfile && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onViewProfile();
                    }}
                    className="flex w-full items-center gap-2 border-b border-night-line px-4 py-2.5 text-left text-[12px] font-bold text-green-bright hover:bg-night transition"
                  >
                    <User size={14} /> View Profile Details
                  </button>
                )}

                <div className="py-1.5">
                  <button
                    onClick={() => {
                      onRoleChange("admin");
                      setMenuOpen(false);
                      onToast?.("Switched profile to Admin", "info");
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[12px] font-medium transition ${
                      role === "admin"
                        ? "bg-green/15 text-green-bright"
                        : "text-white/80 hover:bg-night hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={15} /> Admin
                    </span>
                    {role === "admin" && <Check size={14} className="text-green-bright" />}
                  </button>

                  <button
                    onClick={() => {
                      onRoleChange("fleetmanager");
                      setMenuOpen(false);
                      onToast?.("Switched profile to Fleet Manager", "info");
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[12px] font-medium transition ${
                      role === "fleetmanager"
                        ? "bg-green/15 text-green-bright"
                        : "text-white/80 hover:bg-night hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Truck size={15} /> Fleet Manager
                    </span>
                    {role === "fleetmanager" && <Check size={14} className="text-green-bright" />}
                  </button>

                  <button
                    onClick={() => {
                      onRoleChange("fleetdriver");
                      setMenuOpen(false);
                      onToast?.("Switched profile to Fleet Driver", "info");
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[12px] font-medium transition ${
                      role === "fleetdriver"
                        ? "bg-green/15 text-green-bright"
                        : "text-white/80 hover:bg-night hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck size={15} /> Fleet Driver
                    </span>
                    {role === "fleetdriver" && <Check size={14} className="text-green-bright" />}
                  </button>

                  <div className="my-1 border-t border-night-line" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onToast?.("Signed out successfully", "info");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12px] font-medium text-red transition hover:bg-red/10"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
