import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, Wallet, Settings2, Plus, Loader2, CheckCircle2, XCircle, Trash2, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";

import {
  adminListTransactions,
  adminVerifyTransaction,
  adminListWallets,
  adminUpsertWallet,
  adminDeleteWallet,
  adminListPaymentMethods,
  adminTogglePaymentMethod,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Admin — Payments" }, { name: "robots", content: "noindex" }] }),
  component: AdminPayments,
});

function AdminPayments() {
  const [tab, setTab] = useState<"transactions" | "wallets" | "settings">("transactions");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Payment Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage transactions, digital wallets, and payment gateways.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        <TabButton active={tab === "transactions"} onClick={() => setTab("transactions")} icon={CreditCard}>Transactions</TabButton>
        <TabButton active={tab === "wallets"} onClick={() => setTab("wallets")} icon={Wallet}>Crypto Wallets</TabButton>
        <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={Settings2}>Settings</TabButton>
      </div>

      {tab === "transactions" && <TransactionsTab />}
      {tab === "wallets" && <WalletsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-navy-deep text-cream" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}

// ---------- Transactions Tab ----------

function TransactionsTab() {
  const qc = useQueryClient();
  const fetchTxns = useServerFn(adminListTransactions);
  const verifyMutFn = useServerFn(adminVerifyTransaction);
  const [search, setSearch] = useState("");

  const q = useQuery({ queryKey: ["admin-txns"], queryFn: () => fetchTxns(), refetchInterval: 10000 });

  const verifyMut = useMutation({
    mutationFn: (args: { id: string; action: "verify" | "reject"; note?: string }) => verifyMutFn({ data: args }),
    onSuccess: (res) => {
      toast.success(res.status === "verified" ? "Payment verified" : "Payment rejected");
      qc.invalidateQueries({ queryKey: ["admin-txns"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Operation failed"),
  });

  const filtered = (q.data ?? []).filter((t: any) =>
    !search || t.reference.toLowerCase().includes(search.toLowerCase()) || t.shipments?.tracking_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card><CardContent className="p-0">
      <div className="border-b border-border p-4">
        <Input placeholder="Search references or tracking IDs…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>
      {q.isLoading ? (
        <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-4">Reference</th>
                <th className="p-4">Shipment</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t: any) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                  <td className="p-4 font-mono font-medium">{t.reference}</td>
                  <td className="p-4">{t.shipments?.tracking_number}</td>
                  <td className="p-4 font-medium">{t.currency} {Number(t.amount).toFixed(2)}</td>
                  <td className="p-4 capitalize">{t.method.replace("_", " ")}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      t.status === "verified" ? "bg-success/20 text-success" :
                      t.status === "processing" ? "bg-amber/20 text-amber-deep" :
                      t.status === "rejected" ? "bg-destructive/20 text-destructive" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {t.status === "processing" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => verifyMut.mutate({ id: t.id, action: "verify" })}
                          disabled={verifyMut.isPending}
                          className="bg-success text-white hover:bg-success/90 h-8 px-2"
                          title="Verify Payment"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const note = prompt("Reason for rejection:");
                            if (note !== null) verifyMut.mutate({ id: t.id, action: "reject", note });
                          }}
                          disabled={verifyMut.isPending}
                          className="h-8 px-2"
                          title="Reject Payment"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : t.status === "verified" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            const { generatePaymentReceipt } = await import("@/lib/pdf");
                            generatePaymentReceipt({
                              id: t.reference || t.id,
                              date: t.created_at,
                              method: t.method.replace("_", " "),
                              amount: t.amount,
                              status: t.status,
                              invoiceId: t.shipments?.tracking_number
                            });
                          }}
                          className="h-8 px-2 text-amber-deep hover:text-amber hover:bg-amber/10"
                          title="Download Receipt"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No transactions found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </CardContent></Card>
  );
}

// ---------- Wallets Tab ----------

function WalletsTab() {
  const qc = useQueryClient();
  const fetchWallets = useServerFn(adminListWallets);
  const q = useQuery({ queryKey: ["admin-wallets"], queryFn: () => fetchWallets() });
  
  return (
    <Card><CardContent className="p-0">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-semibold">Global Crypto Wallets</h3>
        <WalletForm onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-wallets"] })} />
      </div>
      {q.isLoading ? (
        <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="divide-y divide-border">
          {(q.data ?? []).map((w: any) => (
            <div key={w.id} className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{w.currency}</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{w.network}</span>
                  <span className={`h-2 w-2 rounded-full ${w.status === "active" ? "bg-success" : "bg-destructive"}`} />
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground break-all">{w.address}</div>
              </div>
              <div className="flex gap-2">
                <WalletForm wallet={w} onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-wallets"] })} />
                <Button size="icon" variant="ghost" onClick={async () => {
                  if (confirm("Delete wallet?")) {
                    const del = (await import("@/lib/admin.functions")).adminDeleteWallet;
                    del({ data: { id: w.id } }).then(() => qc.invalidateQueries({ queryKey: ["admin-wallets"] }));
                  }
                }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {(q.data ?? []).length === 0 && <div className="p-10 text-center text-muted-foreground">No wallets configured.</div>}
        </div>
      )}
    </CardContent></Card>
  );
}

function WalletForm({ wallet, onSuccess }: { wallet?: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const mut = useServerFn(adminUpsertWallet);
  const [currency, setCurrency] = useState(wallet?.currency ?? "");
  const [network, setNetwork] = useState(wallet?.network ?? "");
  const [address, setAddress] = useState(wallet?.address ?? "");
  const [status, setStatus] = useState(wallet?.status ?? "active");
  const [instructions, setInstructions] = useState(wallet?.instructions ?? "");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mut({ data: { id: wallet?.id, currency, network, address, status, instructions: instructions || undefined } });
      toast.success(wallet ? "Wallet updated" : "Wallet created");
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {wallet ? (
          <Button size="sm" variant="outline">Edit</Button>
        ) : (
          <Button size="sm" className="bg-navy-deep text-cream hover:bg-navy"><Plus className="mr-1 h-4 w-4" /> Add Wallet</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{wallet ? "Edit Wallet" : "Add Crypto Wallet"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Currency (e.g. USDC)</Label><Input required value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())} /></div>
            <div className="space-y-1.5"><Label>Network (e.g. Ethereum)</Label><Input required value={network} onChange={e => setNetwork(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Wallet Address</Label><Input required value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Payment Instructions</Label><Input value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Send via ERC-20 only" /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-amber text-navy-deep hover:bg-amber-soft">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Wallet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Settings Tab ----------

function SettingsTab() {
  const qc = useQueryClient();
  const fetchMethods = useServerFn(adminListPaymentMethods);
  const toggleMutFn = useServerFn(adminTogglePaymentMethod);
  const q = useQuery({ queryKey: ["admin-methods"], queryFn: () => fetchMethods() });

  const toggle = useMutation({
    mutationFn: (args: { id: string; enabled: boolean }) => toggleMutFn({ data: args }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-methods"] }),
    onError: () => toast.error("Toggle failed"),
  });

  return (
    <Card><CardContent className="p-0">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Payment Gateways</h3>
        <p className="text-sm text-muted-foreground">Enable or disable payment methods globally.</p>
      </div>
      {q.isLoading ? (
        <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="divide-y divide-border">
          {(q.data ?? []).map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{m.label}</p>
                <p className="text-sm text-muted-foreground">{m.description}</p>
              </div>
              <Toggle
                pressed={m.enabled}
                onPressedChange={(checked) => toggle.mutate({ id: m.id, enabled: checked })}
              >
                {m.enabled ? "Active" : "Disabled"}
              </Toggle>
            </div>
          ))}
        </div>
      )}
    </CardContent></Card>
  );
}
