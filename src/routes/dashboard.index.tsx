import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Package, TrendingUp, Clock, DollarSign, ArrowUpRight, Truck } from "lucide-react";
import { shipments, statusLabels } from "@/lib/mock-shipments";
import { Counter } from "@/components/animated/Counter";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const list = Object.values(shipments);
  const active = list.filter((s) => s.status !== "delivered").length;
  const kpis = [
    { label: "Active shipments", value: active, suffix: "", icon: Package, delta: "+3 this week" },
    { label: "On-time rate", value: 98, suffix: "%", icon: TrendingUp, delta: "+0.4 pts" },
    { label: "Avg transit", value: 32, suffix: "h", icon: Clock, delta: "-1.2h" },
    { label: "Spend MTD", value: 12480, suffix: " USD", icon: DollarSign, delta: "-8.1%" },
  ];
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Overview</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, Ana</h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's moving on your network today.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/pickup" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary">
            Schedule pickup
          </Link>
          <Link to="/shipping" className="inline-flex h-10 items-center rounded-md bg-navy-deep px-4 text-sm font-medium text-cream hover:bg-navy">
            New shipment
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-widest">{k.label}</span>
              <k.icon className="h-4 w-4 text-amber" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-navy-deep">
              <Counter to={k.value} />{k.suffix}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{k.delta}</p>
          </motion.div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl">Recent shipments</h2>
            <p className="text-xs text-muted-foreground">Latest activity across your account</p>
          </div>
          <Link to="/dashboard/shipments" className="inline-flex items-center gap-1 text-sm font-medium text-amber hover:underline">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {list.slice(0, 4).map((s) => (
            <li key={s.id} className="flex items-center gap-4 p-5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-navy-deep">
                <Truck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    to="/tracking/$trackingId"
                    params={{ trackingId: s.trackingNumber }}
                    className="font-mono text-sm hover:text-amber"
                  >
                    {s.trackingNumber}
                  </Link>
                  <span className="text-xs text-muted-foreground">· {s.service}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {s.origin.city} → {s.destination.city}
                </p>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">
                ETA {new Date(s.estimatedDelivery).toLocaleDateString()}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                {statusLabels[s.status]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
