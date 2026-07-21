import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminListInvoices, adminSetInvoiceStatus, adminCreateInvoice, adminDeleteInvoice } from "@/lib/admin.functions";
import { Loader2, Trash2, Plus, Download } from "lucide-react";

const STATUSES = ["draft","sent","paid","overdue","void"] as const;

export const Route = createFileRoute("/admin/invoices")({
  head: () => ({ meta: [{ title: "Admin — Invoices" }, { name: "robots", content: "noindex" }] }),
  component: AdminInvoices,
});

async function downloadPdf(inv: any) {
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
      ? inv.line_items.map((li: any) => ({ label: li.label, qty: li.qty, unitPrice: li.unit_price, amount: li.qty * li.unit_price }))
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

function AdminInvoices() {
  const qc = useQueryClient();
  const list = useServerFn(adminListInvoices);
  const setStatus = useServerFn(adminSetInvoiceStatus);
  const q = useQuery({ queryKey: ["admin-invoices"], queryFn: () => list() });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: typeof STATUSES[number] }) => setStatus({ data: v }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-invoices"] }); },
    onError: () => toast.error("Update failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">All customer invoices and payment status.</p>
        </div>
        <InvoiceForm onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-invoices"] })} />
      </div>

      <Card><CardContent className="p-0">
        {q.isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-3">Invoice</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-xs">{i.number}</td>
                    <td className="p-3">{i.currency} {Number(i.total).toLocaleString()}</td>
                    <td className="p-3 text-xs text-muted-foreground">{i.due_date}</td>
                    <td className="p-3">
                      <select
                        value={i.status ?? "sent"}
                        onChange={(e) => mut.mutate({ id: i.id, status: e.target.value as typeof STATUSES[number] })}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => downloadPdf(i)} className="text-amber-deep hover:text-amber hover:bg-amber/10 h-8 px-2" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive hover:bg-destructive/10" onClick={async () => {
                          if (confirm("Delete invoice?")) {
                            const del = (await import("@/lib/admin.functions")).adminDeleteInvoice;
                            del({ data: { id: i.id } }).then(() => qc.invalidateQueries({ queryKey: ["admin-invoices"] }));
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(q.data ?? []).length === 0 && <tr><td colSpan={4} className="p-10 text-center text-xs text-muted-foreground">No invoices.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}

function InvoiceForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const createMut = useServerFn(adminCreateInvoice);
  const [number, setNumber] = useState("");
  const [total, setTotal] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createMut({ data: { number, total: Number(total), due_date: date, status } });
      toast.success("Invoice created");
      setOpen(false);
      onSuccess();
    } catch (err) {
      toast.error("Failed to create");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-navy-deep text-cream hover:bg-navy"><Plus className="mr-2 h-4 w-4" /> New Invoice</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Invoice Number</label>
            <Input required value={number} onChange={e => setNumber(e.target.value)} placeholder="INV-2026-..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Total (USD)</label>
            <Input required type="number" step="0.01" value={total} onChange={e => setTotal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button type="submit" className="w-full bg-amber text-navy-deep hover:bg-amber-soft" disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
