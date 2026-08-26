import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Building2,
  Zap,
  ShieldCheck,
  Users,
  ArrowRight,
  ShoppingBag,
  HeartPulse,
  Factory,
  Store,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FadeInSection, StaggerGrid, StaggerItem } from "@/components/animated/FadeIn";
import heroImg from "@/assets/hero-bg.jpg";
import warehouse from "@/assets/warehouse.jpg";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Business Shipping & Commercial Logistics — SwiftArc" },
      {
        name: "description",
        content:
          "Custom shipping solutions for businesses of all sizes. Commercial freight, scheduled pickups, volume discounts, and dedicated account support across 220+ countries.",
      },
      { property: "og:title", content: "Business Shipping Solutions — SwiftArc Logistics" },
      {
        property: "og:description",
        content: "Scale your supply chain with SwiftArc business shipping accounts and volume rates.",
      },
      { name: "keywords", content: "business shipping, commercial freight, e-commerce logistics, corporate courier, volume freight rates" },
    ],
    links: [{ rel: "canonical", href: "/business" }],
  }),
  component: BusinessPage,
});

const solutions = [
  {
    icon: Building2,
    color: "bg-primary/10 text-primary",
    name: "Enterprise Freight",
    desc: "Dedicated account coordination, prioritized network routing, SLA commitments, and custom air and sea cargo allocations.",
    bullets: ["Dedicated account manager", "Custom lane pricing", "Volume freight commitments", "Priority customs handling"],
  },
  {
    icon: ShoppingBag,
    color: "bg-sky-500/10 text-sky-600",
    name: "E-Commerce Fulfillment",
    desc: "Connect your store to our distribution hubs for reliable customer deliveries, returns handling, and batch label generation.",
    bullets: ["Batch tracking IDs", "Bulk shipment processing", "Clear returns handling", "Direct customer notifications"],
  },
  {
    icon: ShieldCheck,
    color: "bg-emerald-500/10 text-emerald-600",
    name: "Healthcare & Sensitive Cargo",
    desc: "Temperature-controlled transit, strict chain-of-custody protocols, and time-critical routing for medical and high-value shipments.",
    bullets: ["Temperature monitoring", "Compliant cargo handling", "Chain-of-custody records", "Time-sensitive air transit"],
  },
  {
    icon: Users,
    color: "bg-amber-500/10 text-amber-600",
    name: "Small & Mid-Sized Businesses",
    desc: "Straightforward shipping rates with no minimum package thresholds. Open a corporate account and start saving on regular dispatches.",
    bullets: ["No monthly minimums", "Volume tier discounts", "Monthly invoicing option", "Local office drop-off"],
  },
];

const industries = [
  {
    id: "retail",
    icon: Store,
    label: "Retail & Consumer Goods",
    headline: "Keep your store shelves and stockrooms supplied.",
    copy: "Scheduled ground transit and priority freight routes ensure consistent replenishment without inventory shortages.",
    metrics: [
      { value: "99.4%", label: "On-time arrival" },
      { value: "220+", label: "Countries connected" },
      { value: "24/7", label: "Operations monitoring" },
    ],
    caseStudy: "A fashion retailer reduced replenishment delays across 12 regional outlets by consolidating their freight on SwiftArc.",
  },
  {
    id: "healthcare",
    icon: HeartPulse,
    label: "Healthcare & Life Sciences",
    headline: "Reliable temperature-controlled transport.",
    copy: "Validated handling protocols, temperature tracking, and expedited customs processing for pharmaceuticals and medical equipment.",
    metrics: [
      { value: "100%", label: "Inspection compliance" },
      { value: "24/7", label: "Monitoring support" },
      { value: "190+", label: "Air cargo destinations" },
    ],
    caseStudy: "A medical supplier moves temperature-sensitive clinical kits across multiple borders with full chain-of-custody verification.",
  },
  {
    id: "manufacturing",
    icon: Factory,
    label: "Manufacturing & Industrial",
    headline: "Transport parts before production lines pause.",
    copy: "Express air cargo for urgent replacement parts and scheduled heavy freight for regular production materials.",
    metrics: [
      { value: "48h", label: "Express international delivery" },
      { value: "Full", label: "Pallet & container freight" },
      { value: "Real-time", label: "Status checkpoints" },
    ],
    caseStudy: "An equipment manufacturer eliminated assembly delays by using SwiftArc scheduled air freight for precision parts.",
  },
];

