import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useReducer, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2, Package, ShieldCheck, Signature, Zap, Truck, Plane, Boxes } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listAddresses, bookShipment } from "@/lib/api.functions";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Book a shipment — SwiftArc" },
      { name: "description", content: "Book air, express, ground, or freight shipments across 220+ countries with real-time tracking." },
      { property: "og:title", content: "Book a shipment — SwiftArc" },
      { property: "og:description", content: "Book, quote, and dispatch in a single flow." },
    ],
  }),
  component: Shipping,
});

const SERVICES = [
  { id: "Priority Overnight", eta: "Next morning", Icon: Plane, from: 89 },
  { id: "Express", eta: "1–2 days", Icon: Zap, from: 49 },
  { id: "Standard Ground", eta: "1–5 days", Icon: Truck, from: 19 },
  { id: "Freight LTL", eta: "2–7 days", Icon: Boxes, from: 149 },
] as const;

type Service = typeof SERVICES[number]["id"];
type Addr = {
  contact_name: string; company?: string | null; phone?: string | null; email?: string | null;
  line1: string; line2?: string | null; city: string; region?: string | null; postal_code: string; country_code: string;
};
type Pkg = { weight_kg: number; length_cm?: number; width_cm?: number; height_cm?: number; pieces: number; description?: string };
type Wizard = {
  step: 0 | 1 | 2 | 3;
  origin: Addr; destination: Addr; package: Pkg;
  service: Service; declared_value: number; insurance: boolean; signature_required: boolean; notes: string;
};

const emptyAddr: Addr = { contact_name: "", line1: "", city: "", postal_code: "", country_code: "US" };
const initial: Wizard = {
  step: 0, origin: emptyAddr, destination: emptyAddr,
  package: { weight_kg: 1, pieces: 1 },
  service: "Express", declared_value: 0, insurance: false, signature_required: false, notes: "",
};

type Action =
  | { type: "set"; patch: Partial<Wizard> }
  | { type: "origin"; patch: Partial<Addr> }
  | { type: "destination"; patch: Partial<Addr> }
  | { type: "package"; patch: Partial<Pkg> }
  | { type: "step"; step: Wizard["step"] };

function reducer(s: Wizard, a: Action): Wizard {
  switch (a.type) {
    case "set": return { ...s, ...a.patch };
    case "origin": return { ...s, origin: { ...s.origin, ...a.patch } };
    case "destination": return { ...s, destination: { ...s.destination, ...a.patch } };
    case "package": return { ...s, package: { ...s.package, ...a.patch } };
    case "step": return { ...s, step: a.step };
  }
}

function Shipping() {
  const { user } = useAuth();
  if (!user) return <SignedOutView />;
  return <Wizard />;
}

