import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Building2, Zap, ShieldCheck, Users, ArrowRight, ShoppingBag, HeartPulse, Factory, Store } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Counter } from "@/components/animated/Counter";
import { ScrollReveal } from "@/components/ScrollReveal";
import warehouse from "@/assets/warehouse.jpg";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Business Solutions — SwiftArc" },
      { name: "description", content: "Enterprise logistics, e-commerce automation, healthcare cold-chain, and SMB shipping — built for the way your business ships." },
      { property: "og:title", content: "Business Solutions — SwiftArc" },
      { property: "og:description", content: "Enterprise, e-commerce, healthcare, and SMB solutions." },
      { property: "og:url", content: "/business" },
    ],
    links: [{ rel: "canonical", href: "/business" }],
  }),
  component: Business,
});

const solutions = [
  { Icon: Building2, name: "Enterprise", desc: "Dedicated account teams, priority routing, SLA guarantees, and a private lane on the SwiftArc network.", bullets: ["24/7 named support", "Custom pricing", "Volume commitments", "On-network priority"] },
  { Icon: Zap, name: "E-commerce", desc: "Turn your storefront into a shipping engine with bulk labels, returns portal, and marketplace connectors.", bullets: ["Bulk labels & manifests", "Branded tracking pages", "Returns portal", "Marketplace connectors"] },
  { Icon: ShieldCheck, name: "Healthcare & Life Sciences", desc: "Cold-chain, chain-of-custody, and time-critical service tiers validated by GDP standards.", bullets: ["Cold chain -20°C to +25°C", "GDP-validated lanes", "Chain-of-custody log", "Real-time sensor data"] },
  { Icon: Users, name: "SMB", desc: "Flat, transparent pricing. Open an account in minutes and ship the same day.", bullets: ["No monthly minimums", "One-click booking", "Instant discounts at scale", "Community support"] },
];

const industries = [
  {
    id: "retail",
    Icon: Store,
    label: "Retail",
    headline: "Restock stores in hours, not days.",
    copy: "Priority replenishment lanes and store-friendly delivery windows keep shelves full without disrupting operations.",
    metrics: [
      { v: 32, s: "%", l: "Faster restock" },
      { v: 99.6, s: "%", l: "On-time" },
      { v: 18, s: "K", l: "Stores served" },
    ],
    case: "A European fashion house cut store replenishment lead-time by a third on the SwiftArc network.",
  },
  {
    id: "healthcare",
    Icon: HeartPulse,
    label: "Healthcare",
    headline: "Cold chain, validated end to end.",
    copy: "GDP-compliant lanes, temperature and shock telemetry, and same-day recovery routes for time-critical specimens.",
    metrics: [
      { v: 100, s: "%", l: "GDP audit pass" },
      { v: 24, s: "/7", l: "Cold-chain ops" },
      { v: 6.8, s: "M", l: "Vials moved / yr" },
    ],
    case: "A vaccine manufacturer moved 6.8M vials with zero temperature excursions across 40 countries.",
  },
  {
    id: "manufacturing",
    Icon: Factory,
    label: "Manufacturing",
    headline: "JIT parts before your line stops.",
    copy: "Air-priority for critical parts, palletized freight for scheduled runs, and API-driven ETAs into your MES.",
    metrics: [
      { v: 41, s: "%", l: "Line downtime ↓" },
      { v: 2.4, s: "h", l: "Median air ETA" },
      { v: 220, s: "+", l: "Countries" },
    ],
    case: "An automotive supplier cut unplanned downtime 41% by wiring SwiftArc AI ETAs into their MES.",
  },
  {
    id: "ecommerce",
    Icon: ShoppingBag,
    label: "E-commerce",
    headline: "Delight buyers, own the returns loop.",
    copy: "Branded tracking pages, returns portal, and connectors for Shopify, WooCommerce, and marketplaces.",
    metrics: [
      { v: 4.9, s: "★", l: "Buyer NPS lift" },
      { v: 62, s: "%", l: "Faster returns" },
      { v: 12, s: "min", l: "To first label" },
    ],
    case: "A DTC beauty brand ships 40K parcels a week on SwiftArc with a 4.9★ post-purchase rating.",
  },
];

const integrations = ["Shopify", "SAP", "NetSuite", "Salesforce", "Odoo", "Magento", "Zapier", "Snowflake"];

function Business() {
  return (
    <>
      <PageHero
        eyebrow="Business Logistics"
        title="Built for the way you ship."
        subtitle="From local boutiques to global enterprises, SwiftArc provides the lanes, software, and priority handling to scale your operations."
        imageSrc="/images/hero_business_1784188675121.png"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {solutions.map((s, i) => (
            <ScrollReveal key={s.name} delay={i * 0.05}>
              <Card className="h-full border-border">
                <CardContent className="p-8">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-deep text-amber">
                    <s.Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl">{s.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" /> {b}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="link" className="mt-4 px-0 text-navy-deep">
                    <Link to="/contact">Talk to sales <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber">By industry</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Purpose-built lanes for your industry.
            </h2>
          </div>

          <Tabs defaultValue="retail" className="mt-10">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              {industries.map((it) => (
                <TabsTrigger
                  key={it.id}
                  value={it.id}
                  className="gap-2 rounded-full border border-border bg-card px-4 py-2 data-[state=active]:bg-navy-deep data-[state=active]:text-cream"
                >
                  <it.Icon className="h-4 w-4" /> {it.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {industries.map((it) => (
              <TabsContent key={it.id} value={it.id} className="mt-8">
                <div className="grid gap-8 rounded-2xl border border-border bg-card p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <h3 className="font-display text-3xl font-bold tracking-tight">{it.headline}</h3>
                    <p className="mt-3 max-w-xl text-muted-foreground">{it.copy}</p>
                    <div className="mt-8 grid grid-cols-3 gap-4">
                      {it.metrics.map((m) => (
                        <div key={m.l}>
                          <div className="font-display text-3xl font-bold text-navy-deep">
                            <Counter to={m.v} />{m.s}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{m.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-navy-deep p-6 text-cream">
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber">Customer case</p>
                    <p className="mt-3 font-display text-xl leading-snug">{it.case}</p>
                    <Button asChild variant="link" className="mt-4 px-0 text-amber">
                      <Link to="/contact">Read the full story <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Integrations</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Plugs into the tools you already run on.
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {integrations.map((i, idx) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="grid h-16 place-items-center rounded-xl border border-border bg-card font-display text-lg text-navy-deep transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-amber hover:text-amber cursor-default"
            >
              {i}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-navy-deep text-cream">
        <img src={warehouse} alt="" width={1600} height={1024} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <h2 className="max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to move your logistics onto the arc?
          </h2>
          <p className="mt-4 max-w-xl text-cream/70">
            Our team designs custom lane strategies for enterprise shippers. Get a network audit and a projection in one week.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-11 bg-amber text-navy-deep hover:bg-amber-soft">
              <Link to="/contact">Contact sales</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 border-cream/30 bg-transparent text-cream hover:bg-cream/10">
              <Link to="/register">Open a business account</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
