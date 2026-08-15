/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "motion/react";
import {
  Check,
  Package,
  Clock,
  UserCheck,
  Navigation,
  MapPin,
  PackageCheck,
  Truck,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { ShipmentStatus } from "@/lib/types";

const ALL_STAGES: { key: string; label: string; Icon: any }[] = [
  { key: "booking_created", label: "Booking Created", Icon: Package },
  { key: "awaiting_confirmation", label: "Awaiting Confirmation", Icon: Clock },
  { key: "driver_assigned", label: "Driver Assigned", Icon: UserCheck },
  { key: "driver_en_route", label: "Driver En Route", Icon: Navigation },
  { key: "driver_arrived", label: "Driver Arrived", Icon: MapPin },
  { key: "package_picked_up", label: "Package Picked Up", Icon: PackageCheck },
  { key: "in_transit", label: "In Transit", Icon: Truck },
  { key: "near_destination", label: "Near Destination", Icon: Navigation },
  { key: "delivered", label: "Delivered", Icon: CheckCircle2 },
  { key: "completed", label: "Completed", Icon: ShieldCheck },
];

export function TrackingTimeline({
  status,
  progress,
}: {
  status: ShipmentStatus | string;
  progress: number;
}) {
  // Map older status names to 10-stage index
  const normalizedKey =
    status === "label_created"
      ? "booking_created"
      : status === "picked_up"
        ? "package_picked_up"
        : status === "out_for_delivery"
          ? "near_destination"
          : status;

  const activeIndex = Math.max(
    0,
    ALL_STAGES.findIndex((s) => s.key === normalizedKey),
  );
  const isCompleted = normalizedKey === "completed" || normalizedKey === "delivered";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground font-semibold">
        <span>Live Progress</span>
        <span className="text-amber font-bold text-sm">{progress}%</span>
      </div>

      <div className="relative mt-6 overflow-x-auto pb-4">
        {/* Progress Bar Line */}
        <div className="absolute left-4 right-4 top-5 h-[3px] rounded-full bg-border" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute left-4 top-5 h-[3px] rounded-full bg-amber"
        />

        <ol className="relative flex items-center justify-between min-w-[700px] px-2">
          {ALL_STAGES.map((s, i) => {
            const isDone = i < activeIndex || isCompleted;
            const isCurrent = i === activeIndex && !isCompleted;
            const Icon = s.Icon;
            return (
              <li key={s.key} className="flex flex-col items-center text-center max-w-[80px]">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 200 }}
                  className={`relative grid h-10 w-10 place-items-center rounded-full border-2 transition-all ${
                    isDone || isCompleted
                      ? "border-amber bg-amber text-navy-deep font-bold"
                      : isCurrent
                        ? "border-navy-deep bg-navy-deep text-cream ring-4 ring-amber/20 font-bold"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber"></span>
                    </span>
                  )}
                </motion.div>
                <p
                  className={`mt-2.5 text-[11px] font-semibold leading-tight ${isDone || isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground/70"}`}
                >
                  {s.label}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
