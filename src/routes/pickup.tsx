import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock,
  MapPin,
  Package,
  CheckCircle2,
  Truck,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getPickupSlots, createPickup } from "@/lib/api.functions";
import { useAuth } from "@/hooks/use-auth";
import { FadeInSection } from "@/components/animated/FadeIn";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/pickup")({
  head: () => ({
    meta: [
      { title: "Schedule a Courier Pickup — SwiftArc Logistics" },
      {
        name: "description",
        content:
          "Request a scheduled courier package collection from your residential or commercial address. Choose available time slots and track pickup status.",
      },
      { property: "og:title", content: "Schedule a Courier Pickup — SwiftArc" },
      {
        property: "og:description",
        content: "Book a same-day or next-day courier collection directly from your doorstep.",
      },
      {
        name: "keywords",
        content: "schedule courier pickup, package collection, doorstep pickup, parcel dispatch",
      },
    ],
    links: [{ rel: "canonical", href: "/pickup" }],
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
  const [confirmed, setConfirmed] = useState<null | {
    reference: string;
    pickup_date: string;
    slot: string;
    package_count: number;
    address: string;
    city: string;
    postal_code: string;
  }>(null);
  const [form, setForm] = useState({
    contact_name: "",
    company: "",
    address: "",
    city: "",
    postal_code: "",
    instructions: "",
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
      toast.success("Pickup scheduled successfully", {
        description: `Reference: ${row.reference}`,
      });
      qc.invalidateQueries({ queryKey: ["pickup-slots", date] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: unknown) => toast.error((e as Error).message ?? "Could not schedule pickup"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedIn) {
      toast.error("Please sign in to schedule a pickup");
      return;
    }
    if (!slot) {
      toast.error("Please select an available pickup time window");
      return;
    }
    createMut.mutate();
  };

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      {/* ── Premium Glassmorphic Hero ── */}
      <section
        className="relative min-h-[58vh] flex items-center overflow-hidden pt-12 pb-16 border-b border-slate-100"
        style={{ background: "linear-gradient(145deg, #f0f6ff 0%, #ffffff 55%, #f5f0ff 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#032D60 1.2px, transparent 1.2px)",
            backgroundSize: "26px 26px",
          }}
          aria-hidden
        />
        <div className="absolute -top-20 right-0 w-[480px] h-[480px] rounded-full bg-primary/[0.06] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-[380px] h-[380px] rounded-full bg-sky-400/[0.06] blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm">
                  <Truck className="h-3 w-3" />
                  On-Demand Logistics Collection
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#032D60] leading-[1.1]"
              >
                Schedule a Courier{" "}
                <span className="relative">
                  <span className="text-primary">Doorstep Pickup</span>
                  <motion.span
                    className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary/40"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, delay: 0.8 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed"
              >
                Book a local driver to collect parcels, pallets, or commercial packages directly
                from your warehouse, office, or residence.
              </motion.p>
            </div>

            <div className="hidden lg:col-span-5 lg:block">
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.2 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/25 backdrop-blur-md p-2 shadow-2xl shadow-[#032D60]/12">
                  <img
                    src={heroImg}
                    alt="SwiftArc Courier Pickup Service"
                    className="w-full h-72 sm:h-80 rounded-2xl object-cover"
                  />
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-tr from-primary/8 via-transparent to-transparent pointer-events-none" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Form & Sidebar ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Form */}
          <div className="lg:col-span-8">
            <FadeInSection
              direction="left"
              className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-10 shadow-xl shadow-[#032D60]/5"
            >
              <form onSubmit={submit} className="space-y-10">
                {/* Address Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h2 className="font-display font-bold text-[#032D60] text-xl">
                      Collection Location
                    </h2>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Contact Name *
                      </Label>
                      <Input
                        required
                        value={form.contact_name}
                        onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:border-primary/40 focus:ring-primary/20 shadow-sm"
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Company (Optional)
                      </Label>
                      <Input
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:border-primary/40 focus:ring-primary/20 shadow-sm"
                        placeholder="Company name"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Street Address *
                      </Label>
                      <Input
                        required
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:border-primary/40 focus:ring-primary/20 shadow-sm"
                        placeholder="Building, street name, apartment or suite"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        City *
                      </Label>
                      <Input
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:border-primary/40 focus:ring-primary/20 shadow-sm"
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Postal Code *
                      </Label>
                      <Input
                        required
                        value={form.postal_code}
                        onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:border-primary/40 focus:ring-primary/20 shadow-sm"
                        placeholder="Postal code"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Driver Instructions (Optional)
                      </Label>
                      <Textarea
                        placeholder="e.g. Ring reception bell on arrival, ground floor dispatch bay..."
                        value={form.instructions}
                        onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                        className="bg-slate-50 border-slate-200 rounded-xl focus:border-primary/40 focus:ring-primary/20 shadow-sm text-sm"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Timing & Windows */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <h2 className="font-display font-bold text-[#032D60] text-xl">Pickup Window</h2>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Collection Date
                      </Label>
                      <Input
                        type="date"
                        min={today}
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                          setSlot("");
                        }}
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:border-primary/40 shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Available Time Slots
                      </Label>
                      {slots.isLoading ? (
                        <div className="grid h-24 place-items-center rounded-xl border border-slate-100 bg-slate-50/50">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {(slots.data ?? []).map((w) => (
                            <button
                              type="button"
                              key={w.slot}
                              disabled={!w.available}
                              onClick={() => setSlot(w.slot)}
                              className={`rounded-xl border p-3 text-xs font-bold transition-all duration-300 ${
                                slot === w.slot
                                  ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                                  : w.available
                                    ? "border-slate-200 bg-slate-50 hover:bg-primary/5 hover:border-primary/30 text-slate-600"
                                    : "border-slate-100 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed"
                              }`}
                            >
                              <div className="mb-0.5">{w.slot}</div>
                              <div className="text-[10px] font-semibold opacity-80 uppercase tracking-widest">
                                {w.available ? `${w.remaining} slots open` : "Full"}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Package Count */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>
                    <h2 className="font-display font-bold text-[#032D60] text-xl">
                      Package Information
                    </h2>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Number of Packages
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={count}
                        onChange={(e) => setCount(Math.max(1, +e.target.value))}
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:border-primary/40 shadow-sm font-mono text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Estimated Total Weight (kg)
                      </Label>
                      <Input
                        type="number"
                        min={0.1}
                        step={0.1}
                        defaultValue={3.5}
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:border-primary/40 shadow-sm font-mono text-lg"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={createMut.isPending || !signedIn}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all text-[15px]"
                >
                  {createMut.isPending
                    ? "Booking Collection Slot…"
                    : signedIn
                      ? "Confirm Pickup Request"
                      : "Sign In to Book Pickup"}
                </Button>
              </form>
            </FadeInSection>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <FadeInSection direction="right">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-[#032D60]/5">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-5">
                  Booking Overview
                </h3>
                <dl className="space-y-3.5 text-[13px]">
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <dt className="text-slate-500 font-medium">Pickup Date</dt>
                    <dd className="font-bold text-[#032D60]">
                      {new Date(date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <dt className="text-slate-500 font-medium">Selected Window</dt>
                    <dd className="font-bold text-[#032D60]">{slot || "Not selected"}</dd>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <dt className="text-slate-500 font-medium">Total Parcels</dt>
                    <dd className="font-bold text-[#032D60]">{count}</dd>
                  </div>
                  <div className="flex justify-between pt-1">
                    <dt className="text-slate-500 font-medium">Collection Fee</dt>
                    <dd className="font-bold text-emerald-600">Standard Service</dd>
                  </div>
                </dl>
              </div>
            </FadeInSection>

            {confirmed && (
              <FadeInSection direction="up">
                <div className="rounded-2xl border-2 border-emerald-500/20 bg-emerald-50/50 p-6 space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" />
                    Pickup Booking Confirmed
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-emerald-600/70">
                      Booking Reference:
                    </p>
                    <p className="font-mono text-2xl font-extrabold text-emerald-800">
                      {confirmed.reference}
                    </p>
                  </div>
                  <p className="text-xs text-emerald-700/80 leading-relaxed pt-3 border-t border-emerald-500/10">
                    Our dispatch driver will arrive during your designated time window. Please
                    ensure packages are securely packaged.
                  </p>
                </div>
              </FadeInSection>
            )}

            <FadeInSection direction="up" delay={0.2}>
              <div
                className="rounded-2xl p-7 text-white shadow-xl shadow-[#032D60]/20"
                style={{ backgroundColor: "#032D60" }}
              >
                <div className="flex items-center gap-2.5 text-primary font-bold text-xs uppercase tracking-widest mb-3">
                  <Truck className="h-4 w-4" />
                  Fleet Availability
                </div>
                <p className="text-sm text-white/80 leading-relaxed font-medium">
                  {slots.data
                    ? `${slots.data.reduce((s, w) => s + w.remaining, 0)} collection windows available in your area today.`
                    : "Retrieving route capacity…"}
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>
    </div>
  );
}
