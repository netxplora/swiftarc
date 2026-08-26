/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { PackageSearch, Bell, ShieldCheck, Clock, ArrowRight, XCircle, Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { statusLabels } from "@/lib/types";
import { resolveTracking } from "@/lib/api.functions";
import { useServerFn } from "@tanstack/react-start";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/tracking/")({
  head: () => ({
    meta: [
      { title: "Track a Shipment — SwiftArc Logistics" },
      {
        name: "description",
        content:
          "Track single or multiple SwiftArc shipments in real time. Get instant status updates, milestone scans, and estimated delivery dates.",
      },
      { property: "og:title", content: "Track a Shipment — SwiftArc Logistics" },
      {
        property: "og:description",
        content: "Real-time visibility, checkpoint timelines, and proof of delivery across 220+ countries.",
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
          // lookup failed
        }
        return { id } as TrackingResult;
      }),
    );
    setResults(lookupResults);
  };

  return (
    <div className="bg-background min-h-screen">
      <PageHero
        eyebrow="Real-Time Tracking"
        title="Track Your Shipment"
        subtitle="Track one shipment or enter multiple tracking codes at once to see checkpoint scans, route progress, and estimated delivery dates."
        imageSrc={heroImg}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runLookup(ids);
          }}
          className="mt-6 rounded-2xl border border-border bg-white dark:bg-card p-2 shadow-lg max-w-3xl"
        >
          <div className="rounded-xl bg-slate-50 dark:bg-muted/40 p-3 text-foreground">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <textarea
                  value={ids}
                  onChange={(e) => setIds(e.target.value)}
                  placeholder="Enter tracking number(s), e.g. SA-7241-9032-11..."
                  rows={2}
                  className="w-full resize-none border-none bg-transparent p-0 text-base outline-none focus:ring-0 placeholder:text-muted-foreground text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={!ids.trim()}
                size="lg"
                className="h-12 shrink-0 self-end bg-primary text-white hover:bg-primary-hover font-semibold px-6 shadow-md"
              >
                Track Shipment
              </Button>
            </div>
          </div>
        </form>

        <p className="mt-3 text-xs text-muted-foreground">
          Tip: You can paste multiple tracking numbers separated by commas or spaces.
        </p>
      </PageHero>

      <div className="bg-background min-h-[50vh] pt-4 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {results.length > 0 && (
            <div className="mt-10 mb-16">
              <h2 className="font-display text-2xl font-bold mb-6 text-foreground">
                Results — {results.length} shipments found
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
                        className="group flex flex-col h-full rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/40 overflow-hidden relative"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors">
                            <PackageSearch className="h-6 w-6" />
                          </span>
                          <div
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                              r.status === "customs_hold"
                                ? "bg-red-500/10 text-red-500"
                                : "bg-emerald-500/10 text-emerald-600"
                            }`}
                          >
                            {statusLabels[r.status ?? ""] ?? r.status}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs text-muted-foreground mb-1">
                            Tracking Code
                          </p>
                          <p className="font-bold text-lg mb-3 tracking-tight font-mono text-foreground">
                            {r.trackingNumber}
                          </p>
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <span className="truncate">{r.originCity}</span>
                            <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
                            <span className="truncate">{r.destCity}</span>
                          </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-semibold">
                            {r.service}
                          </span>
                          <span className="inline-flex items-center text-xs font-semibold text-primary group-hover:underline">
                            View Full Timeline <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex flex-col h-full rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
                        <div className="flex items-start gap-4 mb-4">
                          <span className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
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
                            Shipment record not found
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 grid gap-6 sm:grid-cols-3 pb-24">
            {[
              {
                icon: Bell,
                title: "Live Milestone Updates",
                desc: "Receive real-time notifications when your package is scanned at sorting hubs and border facilities.",
              },
              {
                icon: Clock,
                title: "Accurate Delivery Schedules",
                desc: "Clear delivery timeframes based on route conditions, transit mode, and customs clearance pace.",
              },
              {
                icon: ShieldCheck,
                title: "Proof of Delivery",
                desc: "Verified recipient signature and delivery timestamp recorded upon final handover.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="h-full border-border bg-card transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-6 sm:p-8">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
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
