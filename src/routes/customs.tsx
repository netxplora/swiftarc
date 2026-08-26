import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calculator, Info, Globe2, FileText, Download, Loader2, Plus, Trash2, ShieldCheck, ArrowRight, FileCheck2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { estimateCustoms } from "@/lib/api.functions";
import { FadeInSection, StaggerGrid, StaggerItem } from "@/components/animated/FadeIn";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/customs")({
  head: () => ({
    meta: [
      { title: "Customs & Duties Calculator — SwiftArc Logistics" },
      {
        name: "description",
        content:
          "Calculate estimated import duties, value-added tax (VAT), clearance fees, and necessary customs documents for international parcel shipments.",
      },
      { property: "og:title", content: "Customs & Duties Calculator — SwiftArc" },
      {
        property: "og:description",
        content: "Clear landed cost estimates and documentation requirements across 220+ destinations.",
      },
      { name: "keywords", content: "customs duty calculator, landed cost, VAT estimator, import tariff, clearance documents" },
    ],
    links: [{ rel: "canonical", href: "/customs" }],
  }),
  component: CustomsPage,
});

const categories = [
  "Electronics",
  "Apparel & Textiles",
  "Home & Furniture",
  "Cosmetics & Care",
  "Books & Printed",
  "Machinery & Parts",
  "Toys & Games",
  "Jewelry & Valuables",
];

const countries = [
  { code: "UK", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "US", name: "United States" },
  { code: "JP", name: "Japan" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "IN", name: "India" },
];

interface Item {
  id: string;
  name: string;
  category: string;
  qty: number;
  unitValue: number;
}

