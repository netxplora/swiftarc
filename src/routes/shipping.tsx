import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useReducer, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, Signature, Zap, Truck, Plane, Boxes } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookShipment, AddressSnapshot } from "@/lib/api.functions";
import { useAuth } from "@/hooks/use-auth";
import { LocationPicker, type LocationData } from "@/components/shipping/LocationPicker";
import { RoutePreview } from "@/components/shipping/RoutePreview";

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

/* ------------------------------------------------------------------ */
/*  Service definitions                                                */
/* ------------------------------------------------------------------ */

const SERVICES = [
  { id: "Priority Overnight", eta: "Next morning", Icon: Plane, from: 89 },
  { id: "Express", eta: "1–2 days", Icon: Zap, from: 49 },
  { id: "Standard Ground", eta: "1–5 days", Icon: Truck, from: 19 },
  { id: "Freight LTL", eta: "2–7 days", Icon: Boxes, from: 149 },
] as const;

type Service = typeof SERVICES[number]["id"];

/* ------------------------------------------------------------------ */
/*  State types and reducer                                            */
/* ------------------------------------------------------------------ */

type Pkg = { weight_kg: number; length_cm?: number; width_cm?: number; height_cm?: number; pieces: number; description?: string };

type WizardState = {
  step: 0 | 1 | 2 | 3 | 4;
  origin: LocationData;
  destination: LocationData;
  package: Pkg;
  service: Service;
  declared_value: number;
  insurance: boolean;
  signature_required: boolean;
  notes: string;
};

const emptyLocation: LocationData = {
  contact_name: "", phone: "", email: "",
  country_code: "", region: "", city: "", line1: "", postal_code: "",
  lat: null, lng: null,
};

const initial: WizardState = {
  step: 0,
  origin: emptyLocation,
  destination: emptyLocation,
  package: { weight_kg: 1, pieces: 1 },
  service: "Express",
  declared_value: 0,
  insurance: false,
  signature_required: false,
  notes: "",
};

type Action =
  | { type: "set"; patch: Partial<WizardState> }
  | { type: "origin"; patch: Partial<LocationData> }
  | { type: "destination"; patch: Partial<LocationData> }
  | { type: "package"; patch: Partial<Pkg> }
  | { type: "step"; step: WizardState["step"] };

function reducer(s: WizardState, a: Action): WizardState {
  switch (a.type) {
    case "set": return { ...s, ...a.patch };
    case "origin": return { ...s, origin: { ...s.origin, ...a.patch } };
    case "destination": return { ...s, destination: { ...s.destination, ...a.patch } };
    case "package": return { ...s, package: { ...s.package, ...a.patch } };
    case "step": return { ...s, step: a.step };
  }
}

/* ------------------------------------------------------------------ */
/*  Root component                                                     */
/* ------------------------------------------------------------------ */

function Shipping() {
  const { user } = useAuth();
  if (!user) return <SignedOutView />;
  return <BookingWizard user={user} />;
}

/* ------------------------------------------------------------------ */
/*  Signed-out view                                                    */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Step labels                                                        */
/* ------------------------------------------------------------------ */

const STEP_LABELS = ["Sender", "Receiver", "Package", "Service", "Review"];

/* ------------------------------------------------------------------ */
/*  Booking wizard                                                     */
/* ------------------------------------------------------------------ */

