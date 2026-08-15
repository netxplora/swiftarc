/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { PackageSearch, Bell, ShieldCheck, Zap, ArrowRight, XCircle, Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { statusLabels } from "@/lib/types";
import { resolveTracking } from "@/lib/api.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/tracking/")({
  head: () => ({
    meta: [
      { title: "Track a Shipment — SwiftArc" },
      {
        name: "description",
        content:
          "Enter one or many SwiftArc tracking numbers for real-time status, AI ETA, and delivery details.",
      },
      { property: "og:title", content: "Track a Shipment — SwiftArc" },
      {
        property: "og:description",
        content: "Real-time visibility, AI ETA, and proof of delivery.",
      },
      { property: "og:url", content: "/tracking" },
    ],
    links: [{ rel: "canonical", href: "/tracking" }],
  }),
  component: TrackingLanding,
});

interface TrackingResult {
  id: string;
  trackingNumber?: string;
  originCity?: string;
  destCity?: string;
  status?: string;
  service?: string;
}

function TrackingLanding() {
  const [ids, setIds] = useState("");
  const [results, setResults] = useState<TrackingResult[]>([]);
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

    const lookupResults = await Promise.all(
      parsed.map(async (id) => {
        try {
          const res = await lookupFn({ data: { trackingNumber: id } });
          if (res.kind === "db") {
            const s = res.shipment as any;
            return {
              id,
              trackingNumber: s.trackingNumber,
              originCity: s.origin?.city ?? "",
              destCity: s.destination?.city ?? "",
              status: s.status,
              service: s.service,
            };
          }
        } catch {
          // lookup failed – return partial result below
        }
        return { id } as TrackingResult;
      }),
    );
    setResults(lookupResults);
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
          onSubmit={(e) => {
            e.preventDefault();
            runLookup(ids);
          }}
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
              <Button
                type="submit"
                disabled={!ids.trim()}
                size="lg"
                className="h-12 shrink-0 self-end bg-amber text-navy-deep hover:bg-amber/90"
              >
                Track
              </Button>
            </div>
          </div>
        </form>

        <p className="mt-4 text-xs text-cream/60">
          Enter a SwiftArc tracking number (e.g. SA followed by 10 digits) to get started.
        </p>
      </PageHero>
      <div className="bg-background min-h-screen -mt-px pt-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-amber/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {results.length > 0 && (
            <div className="mt-10 mb-16">
              <h2 className="font-display text-2xl font-bold mb-6">
                Results — {results.length} shipments
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((r, i) => (
                  <motion.div
                    key={r.id + i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, ease: "easeOut" }}
                  >
                    {r.trackingNumber ? (
                      <Link
                        to="/tracking/$trackingId"
                        params={{ trackingId: r.trackingNumber }}
                        className="group flex flex-col h-full rounded-[1.5rem] border border-border/60 bg-card/50 backdrop-blur-md p-5 transition-all hover:bg-card hover:shadow-xl hover:border-amber/40 overflow-hidden relative"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber/0 group-hover:bg-amber transition-colors" />
                        <div className="flex items-start justify-between mb-4">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber/10 text-amber group-hover:bg-amber group-hover:text-navy-deep transition-colors">
                            <PackageSearch className="h-5 w-5" />
                          </span>
                          <div
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                              r.status === "customs_hold"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-success/10 text-success"
                            }`}
                          >
                            {statusLabels[r.status ?? ""] ?? r.status}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs text-muted-foreground mb-1">
                            Tracking ID
                          </p>
                          <p className="font-bold text-lg mb-3 tracking-tight">
                            {r.trackingNumber}
                          </p>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="truncate">{r.originCity}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{r.destCity}</span>
                          </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-semibold">
                            {r.service}
                          </span>
                          <ArrowRight className="h-4 w-4 text-foreground/40 group-hover:text-amber transition-colors group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ) : (
                      <div className="flex flex-col h-full rounded-[1.5rem] border border-destructive/20 bg-destructive/5 backdrop-blur-md p-5">
                        <div className="flex items-start gap-4 mb-4">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                            <XCircle className="h-5 w-5" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs text-muted-foreground mb-1">
                            Tracking ID
                          </p>
                          <p className="font-bold text-lg mb-1 tracking-tight text-foreground/60">
                            {r.id}
                          </p>
                          <p className="text-sm text-destructive font-medium">
                            Not found on network
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 grid gap-6 sm:grid-cols-3 pb-24">
            {[
              {
                Icon: Bell,
                t: "Instant alerts",
                d: "Push, email, and SMS the moment status changes.",
              },
              {
                Icon: Zap,
                t: "ETA Estimates",
                d: "Calculated delivery windows with delay reason details.",
              },
              {
                Icon: ShieldCheck,
                t: "Digital proof",
                d: "Signature, photo, and chain-of-custody attached.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <Card className="h-full rounded-[1.5rem] border-border/60 bg-card/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-card">
                  <CardContent className="p-8">
                    <div className="h-12 w-12 rounded-2xl bg-amber/10 flex items-center justify-center mb-6">
                      <f.Icon className="h-6 w-6 text-amber" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">{f.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
