import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { PackageSearch, Bell, ShieldCheck, Zap, ArrowRight, XCircle, Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getShipment, sampleTrackingIds, statusLabels } from "@/lib/mock-shipments";
import type { Shipment } from "@/lib/mock-shipments";
import { resolveTracking } from "@/lib/api.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/tracking/")({
  head: () => ({
    meta: [
      { title: "Track a Shipment — SwiftArc" },
      { name: "description", content: "Enter one or many SwiftArc tracking numbers for real-time status, AI ETA, and delivery details." },
      { property: "og:title", content: "Track a Shipment — SwiftArc" },
      { property: "og:description", content: "Real-time visibility, AI ETA, and proof of delivery." },
      { property: "og:url", content: "/tracking" },
    ],
    links: [{ rel: "canonical", href: "/tracking" }],
  }),
  component: TrackingLanding,
});

function TrackingLanding() {
  const [ids, setIds] = useState("");
  const [results, setResults] = useState<Array<{ id: string; shipment?: Shipment }>>([]);
  const navigate = useNavigate();

  const lookupFn = useServerFn(resolveTracking);

  const runLookup = async (raw: string) => {
    const parsed = raw
      .split(/[\s,\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length === 0) return;
    if (parsed.length === 1) {
      navigate({ to: "/tracking/$trackingId", params: { trackingId: parsed[0] } });
      return;
    }
    
    const results = await Promise.all(parsed.map(async (id) => {
      try {
        const res = await lookupFn({ data: { trackingNumber: id } });
        if (res.kind === "db") {
          return { id, shipment: { ...res.shipment, origin: res.shipment.origin as any, destination: res.shipment.destination as any } };
        } else if (res.kind === "mock") {
          return { id, shipment: getShipment(id) };
        }
      } catch (e) {}
      return { id };
    }));
    setResults(results as any);
  };

  return (
    <div className="bg-card min-h-screen">
      <PageHero
        eyebrow="Tracking"
        title="Every parcel, in real time."
        subtitle="Track one shipment or paste up to 30 numbers at once. Live status, animated timeline, live map, AI delivery predictions, and digital proof of delivery."
        imageSrc="/images/hero_tracking_1784191931246.png"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); runLookup(ids); }}
          className="mt-8 rounded-2xl border border-cream/10 bg-cream/5 p-3 backdrop-blur max-w-3xl"
        >
          <div className="rounded-xl bg-cream p-3 text-navy-deep">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-deep/5">
                <Search className="h-5 w-5 text-navy" />
              </div>
              <div className="flex-1">
                <textarea
                  value={ids}
                  onChange={(e) => setIds(e.target.value)}
                  placeholder="Enter tracking number(s)..."
                  rows={2}
                  className="w-full resize-none border-none bg-transparent p-0 text-base outline-none focus:ring-0 placeholder:text-muted-foreground"
                />
              </div>
              <Button type="submit" disabled={!ids.trim()} size="lg" className="h-12 shrink-0 self-end bg-amber text-navy-deep hover:bg-amber/90">
                Track
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-cream/60">
          <span>Sample numbers:</span>
          {sampleTrackingIds.map((sid) => (
            <Link key={sid} to="/tracking/$trackingId" params={{ trackingId: sid }} className="font-mono text-amber hover:underline">
              {sid}
            </Link>
          ))}
        </div>
      </PageHero>
      <div className="bg-navy-deep text-cream -mt-px pt-4">
        {results.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl">Results — {results.length} shipments</h2>
            <div className="mt-4 grid gap-3">
              {results.map((r, i) => (
                <motion.div
                  key={r.id + i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {r.shipment ? (
                    <Link
                      to="/tracking/$trackingId"
                      params={{ trackingId: r.shipment.trackingNumber }}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-cream/10 bg-cream/5 p-4 transition-colors hover:bg-cream/10"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-amber text-navy-deep">
                        <PackageSearch className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono text-sm text-amber">{r.shipment.trackingNumber}</p>
                        <p className="truncate font-display text-base">
                          {r.shipment.origin.city} → {r.shipment.destination.city}
                        </p>
                        <p className="text-xs text-cream/60">
                          {statusLabels[r.shipment.status]} · {r.shipment.service}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-cream/60" />
                    </Link>
                  ) : (
                    <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="font-mono text-sm text-cream">{r.id}</p>
                        <p className="text-xs text-cream/60">Not found on network</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { Icon: Bell, t: "Instant alerts", d: "Push, email, and SMS the moment status changes." },
            { Icon: Zap, t: "AI ETA", d: "Predictive delivery windows with delay explanations." },
            { Icon: ShieldCheck, t: "Digital proof", d: "Signature, photo, and chain-of-custody attached." },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Card className="border-cream/10 bg-cream/5 text-cream h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-amber/30">
                <CardContent className="p-6">
                  <f.Icon className="h-5 w-5 text-amber" />
                  <h3 className="mt-4 font-display text-lg">{f.t}</h3>
                  <p className="mt-1 text-sm text-cream/70">{f.d}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
