import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, lazy, Suspense } from "react";
import { useLocale } from "@/hooks/use-locale";
import { motion } from "motion/react";
import {
  ArrowRight,
  PackageSearch,
  Calculator,
  Truck,
  Plane,
  Package,
  ShieldCheck,
  Clock,
  Sparkles,
  MapPin,
  Building2,
  Users,
  Star,
  Smartphone,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SectionHead } from "@/components/site/SectionHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Counter } from "@/components/animated/Counter";
import { Magnetic } from "@/components/animated/Magnetic";
import { UpdatesTicker } from "@/components/home/UpdatesTicker";
import { PartnerMarquee } from "@/components/home/PartnerMarquee";

const CoverageMap = lazy(() =>
  import("@/components/home/CoverageMap").then((m) => ({ default: m.CoverageMap })),
);
import heroArc from "@/assets/hero-bg.jpg";
import warehouse from "@/assets/warehouse.jpg";
import delivery from "@/assets/delivery.jpg";
import aircraft from "@/assets/aircraft.jpg";
import appMockup from "@/assets/app-mockup-new.png";
import svcIntl from "@/assets/svc-intl.jpg";
import svcColdchain from "@/assets/svc-coldchain.jpg";
import svcSameday from "@/assets/svc-sameday.jpg";
import svcWhiteglove from "@/assets/svc-whiteglove.jpg";
import svcEcommerce from "@/assets/svc-ecommerce.jpg";
import avatarMichael from "@/assets/customer-michael.jpg";
import avatarSarah from "@/assets/customer-sarah.jpg";
import avatarJames from "@/assets/customer-james.jpg";
import newsFrankfurt from "@/assets/news-frankfurt.jpg";
import newsRouting from "@/assets/news-routing.jpg";
import newsElectric from "@/assets/news-electric.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SwiftArc — Global Logistics & Shipment Tracking" },
      {
        name: "description",
        content:
          "Ship, track, and manage freight across 220+ countries with SwiftArc's global logistics network and reliable delivery tracking.",
      },
      { property: "og:title", content: "SwiftArc — Global Logistics" },
      {
        property: "og:description",
        content: "Priority parcels, freight, and reliable tracking.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <UpdatesTicker />
      <FeaturedServices />
      <BusinessSolutions />
      <CoverageSection />
      <Testimonials />
      <LatestNews />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <PartnerMarquee />
      <AppPromo />
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [tn, setTn] = useState("");
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden bg-navy-deep text-cream py-10 sm:py-16 lg:py-20">
      {/* Background Image with High Visibility & Brand Navy Overlay */}
      <img
        src={heroArc}
        alt="Logistics Operations"
        className="absolute inset-0 h-full w-full object-cover opacity-80 scale-105 transition-transform duration-[10000ms] ease-out hover:scale-100"
      />
      {/* Premium Navy Brand Overlays - Reduced Intensity for Higher Image Visibility */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-navy-deep/70 via-navy-deep/45 to-navy/10"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-transparent to-transparent opacity-80"
        aria-hidden
      />
      <div className="absolute inset-0 arc-grid opacity-25" aria-hidden />
      <div
        className="absolute inset-x-0 -top-40 h-[500px] bg-[radial-gradient(closest-side,_var(--color-amber)_0%,_transparent_70%)] opacity-20"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:gap-20 lg:px-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl text-cream"
          >
            {t("hero.title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg text-cream/80"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (tn.trim())
                navigate({ to: "/tracking/$trackingId", params: { trackingId: tn.trim() } });
            }}
            className="mt-8 flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-xl shadow-2xl sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3 text-navy-deep">
              <PackageSearch className="h-5 w-5 shrink-0 text-navy-deep/60" aria-hidden />
              <input
                value={tn}
                onChange={(e) => setTn(e.target.value)}
                placeholder="Enter tracking number, e.g. SA-7241-9032-11"
                aria-label="Tracking number"
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-navy-deep/40 font-medium"
              />
            </div>
            <Magnetic intensity={0.1}>
              <Button
                type="submit"
                size="lg"
                className="h-14 bg-amber px-6 text-navy-deep font-semibold hover:bg-amber-soft transition-all shadow-md"
              >
                Track shipment <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Magnetic>
          </motion.form>

          <div className="mt-10 grid max-w-lg grid-cols-2 gap-6 sm:grid-cols-3">
            {[
              { v: 220, s: "+", l: "Countries" },
              { v: 15, s: "M", l: "Daily parcels" },
              { v: 99.4, s: "%", l: "On-time" },
            ].map((s) => (
              <div key={s.l}>
                <Tooltip>
                  <TooltipTrigger className="font-display text-3xl font-bold text-amber cursor-help">
                    <Counter to={s.v} />
                    {s.s}
                  </TooltipTrigger>
                  <TooltipContent>Verified live data metric</TooltipContent>
                </Tooltip>
                <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-cream/70">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Premium Glassmorphism Live Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mt-8 lg:mt-0"
        >
          <div className="rounded-3xl border border-white/30 bg-white/15 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-soft font-semibold">
                    Live Telemetry
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-amber">SA-7241-9032-11</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber/20 px-3.5 py-1 text-xs font-semibold text-amber border border-amber/30">
                  <span className="relative inline-block h-2 w-2 rounded-full bg-amber pulse-dot" />
                  Out for delivery
                </span>
              </div>

              <div className="mt-6 flex items-end justify-between text-cream">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cream/60 font-medium">
                    Origin
                  </p>
                  <p className="font-display text-lg font-bold text-cream">Rotterdam Hub</p>
                </div>

                <div className="flex-1 px-5">
                  <div className="h-1.5 rounded-full bg-white/10 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "78%" }}
                      transition={{ duration: 1.6, delay: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-amber to-amber-soft"
                    />
                  </div>
                  <p className="mt-2 text-center text-[10px] uppercase font-semibold tracking-wider text-amber-soft">
                    ETA: 4 hours
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-cream/60 font-medium">
                    Destination
                  </p>
                  <p className="font-display text-lg font-bold text-cream">Milan Center</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
                <MiniStat
                  icon={<ShieldCheck className="h-4 w-4 text-amber" />}
                  label="Security"
                  value="Active"
                />
                <MiniStat
                  icon={<Clock className="h-4 w-4 text-amber" />}
                  label="On-Time"
                  value="99.4%"
                />
                <MiniStat
                  icon={<Zap className="h-4 w-4 text-amber" />}
                  label="Priority"
                  value="Express"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs text-cream/80 font-medium">
              <Sparkles className="h-4 w-4 text-amber shrink-0" />
              Delay Risk Analysis: High-confidence tracking active.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
      <div className="flex items-center gap-1.5 text-cream/60">
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1 font-display text-base font-bold text-cream">{value}</div>
    </div>
  );
}

function FeaturedServices() {
  const services = [
    {
      icon: Plane,
      title: "Priority Overnight",
      desc: "Time-critical air freight to 190+ countries with morning delivery.",
      img: aircraft,
    },
    {
      icon: Truck,
      title: "Standard Ground",
      desc: "Cost-efficient ground network with reliable 1–5 day transit windows.",
      img: delivery,
    },
    {
      icon: Package,
      title: "Freight & Palletized",
      desc: "LTL and FTL freight for oversized shipments, temperature-managed if needed.",
      img: warehouse,
    },
    {
      icon: Plane,
      title: "International Priority",
      desc: "Customs-cleared, duty-managed air freight across borders.",
      img: svcIntl,
    },
    {
      icon: ShieldCheck,
      title: "Cold Chain",
      desc: "Temperature-controlled shipments with 24/7 sensor monitoring.",
      img: svcColdchain,
    },
    {
      icon: Zap,
      title: "Same-Day Courier",
      desc: "City-wide same-day delivery on electric fleet, hours not days.",
      img: svcSameday,
    },
    {
      icon: Users,
      title: "White-Glove",
      desc: "Handled by trained specialists — art, luxury, and high-value assets.",
      img: svcWhiteglove,
    },
    {
      icon: Package,
      title: "E-commerce Fulfillment",
      desc: "Storage, pick-pack, and last-mile for online sellers.",
      img: svcEcommerce,
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10 lg:px-8">
      <SectionHead
        eyebrow="Featured services"
        title="Move anything, anywhere on the arc."
        link={{ to: "/shipping", label: "All services" }}
      />
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex"
          >
            <Card className="group relative w-full overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={s.img}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <CardContent className="p-3 sm:p-6">
                <div className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-amber text-navy-deep shadow-sm">
                  <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="mt-2 sm:mt-4 font-display text-sm sm:text-xl font-bold text-foreground leading-tight">
                  {s.title}
                </h3>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
                  {s.desc}
                </p>
                <div className="mt-1 sm:mt-4 inline-flex items-center gap-1 text-[10px] sm:text-sm font-semibold text-amber">
                  Learn more{" "}
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function BusinessSolutions() {
  const items = [
    {
      icon: Building2,
      title: "Enterprise",
      desc: "Dedicated account teams, SLAs, and network priority.",
    },
    {
      icon: Zap,
      title: "E-commerce",
      desc: "Bulk label creation, returns automation, marketplace connectors.",
    },
    {
      icon: ShieldCheck,
      title: "Healthcare & Life Sciences",
      desc: "Temperature-monitored, chain-of-custody critical shipments.",
    },
    { icon: Users, title: "SMB", desc: "Flat pricing, one-click booking, no monthly minimums." },
  ];
  return (
    <section className="relative overflow-hidden bg-background text-foreground py-8 sm:py-10 transition-colors duration-300 border-t border-border/60">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow="Business solutions"
          title="Built for the way your business ships."
          link={{ to: "/business", label: "Explore solutions" }}
        />
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 items-stretch">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-4 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl flex flex-col w-full"
            >
              <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl bg-amber/15 text-amber">
                <it.icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="mt-3 sm:mt-6 font-display text-sm sm:text-xl font-bold text-foreground leading-tight">
                {it.title}
              </h3>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoverageSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Coverage</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            220+ countries. One integrated network.
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            An interconnected web of ground fleets, regional air gateways, and last-mile partners —
            engineered for a single arc from pickup to proof of delivery.
          </p>
          <div className="mt-6 grid max-w-md grid-cols-2 gap-4 text-sm">
            <FactCard label="Air gateways" value="72" />
            <FactCard label="Ground hubs" value="1,240" />
            <FactCard label="Last-mile partners" value="3,800" />
            <FactCard label="Sensor packages" value="Real-time" />
          </div>
          <Magnetic intensity={0.1}>
            <Button
              asChild
              className="mt-8 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <Link to="/locations">
                Find a location <MapPin className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </Magnetic>
        </div>
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-2xl border border-border shadow-lg bg-card">
            <Suspense
              fallback={<div className="h-[400px] w-full animate-pulse rounded-2xl bg-secondary" />}
            >
              <CoverageMap />
            </Suspense>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Active Flights", v: "142", c: "text-blue-500" },
              { l: "Ground Units", v: "8.5k", c: "text-emerald-500" },
              { l: "Customs Cleared", v: "12k/hr", c: "text-amber" },
              { l: "Network Load", v: "74%", c: "text-purple-500" },
            ].map((stat) => (
              <div
                key={stat.l}
                className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col items-center text-center"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.l}
                </span>
                <span className={`mt-2 font-mono text-xl font-bold ${stat.c}`}>{stat.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Testimonials() {
  const items = [
    {
      quote:
        "SwiftArc consolidated three separate carriers into one platform for us. We went from guessing to knowing — every pallet, every hub, every status update in real time. Our ops team saved 14 hours a week on tracking alone.",
      name: "Michael R. Callahan",
      role: "Head of Operations, Northlight Retail",
      avatar: avatarMichael,
      location: "Chicago, IL",
    },
    {
      quote:
        "The delivery prediction is genuinely impressive. It flagged a weather delay at our Dallas hub six hours before our carrier even knew about it. We rerouted the freight and still made the customer's deadline.",
      name: "Sarah D. Thompson",
      role: "Director of Fulfillment, Brightpath Commerce",
      avatar: avatarSarah,
      location: "Austin, TX",
    },
    {
      quote:
        "We're a mid-market distributor, not a Fortune 500 company — but SwiftArc's enterprise SLA felt built for us from day one. The pricing is transparent, the account support is responsive, and the dashboard is the best we've seen at any price point.",
      name: "James A. Rivera",
      role: "COO, Meridian Supply Group",
      avatar: avatarJames,
      location: "Miami, FL",
    },
  ];
  return (
    <section className="bg-secondary/40 border-y border-border/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:px-8">
        <SectionHead eyebrow="Customers" title="Trusted by teams that move product." />
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 items-stretch">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-sm flex flex-col w-full"
            >
              <div className="flex gap-1 text-amber">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-3 sm:mt-4 font-display text-sm sm:text-base leading-relaxed text-foreground font-medium flex-1">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-5 sm:mt-6 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-8 w-8 sm:h-11 sm:w-11 rounded-full object-cover border-2 border-amber/30 shrink-0"
                />
                <div>
                  <div className="text-[10px] sm:text-sm font-bold text-foreground">{t.name}</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">{t.role}</div>
                  <div className="text-[9px] sm:text-xs text-amber/70 mt-0.5">{t.location}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function LatestNews() {
  const news = [
    {
      tag: "Network",
      title: "SwiftArc Opens Frankfurt Air Gateway, Cutting Transit Times Across Central Europe",
      excerpt:
        "The new facility handles up to 18,000 packages per hour and adds direct air connections to 14 additional European destinations.",
      date: "Jul 3, 2026",
      readTime: "4 min read",
      img: newsFrankfurt,
    },
    {
      tag: "Product",
      title: "Route Optimization Now Covers Full Freight Lanes, Not Just Last-Mile",
      excerpt:
        "Our route optimization engine analyzes live traffic, weather patterns, and border wait times across full freight corridors to proactively adjust delivery paths.",
      date: "Jun 24, 2026",
      readTime: "6 min read",
      img: newsRouting,
    },
    {
      tag: "Sustainability",
      title: "80% of SwiftArc's EU Last-Mile Fleet Now Running on Electric",
      excerpt:
        "Ahead of our 2027 zero-emission target, SwiftArc has transitioned the majority of its European urban delivery fleet to electric vehicles, reducing CO₂ by 42,000 tonnes annually.",
      date: "Jun 12, 2026",
      readTime: "5 min read",
      img: newsElectric,
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10 lg:px-8">
      <SectionHead
        eyebrow="Newsroom"
        title="Latest from SwiftArc."
        link={{ to: "/resources", label: "All stories" }}
      />
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 items-stretch">
        {news.map((n, i) => (
          <motion.article
            key={n.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col w-full"
          >
            <div className="aspect-[16/9] overflow-hidden bg-secondary">
              <img
                src={n.img}
                alt={n.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <span className="inline-block rounded-full bg-amber/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber">
                  {n.tag}
                </span>
                <span className="text-xs text-muted-foreground">{n.readTime}</span>
              </div>
              <h3 className="mt-3 font-display text-base sm:text-lg font-bold leading-snug text-foreground">
                {n.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {n.excerpt}
              </p>
              <div className="mt-3 sm:mt-4 flex items-center justify-between text-[10px] sm:text-sm">
                <span className="text-muted-foreground">{n.date}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber">
                  Read more{" "}
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function AppPromo() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-navy-deep text-cream shadow-2xl">
        {/* Background accents */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--color-amber)_0%,_transparent_45%)] opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#3b82f6_0%,_transparent_50%)] opacity-5 pointer-events-none" />
        <div className="absolute inset-0 arc-grid opacity-10" />

        <div className="relative grid gap-0 lg:grid-cols-2">
          {/* Left: Content */}
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-amber/15 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber border border-amber/30">
              <Smartphone className="h-3.5 w-3.5" /> Available now
            </p>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl lg:text-5xl">
              Your logistics command center, in your pocket.
            </h2>
            <p className="mt-4 max-w-md text-cream/70 text-sm sm:text-base leading-relaxed">
              The SwiftArc mobile app gives you full visibility over every shipment, from booking to
              delivery confirmation. Get live push notifications the moment a package moves, scan
              barcodes to look up shipments instantly, and redirect in-transit deliveries with a
              single tap.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-cream/80">
              {[
                "Live package tracking with GPS updates every 90 seconds",
                "Instant barcode scanner for quick shipment lookup",
                "One-tap delivery redirect and hold at location",
                "Offline label preview — no data connection needed",
                "Push alerts for delays, exceptions, and successful delivery",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber/20 text-amber flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="inline-flex h-12 items-center gap-3 rounded-xl bg-cream text-navy-deep px-5 text-sm font-bold hover:bg-amber transition-all shadow-md">
                <div className="grid h-6 w-6 place-items-center rounded font-bold text-navy-deep">
                  ⬇
                </div>
                App Store
              </a>
              <a className="inline-flex h-12 items-center gap-3 rounded-xl border border-cream/20 bg-cream/10 px-5 text-sm font-semibold text-cream hover:bg-cream/20 transition-all">
                <div className="grid h-6 w-6 place-items-center rounded bg-amber text-navy-deep font-bold text-xs">
                  G
                </div>
                Google Play
              </a>
            </div>
          </div>

          {/* Right: App screenshot */}
          <div className="relative flex items-end justify-center overflow-hidden bg-gradient-to-b from-navy/0 to-navy-deep/50 pt-10 lg:pt-0">
            <img
              src={appMockup}
              alt="SwiftArc mobile app tracking screen"
              loading="lazy"
              className="relative z-10 mx-auto max-w-[280px] sm:max-w-[320px] lg:max-w-[380px] drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ----- NEW SECTIONS -----

import { CheckCircle2 } from "lucide-react";

function Features() {
  const features = [
    {
      icon: Zap,
      title: "Real-time Shipment Visibility",
      desc: "Every package is tracked from pickup scan to delivered signature. Our network of GPS sensors and carrier integrations provides location updates every 90 seconds across ground, air, and last-mile legs — giving you and your customers a single source of truth, always.",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise-grade Security",
      desc: "Your freight data and customer information is encrypted at rest and in transit. Role-based access controls let you grant precise permissions to teams, carriers, and third-party platforms without exposing sensitive data. SOC 2 Type II compliant.",
    },
    {
      icon: Sparkles,
      title: "Delay Risk Analysis",
      desc: "SwiftArc's risk engine analyzes historical carrier performance, live weather feeds, port congestion data, and facility telemetry to flag potential delays before they happen. You get proactive alerts, not reactive surprises — so you can communicate clearly with customers and reroute when needed.",
    },
  ];
  return (
    <section className="bg-background py-8 sm:py-10 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Platform</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Built to handle the complexity of global logistics
          </h2>
          <p className="mt-4 text-muted-foreground">
            From automated dispatch to deep supply chain analytics, SwiftArc handles operational
            complexity at scale — so your team can focus on growing the business, not managing
            exceptions.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 pb-6 items-stretch">
          {features.map((f, i) => {
            const iconColors = [
              "bg-primary/15 text-primary",
              "bg-success/15 text-success",
              "bg-accent/15 text-accent",
              "bg-warning/15 text-warning",
            ];
            const colorClass = iconColors[i % iconColors.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`${i === 2 ? "col-span-2 sm:col-span-2 md:col-span-1" : ""}`}
              >
                <Card className="border-border bg-card h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <CardContent className="p-4 sm:p-8 space-y-3 sm:space-y-4">
                    <div className={`grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl ${colorClass}`}>
                      <f.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  <h3 className="font-display text-sm sm:text-xl font-bold text-foreground leading-tight">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Book in Minutes",
      desc: "Enter your origin, destination, package details, and service level. SwiftArc instantly generates shipping labels, packing slips, and customs documentation — no paperwork, no phone calls, no waiting.",
    },
    {
      step: "02",
      title: "We Come to You",
      desc: "Schedule a pickup window that fits your operation. A SwiftArc driver arrives at your facility, scans every item into the network, and hands you a chain-of-custody receipt. Same-day pickup available in most metro areas.",
    },
    {
      step: "03",
      title: "Track Every Mile",
      desc: "Your shipment moves through our network under continuous GPS and sensor monitoring. You and your recipient receive live status updates from first scan to final delivery, with a digital proof-of-delivery signature captured at the door.",
    },
  ];
  return (
    <section className="bg-secondary/30 py-8 sm:py-10 border-y border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Process</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-muted-foreground">
            From booking to delivery, SwiftArc handles every step. Here's what the process looks
            like from your side.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 md:gap-8 relative pb-8 items-stretch">
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-border -z-10" />
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`text-center flex flex-col items-center group ${i === 2 ? "col-span-2 sm:col-span-2 md:col-span-1" : ""} px-2`}
            >
              <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-full bg-primary text-primary-foreground font-display text-sm sm:text-2xl font-bold flex items-center justify-center mb-3 sm:mb-6 ring-4 sm:ring-8 ring-background shadow-md transition-transform duration-300 group-hover:scale-110">
                {s.step}
              </div>
              <h3 className="font-display text-sm sm:text-xl font-bold text-foreground mb-1 sm:mb-2 leading-tight">
                {s.title}
              </h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Link to="/register">
            <Button
              size="lg"
              className="bg-amber text-navy-deep hover:bg-amber-soft font-bold shadow-md"
            >
              Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { format, language } = useLocale();

  const plans = [
    {
      name: "Pay As You Go",
      priceUSD: null,
      priceLabel:
        language === "fr"
          ? "Au détail"
          : language === "de"
            ? "Einzelpreis"
            : language === "es"
              ? "Precio al detalle"
              : "Retail",
      desc:
        language === "fr"
          ? "Pour les particuliers expédiant des colis occasionnellement."
          : language === "de"
            ? "Für Privatpersonen mit gelegentlichen Paketsendungen."
            : "For individuals shipping occasional parcels.",
      features: ["Standard tracking", "Drop-off at locations", "Basic email support"],
    },
    {
      name: "Business",
      priceUSD: null,
      priceLabel:
        language === "fr"
          ? "Remise volume"
          : language === "de"
            ? "Mengenrabatt"
            : language === "es"
              ? "Descuento por volumen"
              : "Volume Discount",
      desc:
        language === "fr"
          ? "Pour les e-commerçants et expéditeurs B2B en croissance."
          : language === "de"
            ? "Für wachsende E-Commerce- und B2B-Versender."
            : "For growing e-commerce and B2B shippers.",
      features: ["Scheduled pickups", "API integrations", "Dedicated account rep", "Net 30 terms"],
      highlight: true,
    },
    {
      name: "Enterprise",
      priceUSD: null,
      priceLabel:
        language === "fr"
          ? "Sur devis"
          : language === "de"
            ? "Individuell"
            : language === "es"
              ? "Personalizado"
              : "Custom",
      desc:
        language === "fr"
          ? "Pour les chaînes d'approvisionnement à haut volume et multinationales."
          : language === "de"
            ? "Für mengenmäßige, multinationale Lieferketten."
            : "For high-volume, multi-national supply chains.",
      features: ["Custom SLAs", "Cold-chain monitoring", "White-glove delivery", "Full ERP sync"],
    },
  ];

  return (
    <section className="bg-background py-8 sm:py-10 text-foreground transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Pricing</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Transparent, Scalable Pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            No hidden fuel surcharges. No surprise residential access fees. No peak-season markups
            buried in fine print. SwiftArc charges flat, weight-based rates with volume discounts
            that kick in automatically as your shipping grows.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 md:gap-8 pb-4 items-stretch">
          {plans.map((p, i) => (
            <Card
              key={i}
              className={`relative flex flex-col justify-between transition-all duration-300 ${
                p.highlight
                  ? "border-2 border-amber bg-card shadow-2xl sm:scale-105 z-10 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(245,158,11,0.15)]"
                  : "border-border bg-card text-card-foreground hover:shadow-lg hover:-translate-y-1"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber px-4 py-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-navy-deep shadow-md">
                  Most Popular
                </div>
              )}
              <CardContent className="p-5 sm:p-8 flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-display text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                    {p.name}
                  </h3>
                  <div className="text-base sm:text-lg font-bold text-amber mb-2 sm:mb-4">
                    {p.priceLabel}
                  </div>
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-muted-foreground">{p.desc}</p>
                  <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-8">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-xs sm:text-sm text-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber shrink-0" />{" "}
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to="/register">
                  <Button
                    className={`w-full font-bold h-10 sm:h-11 text-sm ${p.highlight ? "bg-amber text-navy-deep hover:bg-amber-soft shadow-md" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                  >
                    Open Account
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "How does the delay risk analysis work?",
      a: "Our system checks historical carrier data, live weather feeds, port congestion reports, and facility telemetry to flag shipments at risk of delay. When a risk is detected, you receive a notification with the reason and recommended action.",
    },
    {
      q: "Can I integrate SwiftArc into my e-commerce store?",
      a: "Yes. We provide a full REST API and native plugins for Shopify, Magento, and WooCommerce. Business and Enterprise accounts also get access to webhook support for real-time order sync.",
    },
    {
      q: "What happens if my package is lost or damaged?",
      a: "All Business and Enterprise shipments include base insurance coverage up to $100. Optional supplemental coverage is available up to $1,000,000 for high-value items. Claims can be filed directly from your dashboard.",
    },
    {
      q: "How long does pickup take to arrange?",
      a: "Same-day pickup is available in most metro areas when booked before midday. Next-business-day pickup is available nationwide. You can schedule recurring pickups from your dashboard.",
    },
    {
      q: "What countries do you ship to?",
      a: "SwiftArc covers 220+ countries and territories. Customs clearance, duty calculation, and export documentation are handled automatically for international shipments.",
    },
    {
      q: "Is there a minimum shipping volume requirement?",
      a: "No. The Pay As You Go plan has no minimums. Volume discounts apply automatically as your monthly shipment count increases, with no commitment required.",
    },
  ];
  return (
    <section className="bg-secondary/30 py-8 sm:py-10 border-t border-border/50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber mb-3">Support</p>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            If you have a question not listed here, contact our support team from the{" "}
            <Link to="/support" className="text-amber hover:underline">
              Support page
            </Link>
            .
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border rounded-xl px-1 overflow-hidden bg-card"
            >
              <AccordionTrigger className="text-foreground font-semibold px-4 py-4 hover:no-underline text-left">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground px-4 pb-4 leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
