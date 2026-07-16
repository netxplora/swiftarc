import { motion } from "motion/react";
import { Check, PackageCheck, PackageSearch, Plane, Truck, Home } from "lucide-react";
import type { ShipmentStatus } from "@/lib/mock-shipments";

const steps: { key: ShipmentStatus; label: string; Icon: typeof Check }[] = [
  { key: "picked_up", label: "Picked up", Icon: PackageCheck },
  { key: "in_transit", label: "In transit", Icon: Plane },
  { key: "out_for_delivery", label: "Out for delivery", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: Home },
];

export function TrackingTimeline({ status, progress }: { status: ShipmentStatus; progress: number }) {
  const isDelivered = (status as string) === "delivered";
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === status),
  );



  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
        <span>Shipment progress</span>
        <span className="text-amber font-semibold">{progress}%</span>
      </div>

      <div className="relative mt-6">
        <div className="absolute left-0 right-0 top-5 h-[2px] rounded-full bg-border" />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="absolute left-0 top-5 h-[2px] rounded-full bg-amber"
        />

        <ol className="relative grid grid-cols-4 gap-4">
          {steps.map((s, i) => {
            const done = i < activeIndex || isDelivered;
            const current = i === activeIndex && !isDelivered;
            const Icon = s.Icon;
            return (
              <li key={s.key} className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 200 }}
                  className={`relative grid h-10 w-10 place-items-center rounded-full border-2 transition-colors ${
                    done || current || isDelivered
                      ? "border-amber bg-amber text-navy-deep"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {current && <span className="absolute inset-0 rounded-full pulse-dot" aria-hidden />}
                </motion.div>
                <p className={`mt-3 text-xs font-medium sm:text-sm ${done || current || isDelivered ? "text-foreground" : "text-muted-foreground"}`}>
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

// Provide PackageSearch export shim to avoid tree-shake removal in other files
export { PackageSearch };
