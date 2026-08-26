import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Calculator, Plane, Truck, Package, Zap, ArrowRight, ShieldCheck, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { calculateRates } from "@/lib/api.functions";
import { FadeInSection, StaggerGrid, StaggerItem } from "@/components/animated/FadeIn";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/rates")({
  head: () => ({
    meta: [
      { title: "Shipping Rates & Transit Calculator — SwiftArc" },
      {
        name: "description",
        content:
          "Calculate estimated shipping rates and delivery transit times across regional, international, and intercontinental freight routes.",
      },
      { property: "og:title", content: "Shipping Rates Calculator — SwiftArc" },
      {
        property: "og:description",
        content: "Instant estimated shipping quotes and delivery schedules for air, ground, and sea freight.",
      },
      { name: "keywords", content: "shipping rate calculator, freight quotes, courier costs, international parcel pricing" },
    ],
    links: [{ rel: "canonical", href: "/rates" }],
  }),
  component: RatesPage,
});

const icons = {
  priority: Plane,
  express: Zap,
  ground: Truck,
  freight: Package,
};

function RatesPage() {
  const [weight, setWeight] = useState(4.5);
  const [zone, setZone] = useState<"regional" | "international" | "intercontinental">("international");

  const fetchRates = useServerFn(calculateRates);
  const { data: quotes, isFetching } = useQuery({
    queryKey: ["rates", weight, zone],
    queryFn: () => fetchRates({ data: { weight, zone } }),
    staleTime: 60000,
  });

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      {/* ── Premium Glassmorphic Hero ── */}
      <section
        className="relative min-h-[60vh] flex items-center overflow-hidden pt-12 pb-16 border-b border-slate-100"
        style={{ background: "linear-gradient(145deg, #f0f6ff 0%, #ffffff 55%, #f5f0ff 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#032D60 1.2px, transparent 1.2px)", backgroundSize: "26px 26px" }}
          aria-hidden
        />
        <div className="absolute -top-20 right-0 w-[480px] h-[480px] rounded-full bg-primary/[0.06] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-[380px] h-[380px] rounded-full bg-sky-400/[0.06] blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm">
                  <Calculator className="h-3 w-3" />
                  Instant Transit Calculator
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#032D60] leading-[1.1]"
              >
                Calculate Shipping Rates &{" "}
                <span className="relative">
                  <span className="text-primary">Transit Times</span>
                  <motion.span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary/40" initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.8 }} />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed"
              >
                Compare estimated transit options for your package weight and destination zone. Final quotes are confirmed during on-site branch weighing.
              </motion.p>
            </div>

            <div className="hidden lg:col-span-5 lg:block">
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.2 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/25 backdrop-blur-md p-2 shadow-2xl shadow-[#032D60]/12">
                  <img src={heroImg} alt="SwiftArc Shipping Rates" className="w-full h-72 sm:h-80 rounded-2xl object-cover" />
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-tr from-primary/8 via-transparent to-transparent pointer-events-none" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Calculator Layout ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          
          {/* Controls Column */}
          <div className="lg:col-span-5">
            <FadeInSection direction="left" className="sticky top-28 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-[#032D60]/5">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Calculator className="h-5 w-5" />
                </div>
                <h2 className="font-display text-2xl font-bold text-[#032D60]">Package Parameters</h2>
              </div>

              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Origin Location
                    </Label>
                    <Input defaultValue="London, UK" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:border-primary/40 focus:ring-primary/20 shadow-sm" placeholder="City, Country" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Destination Location
                    </Label>
                    <Input defaultValue="New York, USA" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium focus:border-primary/40 focus:ring-primary/20 shadow-sm" placeholder="City, Country" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Estimated Weight
                    </Label>
                    <span className="font-display text-lg font-bold text-primary">{weight.toFixed(1)} kg</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={100}
                    step={0.5}
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer h-2 bg-slate-100 rounded-full outline-none"
                    aria-label="Weight in kilograms"
                  />
                  <div className="flex justify-between text-[10px] font-bold tracking-wider text-slate-400">
                    <span>0.5 kg</span>
                    <span>50 kg</span>
                    <span>100 kg</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Destination Zone Tier
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["regional", "international", "intercontinental"] as const).map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZone(z)}
                        className={`h-12 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border ${
                          zone === z
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                            : "bg-white text-slate-500 border-slate-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary shadow-sm"
                        }`}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-sky-50/50 p-5 border border-sky-100 text-xs text-sky-800/80 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-sky-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-sky-600" /> Important Note:
                  </p>
                  <p className="pl-6">
                    Online rates are approximations. Exact dimensional weight and final pricing are confirmed when you drop off the package at a SwiftArc office.
                  </p>
                </div>
              </div>
            </FadeInSection>
          </div>

          {/* Quotes Column */}
          <div className="lg:col-span-7">
            <FadeInSection direction="right" className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
                SERVICE OPTIONS
              </span>
              <h3 className="font-display text-3xl font-bold text-[#032D60]">Available Transit Tiers</h3>
            </FadeInSection>

            <StaggerGrid className="space-y-5">
              {(quotes ?? []).map((q) => {
                const Icon = icons[q.id as keyof typeof icons] || Package;
                return (
                  <StaggerItem key={q.name}>
                    <div className={`group rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/15 transition-all duration-400 flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${isFetching ? "opacity-50 pointer-events-none" : ""}`}>
                      <div className="flex items-start sm:items-center gap-5">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary/15 transition-all">
                          <Icon className="h-7 w-7" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h4 className="font-display font-bold text-[#032D60] text-xl group-hover:text-primary transition-colors">{q.name}</h4>
                            <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              {q.days} {q.days === 1 ? "Day" : "Days"} Transit
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 leading-relaxed">
                            Includes live tracking, terminal handling, and standard liability coverage.
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 mt-2 sm:mt-0">
                        <div className="font-display text-3xl sm:text-4xl font-extrabold text-primary">
                          ${q.price.toFixed(2)}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                          Estimated Total
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>

            <FadeInSection direction="up" delay={0.3} className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-8">
              <Link to="/locations">
                <Button className="bg-primary hover:bg-primary-hover text-white font-bold h-12 px-7 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  Find Nearest Office to Ship <MapPin className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="font-bold h-12 px-7 rounded-xl border-2 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                  Custom Freight Quote
                </Button>
              </Link>
            </FadeInSection>
          </div>
        </div>
      </section>
    </div>
  );
}
