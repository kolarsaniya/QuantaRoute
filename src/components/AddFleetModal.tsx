import { useState } from "react";
import { BatteryCharging, Check, Fuel, ShieldCheck, Truck, UserPlus, X } from "lucide-react";
import type { DriverProfile } from "../lib/driverTypes";

interface Props {
  existingCount: number;
  onClose: () => void;
  onAdd: (newDriver: DriverProfile) => void;
}

export function AddFleetModal({ existingCount, onClose, onAdd }: Props) {
  const nextVehicleNum = existingCount + 1;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("Tata Ace EV");
  const [plate, setPlate] = useState(`KA-0${nextVehicleNum}-EV-${1000 + nextVehicleNum * 123}`);
  const [fuelType, setFuelType] = useState<"EV" | "Diesel">("EV");
  const [shift, setShift] = useState("08:00 AM – 05:00 PM (Regular)");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Driver name is required");
      return;
    }
    if (!phone.trim()) {
      setError("Contact phone number is required");
      return;
    }
    if (!licenseNumber.trim()) {
      setError("Driving license number is required");
      return;
    }

    const parts = name.trim().split(/\s+/);
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();

    const newDriver: DriverProfile = {
      id: `DRV-00${nextVehicleNum}`,
      vehicleNumber: nextVehicleNum,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `driver.${name.trim().toLowerCase().replace(/\s+/g, "")}@quantaroute.com`,
      licenseNumber: licenseNumber.trim(),
      vehicleModel: vehicleModel.trim(),
      plate: plate.trim().toUpperCase(),
      fuelType,
      batteryOrFuelLevel: 85,
      emergencyContact: {
        name: emergencyName.trim() || "Emergency Contact",
        relationship: "Family",
        phone: emergencyPhone.trim() || phone.trim(),
      },
      bloodGroup: bloodGroup.trim() || "O+",
      shift: shift.trim(),
      avatarInitials: initials,
      status: "at-depot",
      rating: 5.0,
      completedDeliveries: 0,
      totalDeliveries: 0,
    };

    onAdd(newDriver);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center bg-night/80 p-0 sm:p-4 backdrop-blur-sm">
      <div className="anim-up w-full max-w-xl overflow-hidden rounded-t-3xl sm:rounded-2xl border border-line bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-card-soft px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green text-white shadow-sm">
              <UserPlus size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-ink">
                  Add New Fleet Vehicle & Driver
                </h3>
                <span className="rounded bg-green/15 px-2 py-0.5 font-mono text-[10px] font-bold text-green-deep border border-green/30">
                  Truck #{nextVehicleNum}
                </span>
              </div>
              <p className="text-[11px] text-ink-soft">
                Mobile UI Registration · Adds vehicle & driver to active operations
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
          {error && (
            <div className="rounded-xl border border-red/30 bg-red/10 p-3 text-[12px] font-medium text-red">
              {error}
            </div>
          )}

          {/* Vehicle Profile Section */}
          <div className="rounded-xl border border-line bg-paper/60 p-3.5 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
              <Truck size={14} className="text-green" /> Vehicle Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="e.g. Tata Ace EV"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="KA-01-EV-1234"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink font-mono focus:border-green focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Energy Type
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setFuelType("EV")}
                    className={`flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px] font-bold transition ${
                      fuelType === "EV"
                        ? "bg-green text-white border-green"
                        : "bg-card border-line text-ink-soft"
                    }`}
                  >
                    <BatteryCharging size={13} /> EV
                  </button>
                  <button
                    type="button"
                    onClick={() => setFuelType("Diesel")}
                    className={`flex items-center justify-center gap-1 rounded-lg border py-2 text-[11px] font-bold transition ${
                      fuelType === "Diesel"
                        ? "bg-amber text-night border-amber"
                        : "bg-card border-line text-ink-soft"
                    }`}
                  >
                    <Fuel size={13} /> Diesel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Information Section */}
          <div className="rounded-xl border border-line bg-paper/60 p-3.5 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-green" /> Driver Personal Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Driver Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Praveen Rao"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 77889"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Commercial License (DL) *
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="DL-0420220098432"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink font-mono focus:border-green focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@quantaroute.com"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Shift Timing
                </label>
                <input
                  type="text"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  placeholder="08:00 AM – 05:00 PM"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Blood Group
                </label>
                <input
                  type="text"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  placeholder="O+, B+, A+"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="rounded-xl border border-line bg-paper/60 p-3.5 space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              Emergency Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Name (e.g. Spouse / Relative)"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Emergency Phone Number
                </label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+91 98450 11223"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
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
              className="flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-[12px] font-bold text-white shadow-[0_3px_0_#0c7a37] hover:bg-green-deep transition active:translate-y-0.5"
            >
              <Check size={16} /> Register Fleet Vehicle & Driver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
