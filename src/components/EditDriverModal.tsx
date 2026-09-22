import { useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import type { DriverProfile } from "../lib/driverTypes";

interface Props {
  driver: DriverProfile | null;
  onClose: () => void;
  onSave: (updated: DriverProfile) => void;
}

export function EditDriverModal({ driver, onClose, onSave }: Props) {
  if (!driver) return null;

  const [form, setForm] = useState<DriverProfile>({ ...driver });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Driver name cannot be empty");
      return;
    }
    if (!form.phone.trim()) {
      setError("Contact phone number is required");
      return;
    }
    if (!form.licenseNumber.trim()) {
      setError("License number is required");
      return;
    }

    // Auto-compute avatar initials from name
    const parts = form.name.trim().split(/\s+/);
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : form.name.slice(0, 2).toUpperCase();

    onSave({
      ...form,
      avatarInitials: initials,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm">
      <div className="anim-pop w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-card-soft px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green text-white font-bold font-mono">
              {form.avatarInitials || "DR"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-ink">Edit Driver Details</h3>
                <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-ink-faint border border-line">
                  {form.id}
                </span>
              </div>
              <p className="text-[12px] text-ink-soft">
                Admin Management · Vehicle #{form.vehicleNumber} ({form.plate})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-paper hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-red/30 bg-red/10 p-3 text-[12px] font-medium text-red">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink focus:border-green focus:outline-none"
                placeholder="e.g. Rajesh Kumar"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink focus:border-green focus:outline-none"
                placeholder="e.g. +91 98450 12345"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                Work Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink focus:border-green focus:outline-none"
                placeholder="driver@quantaroute.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                Driving License (DL) *
              </label>
              <input
                type="text"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink focus:border-green focus:outline-none"
                placeholder="DL-0420180019234"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                Assigned Vehicle Model
              </label>
              <input
                type="text"
                value={form.vehicleModel}
                onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink focus:border-green focus:outline-none"
                placeholder="e.g. Tata Ace EV"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                License Plate Number
              </label>
              <input
                type="text"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink focus:border-green focus:outline-none"
                placeholder="KA-01-EA-1082"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                Shift Schedule
              </label>
              <input
                type="text"
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink focus:border-green focus:outline-none"
                placeholder="07:30 AM – 04:30 PM (Morning)"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                Blood Group
              </label>
              <input
                type="text"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink focus:border-green focus:outline-none"
                placeholder="e.g. O+, B+, A+"
              />
            </div>
          </div>

          {/* Emergency Contact Group */}
          <div className="rounded-xl border border-line bg-card-soft p-3.5 space-y-3">
            <h4 className="text-[12px] font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-green" /> Emergency Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  value={form.emergencyContact.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      emergencyContact: { ...form.emergencyContact, name: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                  placeholder="Sunita Kumar (Spouse)"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  value={form.emergencyContact.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      emergencyContact: { ...form.emergencyContact, phone: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                  placeholder="+91 98450 99881"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-paper px-4 py-2 text-[13px] font-semibold text-ink-soft hover:bg-card hover:text-ink transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-green px-5 py-2 text-[13px] font-bold text-white shadow-[0_3px_0_#0c7a37] hover:bg-green-deep transition active:translate-y-0.5"
            >
              <Check size={16} /> Save Driver Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