function BookingWizard({ user }: { user: any }) {
  const nav = useNavigate();
  const [s, dispatch] = useReducer(reducer, initial);
  const doBook = useServerFn(bookShipment);

  // Auto-fill sender from user profile
  useEffect(() => {
    if (user && !s.origin.email && s.step === 0) {
      dispatch({
        type: "origin",
        patch: {
          contact_name: user.user_metadata?.full_name || "",
          email: user.email || "",
        },
      });
    }
  }, [user]);

  // Clean address for API submission
  const cleanAddr = (a: LocationData) => ({
    contact_name: a.contact_name,
    phone: a.phone || undefined,
    email: a.email || undefined,
    line1: a.line1,
    city: a.city,
    region: a.region || undefined,
    postal_code: a.postal_code,
    country_code: a.country_code,
    lat: a.lat ?? undefined,
    lng: a.lng ?? undefined,
  });

  // Booking mutation
  const book = useMutation({
    mutationFn: () => doBook({
      data: {
        service: s.service,
        origin: cleanAddr(s.origin),
        destination: cleanAddr(s.destination),
        package: {
          ...s.package,
          length_cm: s.package.length_cm || undefined,
          width_cm: s.package.width_cm || undefined,
          height_cm: s.package.height_cm || undefined,
          description: s.package.description || undefined,
        },
        declared_value: s.declared_value,
        insurance: s.insurance,
        signature_required: s.signature_required,
        notes: s.notes || undefined,
      } as any,
    }),
    onSuccess: (res) => {
      toast.success(`Shipment created · ${res.trackingNumber}`);
      nav({ to: "/shipping/checkout/$transactionId", params: { transactionId: res.transactionId } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Booking failed"),
  });

  // Step validation
  const stepOk = useMemo(() => {
    const okLoc = (a: LocationData) => a.contact_name && a.line1 && a.city && a.country_code && a.country_code.length === 2;
    if (s.step === 0) return !!okLoc(s.origin);
    if (s.step === 1) return !!okLoc(s.destination);
    if (s.step === 2) return s.package.weight_kg > 0 && s.package.pieces >= 1;
    if (s.step === 3) return !!s.service;
    return true;
  }, [s]);

  // Handle Continue with validation
  const handleContinue = () => {
    if (s.step === 0) {
      const o = AddressSnapshot.safeParse(cleanAddr(s.origin));
      if (!o.success) return toast.error("Sender: " + o.error.issues[0].message);
    }
    if (s.step === 1) {
      const d = AddressSnapshot.safeParse(cleanAddr(s.destination));
      if (!d.success) return toast.error("Receiver: " + d.error.issues[0].message);
    }
    if (s.step === 2) {
      if (s.package.length_cm || s.package.width_cm || s.package.height_cm) {
        if (!s.package.length_cm || !s.package.width_cm || !s.package.height_cm) {
          return toast.error("Please provide all 3 dimensions, or leave them all empty.");
        }
      }
    }
    dispatch({ type: "step", step: (s.step + 1) as WizardState["step"] });
  };

  // Rate calculation
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
        title="Ship anywhere in five steps."
        imageSrc="/images/hero_shipping_1784188694176.png"
        subtitle="Sender → Receiver → Package → Service → Review."
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        {/* Main column */}
        <div>
          {/* Step progress */}
          <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
            {STEP_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                disabled={i > s.step}
                onClick={() => i < s.step && dispatch({ type: "step", step: i as WizardState["step"] })}
                className={`flex min-w-0 shrink-0 items-center gap-1.5 rounded-full border px-3 py-2.5 text-xs font-medium transition-all sm:px-4 ${
                  i === s.step
                    ? "border-navy-deep bg-navy-deep text-cream shadow-sm"
                    : i < s.step
                      ? "cursor-pointer border-amber bg-amber/10 text-navy-deep hover:bg-amber/20"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10 text-[10px] font-bold">
                  {i < s.step ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Step content */}
          <motion.div
            key={s.step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border bg-card p-5 sm:p-8"
          >
            {s.step === 0 && (
              <LocationPicker
                role="sender"
                value={s.origin}
                onChange={(p) => dispatch({ type: "origin", patch: p })}
              />
            )}
            {s.step === 1 && (
              <LocationPicker
                role="receiver"
                value={s.destination}
                onChange={(p) => dispatch({ type: "destination", patch: p })}
              />
            )}
            {s.step === 2 && <StepPackage s={s} dispatch={dispatch} />}
            {s.step === 3 && <StepService s={s} dispatch={dispatch} />}
            {s.step === 4 && <StepReview s={s} rate={rate} />}
          </motion.div>

          {/* Navigation buttons */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={s.step === 0 || book.isPending}
              onClick={() => dispatch({ type: "step", step: Math.max(0, s.step - 1) as WizardState["step"] })}
              className="h-12 px-5 text-sm sm:h-10"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            {s.step < 4 ? (
              <Button
                disabled={!stepOk}
                onClick={handleContinue}
                className="h-12 bg-navy-deep px-6 text-sm text-cream hover:bg-navy sm:h-10"
              >
                Continue <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                disabled={book.isPending}
                onClick={() => book.mutate()}
                className="h-12 bg-amber px-6 text-sm text-navy-deep hover:bg-amber-soft sm:h-10"
              >
                {book.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
                Book shipment
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar summary */}
        <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:h-fit">
          <h3 className="font-display text-lg">Summary</h3>
          <p className="mt-1 text-xs text-muted-foreground">Live estimate — final rate at booking.</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row k="Sender" v={s.origin.city ? `${s.origin.city}, ${s.origin.country_code}` : "—"} />
            <Row k="Receiver" v={s.destination.city ? `${s.destination.city}, ${s.destination.country_code}` : "—"} />
            <Row k="Weight" v={`${s.package.weight_kg} kg × ${s.package.pieces}`} />
            <Row k="Service" v={s.service} />
          </dl>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Package details                                           */
/* ------------------------------------------------------------------ */

function StepPackage({ s, dispatch }: { s: WizardState; dispatch: React.Dispatch<Action> }) {
  return (
    <div>
      <h3 className="font-display text-lg">Package details</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FF label="Weight (kg)" type="number" inputMode="decimal" v={String(s.package.weight_kg)} on={(x) => dispatch({ type: "package", patch: { weight_kg: Number(x) || 0 } })} required />
        <FF label="Pieces" type="number" inputMode="numeric" v={String(s.package.pieces)} on={(x) => dispatch({ type: "package", patch: { pieces: Number(x) || 1 } })} required />
        <FF label="Length (cm)" type="number" inputMode="numeric" v={String(s.package.length_cm ?? "")} on={(x) => dispatch({ type: "package", patch: { length_cm: Number(x) || undefined } })} />
        <FF label="Width (cm)" type="number" inputMode="numeric" v={String(s.package.width_cm ?? "")} on={(x) => dispatch({ type: "package", patch: { width_cm: Number(x) || undefined } })} />
        <FF label="Height (cm)" type="number" inputMode="numeric" v={String(s.package.height_cm ?? "")} on={(x) => dispatch({ type: "package", patch: { height_cm: Number(x) || undefined } })} />
        <FF label="Contents description" v={s.package.description ?? ""} on={(x) => dispatch({ type: "package", patch: { description: x } })} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <FF label="Declared value (USD)" type="number" inputMode="decimal" v={String(s.declared_value)} on={(x) => dispatch({ type: "set", patch: { declared_value: Number(x) || 0 } })} />
        <div className="grid grid-cols-2 gap-3 sm:col-start-1 sm:row-start-2">
          <Toggle checked={s.insurance} onChange={(v) => dispatch({ type: "set", patch: { insurance: v } })} label="Insurance" Icon={ShieldCheck} />
          <Toggle checked={s.signature_required} onChange={(v) => dispatch({ type: "set", patch: { signature_required: v } })} label="Signature" Icon={Signature} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Service level                                             */
/* ------------------------------------------------------------------ */

function StepService({ s, dispatch }: { s: WizardState; dispatch: React.Dispatch<Action> }) {
  return (
    <div>
      <h3 className="font-display text-lg">Choose service level</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {SERVICES.map(({ id, eta, Icon, from }) => (
          <button
            key={id}
            type="button"
            onClick={() => dispatch({ type: "set", patch: { service: id } })}
            className={`text-left rounded-xl border p-4 transition-all ${
              s.service === id
                ? "border-navy-deep bg-navy-deep/5 ring-2 ring-navy-deep"
                : "border-border hover:bg-secondary"
            }`}
          >
            <Icon className="h-5 w-5 text-amber" />
            <p className="mt-2 font-display text-base sm:text-lg">{id}</p>
            <p className="text-xs text-muted-foreground">{eta} · from {fmt(from)}</p>
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-border p-4 text-sm">
        <p className="text-muted-foreground">Optional notes for the courier</p>
        <textarea
          className="mt-2 w-full min-h-[80px] rounded-md border border-input bg-background p-3 text-sm"
          value={s.notes}
          onChange={(e) => dispatch({ type: "set", patch: { notes: e.target.value } })}
          maxLength={500}
          placeholder="Leave at reception, call on arrival, etc."
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4 — Review & route preview                                    */
/* ------------------------------------------------------------------ */

function StepReview({ s, rate }: { s: WizardState; rate: any }) {
  const hasCoords = s.origin.lat !== null && s.origin.lng !== null
    && s.destination.lat !== null && s.destination.lng !== null;

  return (
    <div>
      <h3 className="font-display text-lg">Review and confirm</h3>

      {/* Route preview */}
      {hasCoords && (
        <div className="mt-4">
          <RoutePreview
            origin={{ lat: s.origin.lat!, lng: s.origin.lng! }}
            destination={{ lat: s.destination.lat!, lng: s.destination.lng! }}
            height={260}
          />
        </div>
      )}

      {/* Summary cards */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ReviewBox title="Sender">
          <p className="font-semibold">{s.origin.contact_name}</p>
          <p className="text-sm text-muted-foreground">{s.origin.line1}</p>
          <p className="text-sm text-muted-foreground">{s.origin.city}, {s.origin.postal_code} · {s.origin.country_code}</p>
          {s.origin.phone && <p className="text-xs text-muted-foreground mt-1">{s.origin.phone}</p>}
        </ReviewBox>
        <ReviewBox title="Receiver">
          <p className="font-semibold">{s.destination.contact_name}</p>
          <p className="text-sm text-muted-foreground">{s.destination.line1}</p>
          <p className="text-sm text-muted-foreground">{s.destination.city}, {s.destination.postal_code} · {s.destination.country_code}</p>
          {s.destination.phone && <p className="text-xs text-muted-foreground mt-1">{s.destination.phone}</p>}
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

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

function ReviewBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FF({
  label, v, on, required, type = "text", wide, inputMode,
}: {
  label: string; v: string; on: (x: string) => void;
  required?: boolean; type?: string; wide?: boolean;
  inputMode?: "tel" | "email" | "text" | "numeric" | "decimal";
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        required={required}
        className="mt-1.5 h-12 text-base sm:h-10 sm:text-sm"
        inputMode={inputMode}
      />
    </div>
  );
}

function Toggle({ checked, onChange, label, Icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; Icon: any }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl border px-3 py-3.5 text-sm transition-all ${
        checked ? "border-navy-deep bg-navy-deep/5" : "border-border"
      }`}
    >
      <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 text-amber" /> {label}</span>
      <span className={`h-5 w-9 rounded-full transition ${checked ? "bg-navy-deep" : "bg-muted"} relative`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}
