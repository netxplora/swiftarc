import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight, PackageSearch, Calculator, Truck, Plane, Package,
  ShieldCheck, Clock, Sparkles, MapPin, Building2, Users, Star,
  Smartphone, ChevronRight, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Counter } from "@/components/animated/Counter";
import { UpdatesTicker } from "@/components/home/UpdatesTicker";
import { PartnerMarquee } from "@/components/home/PartnerMarquee";
import { CoverageMap } from "@/components/home/CoverageMap";
import { sampleTrackingIds } from "@/lib/mock-shipments";
import heroArc from "@/assets/hero-bg.jpg";
import warehouse from "@/assets/warehouse.jpg";
import delivery from "@/assets/delivery.jpg";
import aircraft from "@/assets/aircraft.jpg";
import appMockup from "@/assets/app-mockup.jpg";
import svcIntl from "@/assets/svc-intl.jpg";
import svcColdchain from "@/assets/svc-coldchain.jpg";
import svcSameday from "@/assets/svc-sameday.jpg";
import svcWhiteglove from "@/assets/svc-whiteglove.jpg";
import svcEcommerce from "@/assets/svc-ecommerce.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SwiftArc — Global Logistics & Shipment Tracking" },
      {
        name: "description",
        content:
          "Ship, track, and optimize freight across 220+ countries with SwiftArc's engineered logistics network and AI-powered delivery intelligence.",
      },
      { property: "og:title", content: "SwiftArc — Engineered Global Logistics" },
      {
        property: "og:description",
        content: "Priority parcels, freight, and real-time visibility.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <QuickActions />
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

  return (
    <section className="relative overflow-hidden bg-navy-deep text-cream">
      <img
        src="https://cdn.prod.website-files.com/63987b3b1925277bbc0fe8b0/66eaf92a23d8bd40a121be3d_Top%205%20Biggest%20Couriers%20in%20Nigeria%20for%20International%20Shipping.jpg"
        alt="Hero Delivery"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 arc-grid opacity-20" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-navy-deep/40 to-transparent" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:gap-16 lg:px-8 lg:py-28">
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
            className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
          >
            The world's freight,
            <br />
            <span className="text-amber">on a single arc.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg text-cream/75"
          >
            Priority parcels, freight, and time-critical shipments across 220+
            countries — engineered for reliability, visible in real time.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (tn.trim()) navigate({ to: "/tracking/$trackingId", params: { trackingId: tn.trim() } });
            }}
            className="mt-8 flex flex-col gap-3 rounded-2xl border border-cream/10 bg-cream/5 p-3 backdrop-blur sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-cream px-4 py-3 text-navy-deep">
              <PackageSearch className="h-5 w-5 shrink-0 text-navy-deep/60" aria-hidden />
              <input
                value={tn}
                onChange={(e) => setTn(e.target.value)}
                placeholder="Enter tracking number, e.g. SA-7241-9032-11"
                aria-label="Tracking number"
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-navy-deep/40"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 bg-amber px-6 text-navy-deep hover:bg-amber-soft">
              Track shipment <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.form>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream/60">
            <span>Try:</span>
            {sampleTrackingIds.map((id) => (
              <Link
                key={id}
                to="/tracking/$trackingId"
                params={{ trackingId: id }}
                className="font-mono text-amber hover:underline"
              >
                {id}
              </Link>
            ))}
          </div>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-6">
            {[
              { v: 220, s: "+", l: "Countries" },
              { v: 15, s: "M", l: "Daily parcels" },
              { v: 99.4, s: "%", l: "On-time" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl font-bold text-amber">
                  <Counter to={s.v} />{s.s}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-cream/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="relative overflow-hidden rounded-2xl border border-cream/10 bg-cream/5 p-4 backdrop-blur">
            <div className="rounded-xl bg-navy p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-cream/50">Live</p>
                  <p className="mt-1 font-mono text-sm text-amber">SA-7241-9032-11</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber/20 px-3 py-1 text-xs font-semibold text-amber">
                  <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-amber pulse-dot" />
                  Out for delivery
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between text-cream">
                <div>
                  <p className="text-xs uppercase tracking-widest text-cream/50">Origin</p>
                  <p className="font-display text-lg">Rotterdam</p>
                </div>
                <div className="flex-1 px-4">
                  <div className="h-[2px] rounded-full bg-cream/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "78%" }}
                      transition={{ duration: 1.6, delay: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-amber"
                    />
                  </div>
                  <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-cream/50">
                    ETA in 4 hours
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-cream/50">Dest.</p>
                  <p className="font-display text-lg">Milan</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
                <MiniStat icon={<ShieldCheck className="h-4 w-4" />} label="Health" value="98" />
                <MiniStat icon={<Clock className="h-4 w-4" />} label="On-time" value="94%" />
                <MiniStat icon={<Zap className="h-4 w-4" />} label="Priority" value="Ovn." />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-cream/60">
              <Sparkles className="h-4 w-4 text-amber" />
              AI: 6-minute buffer over ETA. High confidence.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-navy-deep/60 p-3">
      <div className="flex items-center gap-2 text-cream/60">{icon}<span className="text-[10px] uppercase tracking-widest">{label}</span></div>
      <div className="mt-1 font-display text-lg text-cream">{value}</div>
    </div>
  );
}

function QuickActions() {
  return (
    <section className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
      <Card className="relative overflow-hidden border-border bg-card shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="ship">
            <TabsList className="w-full justify-start overflow-x-auto rounded-lg bg-secondary p-1">
              <TabsTrigger value="ship" className="gap-2"><Package className="h-4 w-4" />Ship</TabsTrigger>
              <TabsTrigger value="track" className="gap-2"><PackageSearch className="h-4 w-4" />Track</TabsTrigger>
              <TabsTrigger value="rate" className="gap-2"><Calculator className="h-4 w-4" />Rate</TabsTrigger>
              <TabsTrigger value="pickup" className="gap-2"><Truck className="h-4 w-4" />Pickup</TabsTrigger>
            </TabsList>

            <TabsContent value="ship" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="From (city, country)" placeholder="Rotterdam, NL" />
              <Field label="To (city, country)" placeholder="Milan, IT" />
              <Field label="Weight (kg)" placeholder="4.2" type="number" />
              <Field label="Service level" placeholder="Priority overnight" />
              <div className="sm:col-span-2 lg:col-span-4">
                <Button asChild className="h-11 bg-navy-deep text-cream hover:bg-navy">
                  <Link to="/shipping">Create shipment <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="track" className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
              <Field label="Tracking number" placeholder="SA-XXXX-XXXX-XX" />
              <Button asChild className="h-11 self-end bg-amber text-navy-deep hover:bg-amber-soft">
                <Link to="/tracking">Track now</Link>
              </Button>
            </TabsContent>

            <TabsContent value="rate" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Origin ZIP / City" placeholder="1000 AA" />
              <Field label="Destination ZIP / City" placeholder="20121 MI" />
              <Field label="Weight (kg)" placeholder="10" type="number" />
              <Field label="Package type" placeholder="Envelope" />
              <div className="sm:col-span-2 lg:col-span-4">
                <Button asChild className="h-11 bg-navy-deep text-cream hover:bg-navy">
                  <Link to="/rates">Get quote <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pickup" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Pickup address" placeholder="Streetline 12" />
              <Field label="Date" placeholder="Tomorrow" type="date" />
              <Field label="Window" placeholder="09:00 — 12:00" />
              <Field label="Contact" placeholder="Name, phone" />
              <div className="sm:col-span-2 lg:col-span-4">
                <Button asChild className="h-11 bg-navy-deep text-cream hover:bg-navy">
                  <Link to="/shipping">Schedule pickup</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input type={type} placeholder={placeholder} className="h-11" />
    </div>
  );
}

function FeaturedServices() {
  const services = [
    { icon: Plane, title: "Priority Overnight", desc: "Time-critical air freight to 190+ countries with morning delivery.", img: aircraft },
    { icon: Truck, title: "Standard Ground", desc: "Cost-efficient ground network with reliable 1–5 day transit windows.", img: delivery },
    { icon: Package, title: "Freight & Palletized", desc: "LTL and FTL freight for oversized shipments, temperature-managed if needed.", img: warehouse },
    { icon: Plane, title: "International Priority", desc: "Customs-cleared, duty-managed air freight across borders.", img: svcIntl },
    { icon: ShieldCheck, title: "Cold Chain", desc: "Temperature-controlled shipments with 24/7 sensor monitoring.", img: svcColdchain },
    { icon: Zap, title: "Same-Day Courier", desc: "City-wide same-day delivery on electric fleet, hours not days.", img: svcSameday },
    { icon: Users, title: "White-Glove", desc: "Handled by trained specialists — art, luxury, and high-value assets.", img: svcWhiteglove },
    { icon: Package, title: "E-commerce Fulfillment", desc: "Storage, pick-pack, and last-mile for online sellers.", img: svcEcommerce },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <SectionHead eyebrow="Featured services" title="Move anything, anywhere on the arc." link={{ to: "/shipping", label: "All services" }} />
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Card className="group relative h-full overflow-hidden border-border transition-shadow hover:shadow-xl">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={s.img}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <CardContent className="p-6">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-amber text-navy-deep">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy-deep">
                  Learn more <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
    { icon: Building2, title: "Enterprise", desc: "Dedicated account teams, SLAs, and network priority." },
    { icon: Zap, title: "E-commerce", desc: "Bulk label creation, returns automation, marketplace connectors." },
    { icon: ShieldCheck, title: "Healthcare & Life Sciences", desc: "Temperature-monitored, chain-of-custody critical shipments." },
    { icon: Users, title: "SMB", desc: "Flat pricing, one-click booking, no monthly minimums." },
  ];
  return (
    <section className="bg-navy-deep text-cream">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHead
          tone="light"
          eyebrow="Business solutions"
          title="Built for the way your business ships."
          link={{ to: "/business", label: "Explore solutions" }}
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-cream/10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div 
              key={it.title} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-navy-deep p-8 transition-all duration-300 hover:bg-navy hover:-translate-y-1"
            >
              <it.icon className="h-6 w-6 text-amber transition-transform duration-300 group-hover:scale-110" />
              <h3 className="mt-6 font-display text-xl">{it.title}</h3>
              <p className="mt-2 text-sm text-cream/70">{it.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoverageSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Coverage</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            220+ countries. One integrated network.
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            An interconnected web of ground fleets, regional air gateways, and last-mile
            partners — engineered for a single arc from pickup to proof of delivery.
          </p>
          <div className="mt-6 grid max-w-md grid-cols-2 gap-4 text-sm">
            <FactCard label="Air gateways" value="72" />
            <FactCard label="Ground hubs" value="1,240" />
            <FactCard label="Last-mile partners" value="3,800" />
            <FactCard label="Sensor packages" value="Real-time" />
          </div>
          <Button asChild className="mt-8 h-11 bg-navy-deep text-cream hover:bg-navy">
            <Link to="/locations">Find a location <MapPin className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
          <CoverageMap />
        </div>
      </div>
    </section>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-display text-2xl text-navy-deep">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Testimonials() {
  const items = [
    { quote: "SwiftArc replaced three carriers for us. Visibility is unreal — we know where every pallet is, always.", name: "Marta Okafor", role: "Head of Ops, Northlight Retail" },
    { quote: "The AI ETA is scary accurate. It calls out delays before they happen.", name: "Kenji Aoyama", role: "Director of Fulfillment, Toriha" },
    { quote: "Enterprise SLA at a mid-market price. The dashboard alone is worth the switch.", name: "Isabelle Rossi", role: "COO, Marché & Vine" },
  ];
  return (
    <section className="bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHead eyebrow="Customers" title="Trusted by teams that move product." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm"
            >
              <div className="flex gap-1 text-amber">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-4 font-display text-lg leading-snug">"{t.quote}"</blockquote>
              <figcaption className="mt-6 text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-muted-foreground">{t.role}</div>
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
    { tag: "Network", title: "SwiftArc opens new Frankfurt air gateway", date: "Jul 3, 2026" },
    { tag: "Product", title: "AI delivery predictions expand to freight lanes", date: "Jun 24, 2026" },
    { tag: "Sustainability", title: "80% of last-mile fleet now electric in EU", date: "Jun 12, 2026" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <SectionHead eyebrow="Newsroom" title="Latest from SwiftArc." link={{ to: "/resources", label: "All stories" }} />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {news.map((n) => (
          <article key={n.title} className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
            <span className="inline-block rounded-full bg-amber/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-navy-deep">
              {n.tag}
            </span>
            <h3 className="mt-4 font-display text-xl leading-snug">{n.title}</h3>
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{n.date}</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AppPromo() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="grid gap-10 overflow-hidden rounded-3xl bg-navy-deep p-8 text-cream sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber">
            <Smartphone className="h-3.5 w-3.5" /> Mobile app
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Ship and track from your pocket.
          </h2>
          <p className="mt-4 max-w-md text-cream/70">
            Real-time push updates, AI ETAs, one-tap redirects, and offline label
            preview. Available on iOS and Android.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex h-12 items-center gap-2 rounded-xl border border-cream/20 bg-cream/5 px-4 text-sm hover:bg-cream/10">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-cream text-navy-deep font-bold">A</div>
              Download on App Store
            </a>
            <a className="inline-flex h-12 items-center gap-2 rounded-xl border border-cream/20 bg-cream/5 px-4 text-sm hover:bg-cream/10">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-amber text-navy-deep font-bold">G</div>
              Get it on Google Play
            </a>
          </div>
        </div>
        <div className="relative">
          <img
            src={appMockup}
            alt="SwiftArc mobile app preview"
            loading="lazy"
            width={1200}
            height={1200}
            className="mx-auto max-w-[340px] rounded-2xl"
          />
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow, title, link, tone = "dark",
}: {
  eyebrow: string;
  title: string;
  link?: { to: string; label: string };
  tone?: "light" | "dark";
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className={`text-xs font-semibold uppercase tracking-widest ${tone === "light" ? "text-amber" : "text-amber"}`}>
          {eyebrow}
        </p>
        <h2 className={`mt-2 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl ${tone === "light" ? "text-cream" : ""}`}>
          {title}
        </h2>
      </div>
      {link && (
        <Link
          to={link.to}
          className={`group inline-flex items-center gap-1 text-sm font-medium ${tone === "light" ? "text-cream" : "text-navy-deep"}`}
        >
          {link.label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

// ----- NEW SECTIONS -----

import { CheckCircle2 } from "lucide-react";

function Features() {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Engineered for Modern Commerce</h2>
          <p className="mt-4 text-muted-foreground">From automated AI dispatch to deep analytics, our platform handles the complexity of global logistics so you can focus on growth.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "Real-time Visibility", desc: "Track every package down to the meter with high-fidelity GPS and status WebSockets." },
            { icon: ShieldCheck, title: "Enterprise Security", desc: "Military-grade encryption and strict access controls keep your sensitive freight data safe." },
            { icon: Sparkles, title: "AI Delivery Predictions", desc: "Our heuristic engine predicts delays before they happen by analyzing weather and facility telemetry." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <Card className="border-border h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-8 space-y-4">
                  <f.icon className="h-8 w-8 text-amber" />
                  <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-secondary/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-muted-foreground">Ship globally in three simple steps.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-border -z-10" />
          {[
            { step: "01", title: "Book a Shipment", desc: "Enter origin and destination to generate labels and customs docs instantly." },
            { step: "02", title: "Schedule Pickup", desc: "Our fleet arrives at your facility on your timeline, scanning items directly." },
            { step: "03", title: "Track & Deliver", desc: "Watch the package move in real-time until a digital signature is captured." },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center flex flex-col items-center group"
            >
              <div className="h-16 w-16 rounded-full bg-navy-deep text-cream font-display text-2xl font-bold flex items-center justify-center mb-6 ring-8 ring-background transition-transform duration-300 group-hover:scale-110">
                {s.step}
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Link to="/register">
            <Button size="lg" className="bg-amber text-navy-deep hover:bg-amber-soft">
              Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="bg-navy-deep py-20 sm:py-28 text-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Transparent, Scaleable Pricing</h2>
          <p className="mt-4 text-cream/70">No hidden fuel surcharges. No surprise residential fees. Just flat, predictable rates.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "Pay As You Go", price: "Retail", desc: "For individuals shipping occasional parcels.", features: ["Standard tracking", "Drop-off at locations", "Basic email support"] },
            { name: "Business", price: "Volume Discount", desc: "For growing e-commerce and B2B shippers.", features: ["Scheduled pickups", "API integrations", "Dedicated account rep", "Net 30 terms"], highlight: true },
            { name: "Enterprise", price: "Custom", desc: "For high-volume, multi-national supply chains.", features: ["Custom SLAs", "Cold-chain monitoring", "White-glove delivery", "Full ERP sync"] },
          ].map((p, i) => (
            <Card key={i} className={`border-border ${p.highlight ? 'bg-amber text-navy-deep scale-105' : 'bg-background/10 border-cream/20 text-cream backdrop-blur-md'}`}>
              <CardContent className="p-8">
                <h3 className="font-display text-2xl font-bold mb-2">{p.name}</h3>
                <div className="text-lg font-semibold mb-4 opacity-80">{p.price}</div>
                <p className="mb-6 opacity-80">{p.desc}</p>
                <ul className="space-y-3 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button className={`w-full ${p.highlight ? 'bg-navy-deep text-cream hover:bg-navy' : 'bg-cream text-navy-deep hover:bg-cream/90'}`}>
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
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>How accurate is the AI Delivery Prediction?</AccordionTrigger>
            <AccordionContent>Our prediction engine factors in weather, facility delays, and historical data, typically achieving a 98% accuracy rate for ETA windows.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Can I integrate SwiftArc into my Shopify store?</AccordionTrigger>
            <AccordionContent>Yes! We offer a full REST API and native plugins for major platforms like Shopify, Magento, and WooCommerce.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>What happens if my package is lost?</AccordionTrigger>
            <AccordionContent>All Business and Enterprise shipments include base insurance up to $100, with optional supplemental coverage up to $1,000,000 for high-value items.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
