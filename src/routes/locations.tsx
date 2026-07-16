import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { MapPin, Clock, Phone, Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { CoverageMap } from "@/components/home/CoverageMap";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Locations — SwiftArc" },
      { name: "description", content: "Find SwiftArc drop-off points, service centers, and air gateways worldwide." },
      { property: "og:title", content: "Locations — SwiftArc" },
      { property: "og:description", content: "Global network of drop-off points and service centers." },
      { property: "og:url", content: "/locations" },
    ],
    links: [{ rel: "canonical", href: "/locations" }],
  }),
  component: Locations,
});

type Type = "Air Gateway" | "Distribution" | "Sort Center" | "Drop-off";

const centers: Array<{ name: string; type: Type; addr: string; hours: string; phone: string; open: boolean }> = [
  { name: "Rotterdam Origin Hub", type: "Air Gateway", addr: "Waalhaven Z.z. 32, Rotterdam", hours: "24 / 7", phone: "+31 10 555 0100", open: true },
  { name: "Milan Distribution Hub", type: "Distribution", addr: "Via Ripamonti 200, Milan", hours: "Mon–Sat · 06:00–22:00", phone: "+39 02 555 0110", open: true },
  { name: "Frankfurt Air Gateway", type: "Air Gateway", addr: "Cargo City Süd, Frankfurt Airport", hours: "24 / 7", phone: "+49 69 555 0120", open: true },
  { name: "Austin Origin Hub", type: "Sort Center", addr: "5000 Burnet Rd, Austin, TX", hours: "Mon–Fri · 05:00–23:00", phone: "+1 512 555 0130", open: true },
  { name: "Singapore Gateway", type: "Air Gateway", addr: "Airfreight Rd, Changi", hours: "24 / 7", phone: "+65 6555 0140", open: true },
  { name: "Denver Distribution", type: "Distribution", addr: "7500 E 41st Ave, Denver, CO", hours: "Mon–Sun · 07:00–21:00", phone: "+1 303 555 0150", open: true },
  { name: "Camden Drop-off", type: "Drop-off", addr: "220 Camden High St, London", hours: "Mon–Sat · 08:00–20:00", phone: "+44 20 5555 0160", open: false },
  { name: "Shibuya Drop-off", type: "Drop-off", addr: "1-2 Dogenzaka, Tokyo", hours: "Mon–Sun · 09:00–21:00", phone: "+81 3 5555 0170", open: true },
];

const types: Array<Type | "All"> = ["All", "Air Gateway", "Distribution", "Sort Center", "Drop-off"];

function Locations() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<Type | "All">("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return centers.filter((c) => {
      const okType = type === "All" || c.type === type;
      const okQ = !needle || (c.name + " " + c.addr).toLowerCase().includes(needle);
      return okType && okQ;
    });
  }, [q, type]);

  return (
    <>
      <PageHero
        eyebrow="Global Network"
        title="Drop off, pick up, or consult with an expert."
        subtitle="With over 12,000 retail points and 400 hubs globally, you're never far from a SwiftArc location."
        imageSrc="/images/hero_locations_1784188720208.png"
      >
        <div className="flex max-w-lg gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md bg-cream px-3 text-navy-deep">
            <Search className="h-4 w-4 text-navy-deep/60" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ZIP, city, or landmark"
              className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border">
          <CoverageMap />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Nearby facilities</h2>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`h-9 rounded-full border px-4 text-xs font-semibold uppercase tracking-widest transition-colors ${
                  type === t
                    ? "border-navy-deep bg-navy-deep text-cream"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
            No locations match those filters. Try widening the type or clearing the search.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-amber/50 hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full bg-amber/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-navy-deep">
                    {c.type}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest ${c.open ? "text-success" : "text-muted-foreground"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${c.open ? "bg-success" : "bg-muted-foreground"}`} />
                    {c.open ? "Open now" : "Closed"}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg group-hover:text-amber transition-colors">{c.name}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber" />{c.addr}</li>
                  <li className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber" />{c.hours}</li>
                  <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber" />{c.phone}</li>
                </ul>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
