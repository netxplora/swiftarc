import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Calculator, Plane, Truck, Package, Zap } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { calculateRates } from "@/lib/api.functions";

export const Route = createFileRoute("/rates")({
  head: () => ({
    meta: [
      { title: "Rate & Transit Calculator — SwiftArc" },
      { name: "description", content: "Instant multi-service quotes with estimated transit times across the SwiftArc network." },
      { property: "og:title", content: "Rate & Transit Calculator — SwiftArc" },
      { property: "og:description", content: "Compare service levels and transit times in seconds." },
    ],
  }),
  component: Rates,
});

const icons = {
  priority: Plane,
  express: Zap,
  ground: Truck,
  freight: Package,
};

function Rates() {
  const [weight, setWeight] = useState(4.2);
  const [zone, setZone] = useState<"regional" | "international" | "intercontinental">("international");
  
  const fetchRates = useServerFn(calculateRates);
  const { data: quotes, isFetching } = useQuery({
    queryKey: ["rates", weight, zone],
    queryFn: () => fetchRates({ data: { weight, zone } }),
    staleTime: 60000,
  });

  return (
    <>
      <PageHero
        eyebrow="Pricing & Services"
        title="Fast, flat, or flexible."
        subtitle="Compare our domestic and international service tiers. No hidden fees, no complex zones—just clear pricing for every parcel."
        imageSrc="/images/hero_rates_1784188730712.png"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-border shadow-sm">
              <CardContent className="space-y-5 p-6 sm:p-8">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Calculator className="h-4 w-4" /> Shipment
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Origin ZIP / city</Label>
                    <Input className="mt-1.5 h-11 transition-shadow focus-visible:ring-amber" placeholder="Rotterdam, NL" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Destination ZIP / city</Label>
                    <Input className="mt-1.5 h-11 transition-shadow focus-visible:ring-amber" placeholder="Milan, IT" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Weight: <span className="text-navy-deep">{weight.toFixed(1)} kg</span>
                  </Label>
                  <input
                    type="range"
                    min={0.5}
                    max={100}
                    step={0.1}
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                    className="mt-3 w-full accent-amber"
                    aria-label="Weight in kg"
                  />
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Zone</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["regional", "international", "intercontinental"] as const).map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZone(z)}
                        className={`h-11 rounded-md border text-sm font-medium capitalize transition-all ${
                          zone === z ? "border-navy-deep bg-navy-deep text-cream shadow-md" : "border-border bg-card hover:border-amber/50 hover:bg-secondary"
                        }`}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="h-11 w-full bg-amber text-navy-deep hover:bg-amber-soft">Recalculate</Button>
              </CardContent>
            </Card>
          </motion.div>

          <div className="space-y-4">
            {(quotes ?? []).map((q, i) => {
              const Icon = icons[q.id as keyof typeof icons] || Package;
              return (
              <motion.div
                key={q.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`grid items-center gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[auto_1fr_auto] ${isFetching ? 'opacity-50' : ''}`}
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-deep text-cream">
                  <Icon className="h-5 w-5 text-amber" />
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="font-display text-lg">{q.name}</h3>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      ~{q.days} business day{q.days > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full max-w-xs overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      key={`${q.name}-${weight}-${zone}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (q.price / 400) * 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-amber"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-bold text-navy-deep">
                    €{q.price.toFixed(2)}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">All-in</div>
                </div>
              </motion.div>
            )})}
            <p className="text-xs text-muted-foreground">
              Illustrative pricing only. Log in for negotiated rates and fuel surcharges.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
