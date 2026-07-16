import { Zap, Plane, Truck, ShieldCheck, MapPin } from "lucide-react";

const items = [
  { icon: Zap, text: "Rotterdam → Milan · Priority Overnight · 4h to delivery" },
  { icon: Plane, text: "Singapore → London · Air Freight · Cleared Dubai gateway" },
  { icon: Truck, text: "Austin → Denver · Ground · Delivered 3h early" },
  { icon: ShieldCheck, text: "Munich → Warsaw · Cold chain · 4.2°C stable" },
  { icon: MapPin, text: "New Lagos gateway now live · 24/7 dispatch" },
  { icon: Zap, text: "Tokyo → Seattle · Air · On-time confidence 96%" },
];

export function UpdatesTicker() {
  return (
    <section aria-label="Latest network updates" className="border-y border-border bg-navy-deep text-cream">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-navy-deep to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-navy-deep to-transparent" />
        <div className="flex marquee whitespace-nowrap py-4">
          {[...items, ...items].map((it, i) => (
            <span key={i} className="mx-8 inline-flex items-center gap-2 text-sm text-cream/80">
              <it.icon className="h-4 w-4 text-amber" />
              {it.text}
              <span className="ml-8 h-1 w-1 rounded-full bg-amber/50" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
