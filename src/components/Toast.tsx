import { AlertTriangle, Car, Info } from "lucide-react";

export interface ToastData {
  id: number;
  msg: string;
  tone: "traffic" | "accident" | "info";
}

const TONE = {
  traffic: { bg: "bg-amber", icon: Car, label: "text-ink" },
  accident: { bg: "bg-red", icon: AlertTriangle, label: "text-white" },
  info: { bg: "bg-ink", icon: Info, label: "text-white" },
} as const;

export function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null;
  const t = TONE[toast.tone];
  const Icon = t.icon;
  return (
    <div
      key={toast.id}
      className={`qr-toast fixed bottom-24 left-1/2 z-[1200] flex w-max max-w-[92vw] -translate-x-1/2 items-center gap-2.5 rounded-full ${t.bg} px-4 py-2.5 shadow-[0_8px_24px_rgba(14,17,22,0.25)] lg:bottom-6`}
    >
      <Icon size={15} className={t.label} />
      <span className={`text-[13px] font-semibold ${t.label}`}>{toast.msg}</span>
    </div>
  );
}