function CustomsPage() {
  const [country, setCountry] = useState("US");
  const [freight, setFreight] = useState(45);
  const [insurance, setInsurance] = useState(15);
  const [hsCode, setHsCode] = useState("");
  const [items, setItems] = useState<Item[]>([
    {
      id: "init",
      name: "Wireless Headphones",
      category: "Electronics",
      qty: 2,
      unitValue: 150,
    },
  ]);

  const totalValue = items.reduce((a, b) => a + b.qty * b.unitValue, 0);

  const counts: Record<string, number> = {};
  items.forEach((i) => {
    counts[i.category] = (counts[i.category] || 0) + 1;
  });
  let dominant = "General Merchandise";
  let max = 0;
  for (const [c, n] of Object.entries(counts)) {
    if (n > max) {
      max = n;
      dominant = c;
    }
  }

  const fetchEst = useServerFn(estimateCustoms);
  const est = useQuery({
    queryKey: ["customs", country, dominant, totalValue, freight, insurance, hsCode],
    queryFn: () =>
      fetchEst({
        data: {
          destination: country,
          category: dominant,
          value: totalValue,
          freight,
          insurance,
          hsCode: hsCode || undefined,
        },
      }),
    enabled: totalValue > 0,
  });

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "New Parcel Item",
        category: "Electronics",
        qty: 1,
        unitValue: 100,
      },
    ]);
  const rmItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const patch = (id: string, u: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...u } : i)));

  const exportSummary = () => {
    if (!est.data) return;
    const rows = [
      ["SwiftArc Customs Estimate Summary"],
      [`Generated ${est.data.generatedAt}`],
      [`Destination Country`, country],
      [`Dominant Cargo Category`, dominant],
      [`HS Tariff Code`, hsCode || "—"],
      [],
      ["Declared Items"],
      ["Item Description", "Category", "Quantity", "Unit Value (USD)", "Line Total (USD)"],
      ...items.map((i) => [
        i.name,
        i.category,
        i.qty,
        i.unitValue.toFixed(2),
        (i.qty * i.unitValue).toFixed(2),
      ]),
      [],
      ["Estimated Cost Breakdown"],
      ["Fee Label", "Amount (USD)"],
      ...est.data.breakdown.map((b) => [b.label, b.amount.toFixed(2)]),
      [],
      ["Required Customs Documents"],
      ...est.data.documents.map((d) => [d]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `customs-estimate-${country}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
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
          style={{ backgroundImage: "radial-gradient(#032D60 1.2px, transparent 1.2px)", backgroundSize: "26px 26px" }}
          aria-hidden
        />
        <div className="absolute -top-20 right-0 w-[480px] h-[480px] rounded-full bg-primary/[0.06] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-[380px] h-[380px] rounded-full bg-sky-400/[0.06] blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm">
                  <FileCheck2 className="h-3 w-3" />
                  International Compliance
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#032D60] leading-[1.1]"
              >
                Customs Duties &{" "}
                <span className="relative">
                  <span className="text-primary">Tax Calculator</span>
                  <motion.span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary/40" initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.8 }} />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed"
              >
                Estimate landed costs before shipping internationally. Calculate duties, VAT, and required documentation instantly based on current trade tariffs.
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
                  <img src={heroImg} alt="SwiftArc Customs Service" className="w-full h-72 sm:h-80 rounded-2xl object-cover" />
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-tr from-primary/8 via-transparent to-transparent pointer-events-none" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Calculator Main Section ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          
          {/* Controls Column */}
          <div className="lg:col-span-7">
            <FadeInSection direction="left" className="space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-[#032D60]/5">
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-[#032D60]">Declared Items</h2>
                  </div>
                  <Button onClick={addItem} variant="outline" size="sm" className="font-bold border-2 rounded-xl text-primary border-primary/20 hover:bg-primary/5 hover:border-primary">
                    <Plus className="h-4 w-4 mr-1.5" /> Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {items.map((it, idx) => (
                    <div key={it.id} className="group relative grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-5 pr-12 transition-all hover:border-primary/30 hover:shadow-sm sm:grid-cols-12">
                      <div className="sm:col-span-5 space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Item Description</Label>
                        <Input
                          value={it.name}
                          onChange={(e) => patch(it.id, { name: e.target.value })}
                          className="h-10 bg-white border-slate-200 rounded-lg shadow-sm"
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Category</Label>
                        <select
                          value={it.category}
                          onChange={(e) => patch(it.id, { category: e.target.value })}
                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Qty</Label>
                        <Input
                          type="number"
                          min={1}
                          value={it.qty}
                          onChange={(e) => patch(it.id, { qty: Math.max(1, +e.target.value) })}
                          className="h-10 bg-white border-slate-200 rounded-lg font-mono shadow-sm"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Val ($)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={it.unitValue}
                          onChange={(e) => patch(it.id, { unitValue: Math.max(1, +e.target.value) })}
                          className="h-10 bg-white border-slate-200 rounded-lg font-mono shadow-sm"
                        />
                      </div>

                      <button
                        onClick={() => rmItem(it.id)}
                        disabled={items.length === 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between items-center rounded-xl bg-slate-100/50 p-4 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Total Goods Value</span>
                  <span className="font-mono text-xl font-bold text-[#032D60]">${totalValue.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-[#032D60]/5">
                <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#032D60]">Shipping Logistics</h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Destination Country</Label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-medium shadow-sm outline-none focus:border-primary/50 focus:bg-white transition-colors"
                    >
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      HS Tariff Code (Optional)
                      <span className="group relative">
                        <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-md bg-slate-800 p-2 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 z-10 font-normal normal-case">
                          Harmonized System Code for exact duty percentage. We estimate based on category if blank.
                        </span>
                      </span>
                    </Label>
                    <Input
                      value={hsCode}
                      onChange={(e) => setHsCode(e.target.value)}
                      placeholder="e.g. 8518.30"
                      className="h-12 bg-slate-50 border-slate-200 rounded-xl shadow-sm focus:border-primary/40 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Freight Cost (USD)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={freight}
                      onChange={(e) => setFreight(+e.target.value)}
                      className="h-12 bg-slate-50 border-slate-200 rounded-xl shadow-sm focus:border-primary/40 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Cargo Insurance (USD)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={insurance}
                      onChange={(e) => setInsurance(+e.target.value)}
                      className="h-12 bg-slate-50 border-slate-200 rounded-xl shadow-sm focus:border-primary/40 font-mono"
                    />
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-sky-50/50 p-5 border border-sky-100 text-xs text-sky-800/80 leading-relaxed">
                  <p className="font-bold text-sky-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-sky-600" /> Estimation Notice
                  </p>
                  <p className="pl-6 mt-1.5">
                    Calculations use CIF (Cost, Insurance, and Freight) value. Final duties are assessed by local customs officials upon import.
                  </p>
                </div>
              </div>
            </FadeInSection>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-5">
            <FadeInSection direction="right" className="sticky top-28">
              <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-[#032D60]/5">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-6">
                  Estimated Breakdown
                </h3>

                {est.isLoading ? (
                  <div className="flex h-40 flex-col items-center justify-center space-y-3 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs font-semibold">Calculating tariffs...</p>
                  </div>
                ) : est.isError ? (
                  <div className="flex h-40 flex-col items-center justify-center space-y-2 text-red-500">
                    <p className="text-sm font-semibold">Failed to fetch estimate.</p>
                  </div>
                ) : est.data ? (
                  <div className="space-y-8">
                    <div>
                      <div className="mb-4 flex items-end justify-between">
                        <span className="text-slate-500 font-medium text-sm">Estimated Total Duties & Taxes</span>
                        <span className="font-display text-4xl font-extrabold text-[#032D60]">
                          ${est.data.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <span className="text-xs font-bold text-slate-600">Total Landed Cost</span>
                         <span className="font-mono font-bold text-emerald-600">
                           ${(est.data.total + totalValue + freight + insurance).toFixed(2)}
                         </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
                        Itemized Cost
                      </h4>
                      <dl className="space-y-3 text-sm">
                        {est.data.breakdown.map((b) => (
                          <div key={b.label} className="flex justify-between items-center group">
                            <dt className="text-slate-500 group-hover:text-[#032D60] transition-colors">{b.label}</dt>
                            <dd className="font-mono font-semibold text-slate-700">
                              ${b.amount.toFixed(2)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
                        Required Documents
                      </h4>
                      <ul className="space-y-2">
                        {est.data.documents.map((d) => (
                          <li key={d} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                       <Button onClick={exportSummary} className="w-full bg-[#032D60] hover:bg-[#032D60]/90 text-white font-bold h-12 rounded-xl shadow-md transition-all">
                         <Download className="mr-2 h-4 w-4" /> Export CSV Summary
                       </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>
    </div>
  );
}
