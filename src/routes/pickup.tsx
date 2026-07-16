import { useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, MapPin, Package, CheckCircle2, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getPickupSlots, createPickup } from "@/lib/api.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/pickup")({
  head: () => ({
    meta: [
      { title: "Schedule a pickup — SwiftArc" },
      { name: "description", content: "Request a same-day or next-day courier pickup from your address in seconds." },
      { property: "og:title", content: "Schedule a SwiftArc pickup" },
      { property: "og:description", content: "Same-day and next-day pickup slots across 60+ metros." },
    ],
  }),
  component: PickupPage,
});

function PickupPage() {
  const { signedIn } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<string>("");
  const [count, setCount] = useState(1);
  const [confirmed, setConfirmed] = useState<null | { reference: string; pickup_date: string; slot: string; package_count: number; address: string; city: string; postal_code: string }>(null);
  const [form, setForm] = useState({
    contact_name: "", company: "", address: "", city: "", postal_code: "", instructions: "",
  });

  const fetchSlots = useServerFn(getPickupSlots);
  const create = useServerFn(createPickup);

  const slots = useQuery({
    queryKey: ["pickup-slots", date],
    queryFn: () => fetchSlots({ data: { date } }),
  });

  const createMut = useMutation({
    mutationFn: () => create({ data: { ...form, pickup_date: date, slot, package_count: count } }),
    onSuccess: (row) => {
      setConfirmed(row);
      toast.success("Pickup scheduled", { description: row.reference });
      qc.invalidateQueries({ queryKey: ["pickup-slots", date] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: unknown) => toast.error((e as Error).message ?? "Could not schedule pickup"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedIn) { toast.error("Please sign in to schedule a pickup"); return; }
    if (!slot) { toast.error("Choose a pickup window"); return; }
    createMut.mutate();
  };

  return (
    <div>
      <PageHero
        eyebrow="Courier pickup"
        title="Schedule a pickup in 30 seconds."
        subtitle="Live slot availability. Same-day slots close 90 minutes before the pickup window."
        imageSrc="/images/hero_pickup_1784191942933.png"
      />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 font-display text-lg">
              <MapPin className="h-5 w-5 text-amber" /> Pickup location
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5"><Label>Contact name</Label>
                <Input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Company</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div className="sm:col-span-2 grid gap-1.5"><Label>Street address</Label>
                <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>City</Label>
                <Input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Postal code</Label>
                <Input required value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
              <div className="sm:col-span-2 grid gap-1.5"><Label>Instructions for courier</Label>
                <Textarea placeholder="Ring bell twice, reception on ground floor." value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 font-display text-lg">
              <CalendarClock className="h-5 w-5 text-amber" /> When
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Date</Label>
                <Input type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setSlot(""); }} />
              </div>
              <div className="grid gap-1.5">
                <Label>Available windows</Label>
                {slots.isLoading ? (
                  <div className="grid h-20 place-items-center rounded-md border border-border">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(slots.data ?? []).map((w) => (
                      <button
                        type="button"
                        key={w.slot}
                        disabled={!w.available}
                        onClick={() => setSlot(w.slot)}
                        className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                          slot === w.slot ? "border-navy-deep bg-navy-deep text-cream"
                            : w.available ? "border-border hover:bg-secondary"
                            : "border-border/50 bg-secondary/40 text-muted-foreground line-through"
                        }`}
                        title={w.reason ?? `${w.remaining} of ${w.capacity} slots left`}
                      >
                        <div>{w.slot}</div>
                        <div className="text-[10px] opacity-70">{w.available ? `${w.remaining} left` : w.reason}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 font-display text-lg">
              <Package className="h-5 w-5 text-amber" /> Packages
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5"><Label>Number of packages</Label>
                <Input type="number" min={1} max={99} value={count} onChange={(e) => setCount(Math.max(1, +e.target.value))} /></div>
              <div className="grid gap-1.5"><Label>Total weight (kg)</Label>
                <Input type="number" min={0.1} step={0.1} defaultValue={2.4} /></div>
              <div className="grid gap-1.5"><Label>Service</Label>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option>SwiftArc Priority</option><option>SwiftArc Express</option><option>SwiftArc Ground</option>
                </select></div>
            </div>
          </fieldset>

          <Button type="submit" size="lg" disabled={createMut.isPending || !signedIn} className="w-full bg-navy-deep text-cream hover:bg-navy">
            {createMut.isPending ? "Scheduling…" : signedIn ? "Confirm pickup" : "Sign in to schedule"}
          </Button>
        </motion.form>

        <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Summary</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Window</span><span className="font-medium">{slot || "—"}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Packages</span><span className="font-medium">{count}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Est. fee</span><span className="font-medium">Included</span></li>
            </ul>
          </div>

          {confirmed && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-success/40 bg-success/10 p-5">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Pickup confirmed</span>
              </div>
              <p className="mt-2 text-sm text-foreground/80">Confirmation reference:</p>
              <p className="font-mono text-lg font-bold">{confirmed.reference}</p>
              <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><dt>When</dt><dd>{confirmed.pickup_date} · {confirmed.slot}</dd></div>
                <div className="flex justify-between"><dt>Packages</dt><dd>{confirmed.package_count}</dd></div>
                <div className="flex justify-between"><dt>Address</dt><dd className="text-right">{confirmed.address}, {confirmed.city} {confirmed.postal_code}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">A courier will arrive during your chosen window. You'll receive an SMS 30 minutes before.</p>
            </motion.div>
          )}

          <div className="rounded-2xl border border-border bg-navy-deep p-5 text-cream">
            <div className="flex items-center gap-2 text-amber">
              <Truck className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">Live capacity</span>
            </div>
            <p className="mt-3 text-sm text-cream/80">
              {slots.data ? `${slots.data.reduce((s, w) => s + w.remaining, 0)} slots remaining today` : "Checking capacity…"}
            </p>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
