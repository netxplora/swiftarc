import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, useEffect } from "react";
import { Download, FileText, CheckCircle2, Clock, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { listInvoices } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/invoices")({
  component: Invoices,
});

type InvoiceRow = {
  id: string; number: string; issue_date: string; due_date: string;
  status: "draft" | "sent" | "paid" | "overdue"; currency: string;
  subtotal: number; tax: number; total: number;
  line_items: Array<{ label: string; qty: number; unit_price: number }>;
};

const badge: Record<string, string> = {
  paid: "bg-success/15 text-success",
  sent: "bg-warning/20 text-navy-deep",
  overdue: "bg-destructive/15 text-destructive",
  draft: "bg-secondary text-muted-foreground",
};

const filters = ["all", "sent", "paid", "overdue"] as const;

function fmt(n: number, cur = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(n);
}

async function downloadPdf(inv: InvoiceRow) {
  const { generateBillingInvoice } = await import("@/lib/pdf");
  generateBillingInvoice({
    invoiceNumber: inv.number,
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    status: inv.status,
    currency: inv.currency,
    subtotal: inv.subtotal,
    tax: inv.tax,
    total: inv.total,
    lineItems: (inv.line_items ?? []).length > 0 
      ? inv.line_items.map(li => ({ label: li.label, qty: li.qty, unitPrice: li.unit_price, amount: li.qty * li.unit_price }))
      : [{ label: "Logistics Service", qty: 1, unitPrice: inv.total, amount: inv.total }],
    billTo: { 
      contact: "Account Holder", 
      line1: "Client Address", 
      city: "City", 
      zip: "00000", 
      country: "US" 
    },
  });
}

function Invoices() {
  const fetchAll = useServerFn(listInvoices);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => fetchAll(), staleTime: Infinity });
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes-invoices-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => qc.invalidateQueries({ queryKey: ["invoices"] }))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const list = useMemo(() => (data ?? []).filter((i) => filter === "all" ? true : i.status === filter) as unknown as InvoiceRow[], [data, filter]);
  const total = (data ?? []).reduce((s, i) => s + Number(i.total), 0);
  const outstanding = (data ?? []).filter((i) => i.status !== "paid").reduce((s, i) => s + Number(i.total), 0);
  const paid = total - outstanding;

  const exportCsv = () => {
    const rows = [["Invoice", "Issue", "Due", "Status", "Subtotal", "Tax", "Total", "Currency"]]
      .concat(list.map((i) => [i.number, i.issue_date, i.due_date, i.status, String(i.subtotal), String(i.tax), String(i.total), i.currency]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `invoices-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(a.href);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Billing history for your SwiftArc account.</p>
        </div>
        <button onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm hover:bg-secondary">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Total billed" value={fmt(total)} Icon={FileText} />
        <Kpi label="Outstanding" value={fmt(outstanding)} Icon={Clock} />
        <Kpi label="Paid" value={fmt(paid)} Icon={CheckCircle2} tone="success" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium ${filter === f ? "border-navy-deep bg-navy-deep text-cream" : "border-border bg-card hover:bg-secondary"}`}>
            <Filter className="h-3 w-3" /> {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Issue</th>
                <th className="hidden px-4 py-3 md:table-cell">Due</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((i) => (
                <tr key={i.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">{i.number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.issue_date}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{i.due_date}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(Number(i.total), i.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge[i.status] ?? "bg-secondary"}`}>{i.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => downloadPdf(i)} className="text-amber-deep hover:text-amber hover:bg-amber/10">
                        <Download className="h-4 w-4 mr-1" /> PDF
                      </Button>
                      <Link
                        to="/dashboard/invoices/$invoiceId"
                        params={{ invoiceId: i.id }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                      >
                        <FileText className="h-3 w-3" /> View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No invoices found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, Icon, tone }: { label: string; value: string; Icon: any; tone?: "success" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-widest">{label}</span>
        <Icon className={`h-4 w-4 ${tone === "success" ? "text-success" : "text-amber"}`} />
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-navy-deep">{value}</div>
    </div>
  );
}