function SignedOutView() {
  return (
    <>
      <PageHero 
        eyebrow="Shipping" 
        title="Book, quote, and dispatch — in one flow." 
        subtitle="Create labels, schedule pickups, and manage customs documentation from our streamlined portal."
        imageSrc="/images/hero_shipping_1784188694176.png"
      />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
        >
          <p className="font-display text-2xl">Ready to ship?</p>
          <p className="mt-2 text-muted-foreground">Create an account to save addresses, book shipments, and manage invoices.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="bg-navy-deep text-cream hover:bg-navy"><Link to="/register">Create account</Link></Button>
            <Button asChild variant="outline"><Link to="/login">Sign in</Link></Button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
            {SERVICES.map(({ id, eta, Icon }, i) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="group rounded-xl border border-border p-4 transition-all duration-300 hover:border-amber/50 hover:shadow-md hover:-translate-y-0.5"
              >
                <Icon className="h-5 w-5 text-amber transition-transform duration-300 group-hover:scale-110" />
                <p className="mt-2 text-sm font-semibold">{id}</p>
                <p className="text-xs text-muted-foreground">{eta}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

function Wizard() {
  const nav = useNavigate();
  const [s, dispatch] = useReducer(reducer, initial);
  const fetchAddresses = useServerFn(listAddresses);
  const doBook = useServerFn(bookShipment);
  const { data: addresses } = useQuery({ queryKey: ["addresses"], queryFn: () => fetchAddresses() });

  const book = useMutation({
    mutationFn: () => doBook({ data: {
      service: s.service, origin: s.origin, destination: s.destination,
      package: s.package, declared_value: s.declared_value,
      insurance: s.insurance, signature_required: s.signature_required, notes: s.notes || undefined,
    } as any }),
    onSuccess: (res) => {
      toast.success(`Shipment booked · ${res.trackingNumber}`);
      nav({ to: "/tracking/$trackingId", params: { trackingId: res.trackingNumber } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Booking failed"),
  });

  const stepOk = useMemo(() => {
    const okAddr = (a: Addr) => a.contact_name && a.line1 && a.city && a.postal_code && a.country_code && a.country_code.length === 2;
    if (s.step === 0) return !!(okAddr(s.origin) && okAddr(s.destination));
    if (s.step === 1) return s.package.weight_kg > 0 && s.package.pieces >= 1;
    if (s.step === 2) return !!s.service;
    return true;
  }, [s]);

  const rate = useMemo(() => {
    const svc = SERVICES.find((x) => x.id === s.service)!;
    const wt = Math.max(1, s.package.weight_kg);
    const pieces = Math.max(1, s.package.pieces);
    const base = svc.from;
    const weightFee = wt * (s.service === "Freight LTL" ? 2 : s.service === "Standard Ground" ? 3 : 6);
    const piecesFee = (pieces - 1) * (s.service === "Freight LTL" ? 40 : 12);
    const insurance = s.insurance ? Math.max(6, s.declared_value * 0.008) : 0;
    const signature = s.signature_required ? 4 : 0;
    return { base, weightFee, piecesFee, insurance, signature, total: base + weightFee + piecesFee + insurance + signature };
  }, [s]);

  return (
    <>
      <PageHero 
        eyebrow="Book a shipment" 
        title="Ship anywhere in four steps." 
        imageSrc="/images/hero_shipping_1784188694176.png"
        subtitle="Address → Package → Service → Review. Real tracking numbers, real timeline events." 
      />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div>
          <ol className="mb-6 grid grid-cols-4 gap-2">
            {["Addresses", "Package", "Service", "Review"].map((label, i) => (
              <li key={label} className={`rounded-full border px-3 py-2 text-center text-xs font-medium ${i === s.step ? "border-navy-deep bg-navy-deep text-cream" : i < s.step ? "border-amber bg-amber/10 text-navy-deep" : "border-border bg-card text-muted-foreground"}`}>
                {i + 1}. {label}
              </li>
            ))}
          </ol>

          <motion.div key={s.step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            {s.step === 0 && <StepAddresses s={s} dispatch={dispatch} addresses={addresses ?? []} />}
            {s.step === 1 && <StepPackage s={s} dispatch={dispatch} />}
            {s.step === 2 && <StepService s={s} dispatch={dispatch} rate={rate} />}
            {s.step === 3 && <StepReview s={s} rate={rate} />}
          </motion.div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" disabled={s.step === 0 || book.isPending} onClick={() => dispatch({ type: "step", step: Math.max(0, s.step - 1) as Wizard["step"] })}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {s.step < 3 ? (
              <Button disabled={!stepOk} onClick={() => dispatch({ type: "step", step: (s.step + 1) as Wizard["step"] })} className="bg-navy-deep text-cream hover:bg-navy">
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={book.isPending} onClick={() => book.mutate()} className="bg-amber text-navy-deep hover:bg-amber-soft">
                {book.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />} Book shipment
              </Button>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24 lg:h-fit">
          <h3 className="font-display text-lg">Summary</h3>
          <p className="mt-1 text-xs text-muted-foreground">Live estimate — final rate at booking.</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row k="Origin" v={s.origin.city ? `${s.origin.city}, ${s.origin.country_code}` : "—"} />
            <Row k="Destination" v={s.destination.city ? `${s.destination.city}, ${s.destination.country_code}` : "—"} />
            <Row k="Weight" v={`${s.package.weight_kg} kg × ${s.package.pieces}`} />
            <Row k="Service" v={s.service} />
          </dl>
          <div className="mt-4 border-t border-border pt-4 space-y-1 text-sm">
            <Row k="Base" v={fmt(rate.base)} />
            <Row k="Weight fee" v={fmt(rate.weightFee)} />
            <Row k="Pieces fee" v={fmt(rate.piecesFee)} />
            {rate.insurance > 0 && <Row k="Insurance" v={fmt(rate.insurance)} />}
            {rate.signature > 0 && <Row k="Signature" v={fmt(rate.signature)} />}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-display text-lg">
              <span>Total</span><span>{fmt(rate.total)}</span>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between gap-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
}

function AddressForm({ role, value, onChange, addresses }: { role: "origin" | "destination"; value: Addr; onChange: (patch: Partial<Addr>) => void; addresses: any[] }) {
  const defaultId = role === "origin" ? "is_default_sender" : "is_default_recipient";
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg">{role === "origin" ? "Sender" : "Recipient"}</h3>
        {addresses.length > 0 && (
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            onChange={(e) => {
              const a = addresses.find((x) => x.id === e.target.value);
              if (a) onChange({
                contact_name: a.contact_name, company: a.company, phone: a.phone, email: a.email,
                line1: a.line1, line2: a.line2, city: a.city, region: a.region,
                postal_code: a.postal_code, country_code: a.country_code,
              });
            }}
            defaultValue=""
          >
            <option value="" disabled>Load from address book…</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>{a.label} — {a.city} {a[defaultId] ? "★" : ""}</option>
            ))}
          </select>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FF label="Contact name" v={value.contact_name} on={(x) => onChange({ contact_name: x })} required />
        <FF label="Company" v={value.company ?? ""} on={(x) => onChange({ company: x })} />
        <FF label="Phone" v={value.phone ?? ""} on={(x) => onChange({ phone: x })} />
        <FF label="Email" v={value.email ?? ""} on={(x) => onChange({ email: x })} type="email" />
        <FF label="Address line 1" v={value.line1} on={(x) => onChange({ line1: x })} required wide />
        <FF label="Address line 2" v={value.line2 ?? ""} on={(x) => onChange({ line2: x })} wide />
        <FF label="City" v={value.city} on={(x) => onChange({ city: x })} required />
        <FF label="Region / state" v={value.region ?? ""} on={(x) => onChange({ region: x })} />
        <FF label="Postal code" v={value.postal_code} on={(x) => onChange({ postal_code: x })} required />
        <FF label="Country (ISO-2)" v={value.country_code} on={(x) => onChange({ country_code: x.toUpperCase().slice(0,2) })} required />
      </div>
    </div>
  );
}

function StepAddresses({ s, dispatch, addresses }: { s: Wizard; dispatch: React.Dispatch<Action>; addresses: any[] }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <AddressForm role="origin" value={s.origin} onChange={(p) => dispatch({ type: "origin", patch: p })} addresses={addresses} />
      <AddressForm role="destination" value={s.destination} onChange={(p) => dispatch({ type: "destination", patch: p })} addresses={addresses} />
    </div>
  );
}

function StepPackage({ s, dispatch }: { s: Wizard; dispatch: React.Dispatch<Action> }) {
  return (
    <div>
      <h3 className="font-display text-lg">Package details</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FF label="Weight (kg)" type="number" v={String(s.package.weight_kg)} on={(x) => dispatch({ type: "package", patch: { weight_kg: Number(x) || 0 } })} required />
        <FF label="Pieces" type="number" v={String(s.package.pieces)} on={(x) => dispatch({ type: "package", patch: { pieces: Number(x) || 1 } })} required />
        <FF label="Length (cm)" type="number" v={String(s.package.length_cm ?? "")} on={(x) => dispatch({ type: "package", patch: { length_cm: Number(x) || undefined } })} />
        <FF label="Width (cm)" type="number" v={String(s.package.width_cm ?? "")} on={(x) => dispatch({ type: "package", patch: { width_cm: Number(x) || undefined } })} />
        <FF label="Height (cm)" type="number" v={String(s.package.height_cm ?? "")} on={(x) => dispatch({ type: "package", patch: { height_cm: Number(x) || undefined } })} />
        <FF label="Contents description" v={s.package.description ?? ""} on={(x) => dispatch({ type: "package", patch: { description: x } })} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <FF label="Declared value (USD)" type="number" v={String(s.declared_value)} on={(x) => dispatch({ type: "set", patch: { declared_value: Number(x) || 0 } })} />
        <div className="grid grid-cols-2 gap-3 sm:col-start-1 sm:row-start-2">
          <Toggle checked={s.insurance} onChange={(v) => dispatch({ type: "set", patch: { insurance: v } })} label="Insurance" Icon={ShieldCheck} />
          <Toggle checked={s.signature_required} onChange={(v) => dispatch({ type: "set", patch: { signature_required: v } })} label="Signature" Icon={Signature} />
        </div>
      </div>
    </div>
  );
}

function StepService({ s, dispatch, rate }: { s: Wizard; dispatch: React.Dispatch<Action>; rate: { total: number } }) {
  return (
    <div>
      <h3 className="font-display text-lg">Choose service level</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {SERVICES.map(({ id, eta, Icon, from }) => (
          <button key={id} onClick={() => dispatch({ type: "set", patch: { service: id } })}
            className={`text-left rounded-xl border p-4 transition ${s.service === id ? "border-navy-deep bg-navy-deep/5 ring-2 ring-navy-deep" : "border-border hover:bg-secondary"}`}>
            <Icon className="h-5 w-5 text-amber" />
            <p className="mt-2 font-display text-lg">{id}</p>
            <p className="text-xs text-muted-foreground">{eta} · from {fmt(from)}</p>
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-border p-4 text-sm">
        <p className="text-muted-foreground">Optional notes for the courier</p>
        <textarea className="mt-2 w-full min-h-[80px] rounded-md border border-input bg-background p-2 text-sm"
          value={s.notes} onChange={(e) => dispatch({ type: "set", patch: { notes: e.target.value } })} maxLength={500} placeholder="Leave at reception, call on arrival, etc." />
      </div>
    </div>
  );
}

function StepReview({ s, rate }: { s: Wizard; rate: any }) {
  return (
    <div>
      <h3 className="font-display text-lg">Review & confirm</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReviewBox title="Sender">
          <p className="font-semibold">{s.origin.contact_name}</p>
          <p className="text-sm text-muted-foreground">{s.origin.line1}{s.origin.line2 ? `, ${s.origin.line2}` : ""}</p>
          <p className="text-sm text-muted-foreground">{s.origin.city}, {s.origin.postal_code} · {s.origin.country_code}</p>
        </ReviewBox>
        <ReviewBox title="Recipient">
          <p className="font-semibold">{s.destination.contact_name}</p>
          <p className="text-sm text-muted-foreground">{s.destination.line1}{s.destination.line2 ? `, ${s.destination.line2}` : ""}</p>
          <p className="text-sm text-muted-foreground">{s.destination.city}, {s.destination.postal_code} · {s.destination.country_code}</p>
        </ReviewBox>
        <ReviewBox title="Package">
          <p className="text-sm">{s.package.weight_kg} kg × {s.package.pieces} piece(s)</p>
          {s.package.length_cm && <p className="text-sm text-muted-foreground">{s.package.length_cm} × {s.package.width_cm} × {s.package.height_cm} cm</p>}
          {s.package.description && <p className="text-sm text-muted-foreground">{s.package.description}</p>}
        </ReviewBox>
        <ReviewBox title="Service">
          <p className="text-sm font-semibold">{s.service}</p>
          <p className="text-sm text-muted-foreground">Insurance: {s.insurance ? "Yes" : "No"} · Signature: {s.signature_required ? "Yes" : "No"}</p>
          <p className="mt-2 font-display text-xl text-navy-deep">{fmt(rate.total)}</p>
        </ReviewBox>
      </div>
    </div>
  );
}

function ReviewBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FF({ label, v, on, required, type = "text", wide }: { label: string; v: string; on: (x: string) => void; required?: boolean; type?: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input type={type} value={v} onChange={(e) => on(e.target.value)} required={required} className="mt-1.5" />
    </div>
  );
}

function Toggle({ checked, onChange, label, Icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; Icon: any }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm ${checked ? "border-navy-deep bg-navy-deep/5" : "border-border"}`}>
      <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 text-amber" /> {label}</span>
      <span className={`h-5 w-9 rounded-full transition ${checked ? "bg-navy-deep" : "bg-muted"} relative`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}