function BusinessPage() {
  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      {/* ── Premium Glassmorphic Hero ── */}
      <section
        className="relative min-h-[68vh] flex items-center overflow-hidden pt-12 pb-16"
        style={{ background: "linear-gradient(145deg, #f0f6ff 0%, #ffffff 55%, #f5f0ff 100%)" }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#032D60 1.2px, transparent 1.2px)", backgroundSize: "26px 26px" }}
          aria-hidden
        />
        {/* Glow orbs */}
        <div className="absolute -top-20 right-0 w-[480px] h-[480px] rounded-full bg-primary/[0.06] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-[380px] h-[380px] rounded-full bg-sky-400/[0.06] blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
            
            {/* Left copy */}
            <div className="lg:col-span-7 space-y-6">
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm">
                  <Building2 className="h-3 w-3" />
                  Commercial Logistics & Freight
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#032D60] leading-[1.1]"
              >
                Commercial Shipping Solutions for{" "}
                <span className="relative">
                  <span className="text-primary">Your Business</span>
                  <motion.span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary/40" initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.8 }} />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed"
              >
                From daily parcel dispatches to full container freight, SwiftArc provides transparent rates,
                dedicated support, and dependable transit across 220+ countries.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22 }}
                className="flex flex-wrap gap-4"
              >
                <Link to="/contact">
                  <Button size="lg" className="group bg-primary text-white hover:bg-primary-hover font-bold px-7 h-12 rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-primary/35 transition-all hover:shadow-xl">
                    Open Corporate Account <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/rates">
                  <Button size="lg" variant="outline" className="border-2 border-[#032D60]/20 text-[#032D60] bg-white/60 backdrop-blur-sm hover:border-primary hover:text-primary hover:bg-primary/5 font-bold px-7 h-12 rounded-xl hover:-translate-y-0.5 transition-all">
                    View Volume Rates
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right image with glass frame */}
            <div className="lg:col-span-5 hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.2 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/25 backdrop-blur-md p-2 shadow-2xl shadow-[#032D60]/12">
                  <img src={heroImg} alt="SwiftArc Business Logistics" className="w-full h-72 sm:h-80 lg:h-96 rounded-2xl object-cover" />
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-tr from-primary/8 via-transparent to-transparent pointer-events-none" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Solutions Grid ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <FadeInSection className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
            TAILORED TIERS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#032D60]">
            Logistics Built for Your Scale
          </h2>
          <div className="w-14 h-1 bg-primary rounded-full mx-auto mt-4 mb-4" />
          <p className="text-slate-500 text-sm sm:text-base">
            Whether you ship ten boxes a week or multiple pallets every day, we offer solutions that fit your budget and timelines.
          </p>
        </FadeInSection>

        <StaggerGrid className="grid gap-6 md:grid-cols-2">
          {solutions.map((s) => (
            <StaggerItem key={s.name}>
              <div className="group h-full flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-primary/15 transition-all duration-400">
                <div>
                  <div className={`h-14 w-14 rounded-2xl ${s.color} grid place-items-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#032D60] mb-3 group-hover:text-primary transition-colors">{s.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">{s.desc}</p>
                  
                  <ul className="grid gap-3 sm:grid-cols-2 mb-8">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium leading-tight">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link to="/contact" className="inline-flex items-center text-sm font-bold text-primary group-hover:translate-x-1 transition-transform w-fit">
                  Inquire About Solution <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {/* ── Industry Tabs ── */}
      <section className="bg-slate-50 border-y border-slate-100 py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection className="max-w-3xl mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
              INDUSTRY FOCUS
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-[#032D60] sm:text-4xl">
              Specialized Freight Handling by Sector
            </h2>
          </FadeInSection>

          <Tabs defaultValue="retail" className="space-y-8">
            <FadeInSection>
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0 mb-8">
                {industries.map((it) => (
                  <TabsTrigger
                    key={it.id}
                    value={it.id}
                    className="gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary transition-all shadow-sm data-[state=active]:shadow-md"
                  >
                    <it.icon className="h-4 w-4" /> {it.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </FadeInSection>

            {industries.map((it) => (
              <TabsContent key={it.id} value={it.id} className="mt-0 focus-visible:ring-0">
                <FadeInSection className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 lg:grid-cols-12 shadow-xl shadow-[#032D60]/5">
                  <div className="lg:col-span-7 flex flex-col justify-center">
                    <h3 className="font-display text-2xl font-bold text-[#032D60] sm:text-3xl leading-tight">
                      {it.headline}
                    </h3>
                    <p className="mt-4 text-slate-500 leading-relaxed text-sm sm:text-base">{it.copy}</p>

                    <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-100 pt-8">
                      {it.metrics.map((m, idx) => (
                        <div key={idx}>
                          <div className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
                            {m.value}
                          </div>
                          <div className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 rounded-2xl p-8 text-white flex flex-col justify-between shadow-inner" style={{ backgroundColor: "#032D60" }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
                        Operational Case Example
                      </p>
                      <p className="text-base text-white/90 leading-relaxed">{it.caseStudy}</p>
                    </div>
                    <div className="pt-8">
                      <Link to="/contact">
                        <Button className="w-full bg-primary hover:bg-primary-hover text-white font-bold h-11 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
                          Discuss With Our Team <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </FadeInSection>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-20 bg-[#032D60] text-white">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#EA580C 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          aria-hidden
        />
        <div className="absolute -top-20 right-1/4 w-80 h-80 rounded-full bg-primary/25 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <FadeInSection className="space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Ready to set up your business shipping account?
            </h2>
            <p className="text-white/75 max-w-xl mx-auto leading-relaxed">
              Contact our commercial sales team for custom rate sheets, invoicing terms, and schedule coordination.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary-hover text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-primary/50 hover:shadow-xl transition-all">
                  Contact Corporate Sales <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/locations">
                <Button size="lg" variant="outline" className="border-2 border-white/25 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 font-bold px-8 h-12 rounded-xl hover:-translate-y-0.5 transition-all">
                  Find Nearest Office
                </Button>
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
