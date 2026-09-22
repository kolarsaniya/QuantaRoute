import { Star, X } from "lucide-react";
import type { DriverProfile } from "../lib/driverTypes";
import type { UserRole } from "./TopBar";

interface Props {
  role: UserRole;
  driver?: DriverProfile;
  onClose: () => void;
  onEditDriverClick?: () => void;
}

export function ProfileModal({ role, driver, onClose, onEditDriverClick }: Props) {
  const isAdmin = role === "admin";
  const isFleetManager = role === "fleetmanager";
  const isDriver = role === "fleetdriver";

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-night/80 p-0 sm:p-4 backdrop-blur-sm">
      <div className="anim-up w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-2xl border border-line bg-card shadow-2xl">
        {/* Header */}
        <div className="relative border-b border-line bg-card-soft px-5 py-5 sm:px-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-ink-faint hover:bg-paper hover:text-ink transition"
            aria-label="Close Profile"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green text-white font-bold font-mono text-xl shadow-md">
              {isDriver && driver ? driver.avatarInitials : isAdmin ? "AD" : "FM"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
                  {isDriver && driver
                    ? driver.name
                    : isAdmin
                      ? "Super Admin Controller"
                      : "Fleet Operations Manager"}
                </h3>
                <span className="rounded-full bg-green/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-green-deep border border-green/30">
                  {isAdmin ? "Super Admin" : isFleetManager ? "Dispatcher" : "Field Driver"}
                </span>
              </div>
              <p className="text-[12px] text-ink-soft mt-0.5">
                {isDriver && driver
                  ? driver.email
                  : isAdmin
                    ? "admin@quantaroute.com"
                    : "fleetmanager@quantaroute.com"}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Role specific credential cards */}
          {isAdmin && (
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-paper/60 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  System Permissions & Authority
                </span>
                <p className="text-[13px] font-semibold text-ink">
                  Full Administrative Privileges
                </p>
                <ul className="text-[12px] text-ink-soft space-y-1">
                  <li>• Global Bangalore Route Optimization (QPSO)</li>
                  <li>• Field Driver Personal Details Editing & Fleet Expansion</li>
                  <li>• Dispatch Broadcasts & Real-Time Incident Clearance</li>
                  <li>• Live OSRM Road Snapping & Wait vs Reroute Calibration</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="rounded-xl border border-line bg-paper/60 p-3">
                  <span className="text-[10px] font-bold text-ink-faint block uppercase">Security Clearance</span>
                  <span className="font-bold text-ink text-[12px] mt-0.5 block">Level 4 (Master)</span>
                </div>
                <div className="rounded-xl border border-line bg-paper/60 p-3">
                  <span className="text-[10px] font-bold text-ink-faint block uppercase">Active System</span>
                  <span className="font-bold text-green-deep text-[12px] mt-0.5 block">QuantaRoute v2.4</span>
                </div>
              </div>
            </div>
          )}

          {isFleetManager && (
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-paper/60 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  Operations Jurisdiction
                </span>
                <p className="text-[13px] font-semibold text-ink">
                  Bengaluru Central & Eastern Logistics Hub
                </p>
                <p className="text-[12px] text-ink-soft">
                  Responsible for active route dispatch, driver shift assignments, and delivery manifest verification.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-xl border border-line bg-paper/60 p-3">
                  <span className="text-[10px] font-bold text-ink-faint block uppercase">Shift Hours</span>
                  <span className="font-semibold text-ink mt-0.5 block">07:00 AM – 07:00 PM</span>
                </div>
                <div className="rounded-xl border border-line bg-paper/60 p-3">
                  <span className="text-[10px] font-bold text-ink-faint block uppercase">Managed Fleet</span>
                  <span className="font-semibold text-green-deep mt-0.5 block">5 Active Commercial Trucks</span>
                </div>
              </div>
            </div>
          )}

          {isDriver && driver && (
            <div className="space-y-3">
              {/* Vehicle & License Strip */}
              <div className="rounded-xl border border-line bg-paper/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                    Assigned Vehicle & Commercial License
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber">
                    <Star size={12} fill="currentColor" /> {driver.rating} Rating
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-[10px] text-ink-faint block">Vehicle Model</span>
                    <strong className="text-ink">{driver.vehicleModel}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-faint block">License Plate</span>
                    <strong className="font-mono text-ink">{driver.plate}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-faint block">Commercial DL</span>
                    <strong className="font-mono text-ink">{driver.licenseNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-faint block">Powertrain</span>
                    <strong className="text-ink">{driver.fuelType} ({driver.batteryOrFuelLevel}% current)</strong>
                  </div>
                </div>
              </div>

              {/* Personal & Emergency Details */}
              <div className="rounded-xl border border-line bg-paper/60 p-3.5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  Personal & Emergency Contacts
                </span>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <span className="text-[10px] text-ink-faint block">Contact Phone</span>
                    <span className="font-semibold text-ink">{driver.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-faint block">Blood Group</span>
                    <span className="font-mono font-bold text-red">{driver.bloodGroup}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-line/60">
                    <span className="text-[10px] text-ink-faint block">Emergency Contact</span>
                    <span className="font-semibold text-ink">
                      {driver.emergencyContact.name} ({driver.emergencyContact.relationship}) ·{" "}
                      <span className="font-mono">{driver.emergencyContact.phone}</span>
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-ink-faint block">Working Shift</span>
                    <span className="text-ink-soft">{driver.shift}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
            {onEditDriverClick && (
              <button
                onClick={() => {
                  onClose();
                  onEditDriverClick();
                }}
                className="rounded-xl border border-line bg-paper px-4 py-2 text-[12px] font-bold text-ink hover:bg-card hover:border-ink transition"
              >
                Edit Driver Details
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl bg-ink px-5 py-2 text-[12px] font-bold text-white hover:bg-black transition"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
