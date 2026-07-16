import { motion } from "motion/react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Counter } from "@/components/animated/Counter";
import aircraft from "@/assets/aircraft.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SwiftArc — Engineered Global Logistics" },
      { name: "description", content: "SwiftArc is an integrated logistics network moving priority freight across 220+ countries with real-time visibility." },
      { property: "og:title", content: "About SwiftArc" },
      { property: "og:description", content: "Our story, mission, and the people behind the arc." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <>
      <PageHero
        eyebrow="About SwiftArc"
        title="We move the world's freight on a single arc."
        subtitle="Founded on the belief that logistics should be legible: one network, one dashboard, one clear ETA for every shipment on the planet."
        imageSrc="/images/hero_about_1784188685141.png"
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber">Our mission</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Make the world's freight legible.
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                SwiftArc was built by a team of logistics engineers, air-freight operators,
                and product designers who were frustrated with fragmented tracking, hidden
                surcharges, and blind handoffs between carriers.
              </p>
              <p>
                Today we run a fully integrated network of 72 air gateways, 1,240 ground hubs,
                and 3,800 last-mile partners — with a single API and a single dashboard.
              </p>
              <p>
                Every shipment gets a real-time timeline, an AI ETA, and a proof of delivery.
                Every parcel gets an arc.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <img src={aircraft} alt="" width={1600} height={900} loading="lazy" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-navy-deep text-cream">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight">
            The arc, in numbers.
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { v: 220, s: "+", l: "Countries" },
              { v: 72, s: "", l: "Air gateways" },
              { v: 15, s: "M", l: "Daily parcels" },
              { v: 99.4, s: "%", l: "On-time delivery" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-5xl font-bold text-amber">
                  <Counter to={s.v} />{s.s}
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-cream/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber">Leadership</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">The team behind the arc.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "Ana Ferreira", r: "Chief Executive" },
            { n: "Rasmus Lind", r: "Chief Network Officer" },
            { n: "Priya Sundar", r: "Chief Product Officer" },
          ].map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-amber/50"
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-amber font-display text-xl text-navy-deep">
                {p.n.split(" ").map((s) => s[0]).join("")}
              </div>
              <h3 className="mt-4 font-display text-lg">{p.n}</h3>
              <p className="text-sm text-muted-foreground">{p.r}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
