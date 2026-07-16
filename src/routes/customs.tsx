import { useMemo, useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calculator, Info, Globe2, FileText, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { estimateCustoms } from "@/lib/api.functions";

export const Route = createFileRoute("/customs")({
  head: () => ({
    meta: [
      { title: "Customs & duties estimator — SwiftArc" },
      { name: "description", content: "Estimate import duties, VAT, and clearance fees for cross-border shipments in seconds." },
      { property: "og:title", content: "SwiftArc Customs & Duties Estimator" },
      { property: "og:description", content: "Landed cost calculator across 220+ destinations." },
    ],
  }),
  component: CustomsPage,
});

const categories = ["Electronics", "Apparel", "Home goods", "Cosmetics", "Books", "Machinery", "Toys", "Jewelry"];
const countries = ["UK", "DE", "FR", "ES", "US", "JP", "CA", "AU", "AE", "IN"];

interface Item { id: string; name: string; category: string; qty: number; unitValue: number; }

function CustomsPage() {
  const fetchRates = useServerFn(estimateCustoms);
  const [country, setCountry] = useState("DE");
  const [freight, setFreight] = useState(45);
  const [insurance, setInsurance] = useState(6);
  const [hsCode, setHsCode] = useState("");
  const [items, setItems] = useState<Item[]>([
    { id: "1", name: "Wireless earbuds", category: "Electronics", qty: 2, unitValue: 180 },
    { id: "2", name: "Cotton hoodie", category: "Apparel", qty: 1, unitValue: 140 },
  ]);

  const totalValue = useMemo(() => items.reduce((s, i) => s + i.qty * i.unitValue, 0), [items]);
  const dominant = useMemo(() => {
    const byCat = new Map<string, number>();
    items.forEach((i) => byCat.set(i.category, (byCat.get(i.category) ?? 0) + i.qty * i.unitValue));
    let top = items[0]?.category ?? "Electronics", max = 0;
    byCat.forEach((v, k) => { if (v > max) { max = v; top = k; } });
    return top;
  }, [items]);

  const est = useQuery({
    queryKey: ["customs", country, dominant, totalValue, freight, insurance, hsCode],
    queryFn: () => fetchRates({ data: {
      country, category: dominant, value: totalValue, freight, insurance,
      hsCode: hsCode || undefined,
    } }),
    enabled: totalValue > 0,
  });

  const addItem = () => setItems((prev) => [...prev, { id: crypto.randomUUID(), name: "New item", category: "Electronics", qty: 1, unitValue: 100 }]);
  const rmItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const patch = (id: string, u: Partial<Item>) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...u } : i));

  const exportSummary = () => {
    if (!est.data) return;
    const rows = [
      ["SwiftArc Customs Estimate"],
      [`Generated ${est.data.generatedAt}`],
      [`Destination`, country],
      [`Dominant category`, dominant],
      [`HS code`, hsCode || "—"],
      [],
      ["Items"],
      ["Name", "Category", "Qty", "Unit value", "Line total"],
      ...items.map((i) => [i.name, i.category, i.qty, i.unitValue.toFixed(2), (i.qty * i.unitValue).toFixed(2)]),
      [],
      ["Cost breakdown"],
      ["Label", "Amount (USD)"],
      ...est.data.breakdown.map((b) => [b.label, b.amount.toFixed(2)]),
      [],
      ["Required documents"],
      ...est.data.documents.map((d) => [d]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `customs-estimate-${country}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <PageHero
        eyebrow="Landed cost"
        title="Customs & duties estimator"
        subtitle="Item-level duties, VAT, clearance and handling — plus required documents per category."
        imageSrc="/images/hero_customs_1784191922424.png"
      />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label>Destination country</Label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {countries.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid gap-1.5"><Label>Freight (USD)</Label>
                <Input type="number" min={0} value={freight} onChange={(e) => setFreight(+e.target.value || 0)} className="transition-shadow focus-visible:ring-amber" /></div>
              <div className="grid gap-1.5"><Label>Insurance (USD)</Label>
                <Input type="number" min={0} value={insurance} onChange={(e) => setInsurance(+e.target.value || 0)} className="transition-shadow focus-visible:ring-amber" /></div>
              <div className="sm:col-span-3 grid gap-1.5">
                <Label>HS code (optional)</Label>
                <Input placeholder="e.g., 8517.13.00" value={hsCode} onChange={(e) => setHsCode(e.target.value)} className="transition-shadow focus-visible:ring-amber" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Items</h2>
              <button onClick={addItem} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary transition-colors">
                <Plus className="h-3 w-3" /> Add item
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {items.map((i) => (
                <div key={i.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_80px_120px_36px] transition-all hover:border-amber/50">
                  <Input value={i.name} onChange={(e) => patch(i.id, { name: e.target.value })} placeholder="Item name" className="focus-visible:ring-amber" />
                  <select value={i.category} onChange={(e) => patch(i.id, { category: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-amber">
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <Input type="number" min={1} value={i.qty} onChange={(e) => patch(i.id, { qty: +e.target.value || 1 })} className="focus-visible:ring-amber" />
                  <Input type="number" min={0} step={0.01} value={i.unitValue} onChange={(e) => patch(i.id, { unitValue: +e.target.value || 0 })} className="focus-visible:ring-amber" />
                  <button onClick={() => rmItem(i.id)} aria-label="Remove item" className="grid h-10 w-10 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Declared value</span>
              <span className="font-mono font-semibold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </motion.div>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <p>SwiftArc's DDP option lets you pre-pay duties at checkout so recipients aren't billed on delivery. Talk to sales for enterprise HS-code automation.</p>
          </div>
        </div>

        <motion.aside
          key={est.dataUpdatedAt}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="h-fit space-y-4"
        >
          <div className="rounded-2xl border border-border bg-navy-deep p-6 text-cream">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber">
                <Calculator className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-widest">Estimated landed cost</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber">
                <Globe2 className="h-3 w-3" /> {country}
              </span>
            </div>

            {est.isLoading || !est.data ? (
              <div className="mt-6 grid h-24 place-items-center">
                <Loader2 className="h-5 w-5 animate-spin text-cream/60" />
              </div>
            ) : (
              <>
                <div className="mt-4 font-display text-5xl font-bold">
                  ${est.data.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <p className="mt-1 text-xs text-cream/60">
                  Rates based on dominant category: <span className="text-cream">{dominant}</span>
                </p>
                <dl className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
                  {est.data.breakdown.map((b) => (
                    <div key={b.label} className={`flex justify-between ${b.emphasis ? "font-semibold" : ""}`}>
                      <dt className="text-cream/70">{b.label}</dt>
                      <dd className="font-mono">${b.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}

            <div className="mt-6 grid gap-2">
              <button onClick={exportSummary} disabled={!est.data} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber py-3 text-sm font-semibold text-navy-deep transition-colors hover:bg-amber-soft disabled:opacity-60">
                <Download className="h-4 w-4" /> Export summary
              </button>
              <button className="w-full rounded-md border border-cream/20 py-2.5 text-sm text-cream/90 hover:bg-white/5">
                Ship with DDP →
              </button>
            </div>
          </div>

          {est.data && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Documents needed</h3>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {est.data.documents.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.aside>
      </div>
    </div>
  );
}
