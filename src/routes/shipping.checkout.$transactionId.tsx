import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { CreditCard, Building2, Coins, Copy, Check, Loader2, Clock, ExternalLink, QrCode, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCheckoutTransaction, listPaymentMethods, listActiveWallets, selectPaymentMethod, markTransactionPaid } from "@/lib/api.functions";

export const Route = createFileRoute("/shipping/checkout/$transactionId")({
  head: () => ({
    meta: [
      { title: "Checkout — SwiftArc" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

type MethodKey = "card" | "bank_transfer" | "crypto";

function CheckoutPage() {
  const { transactionId } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const fetchTxn = useServerFn(getCheckoutTransaction);
  const fetchMethods = useServerFn(listPaymentMethods);
  const fetchWallets = useServerFn(listActiveWallets);
  const doSelect = useServerFn(selectPaymentMethod);
  const doPay = useServerFn(markTransactionPaid);

  const txn = useQuery({ queryKey: ["checkout", transactionId], queryFn: () => fetchTxn({ data: { transactionId } }), refetchInterval: 5000 });
  const methods = useQuery({ queryKey: ["payment-methods"], queryFn: () => fetchMethods() });
  const wallets = useQuery({ queryKey: ["active-wallets"], queryFn: () => fetchWallets() });

  const [tab, setTab] = useState<MethodKey>("card");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOnRamp, setShowOnRamp] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  // Bank transfer state
  const [bankRef, setBankRef] = useState("");

  const wallet = (wallets.data ?? []).find((w: any) => w.id === selectedWallet);

  const payMut = useMutation({
    mutationFn: async () => {
      if (tab === "crypto" && wallet) {
        await doSelect({ data: {
          transactionId,
          method: "crypto",
          walletId: wallet.id,
          cryptoCurrency: wallet.currency,
          cryptoNetwork: wallet.network,
          cryptoAddress: wallet.address,
        }});
        return doPay({ data: { transactionId, method: "crypto" } });
      }
      if (tab === "bank_transfer") {
        return doPay({ data: { transactionId, method: "bank_transfer", bankReference: bankRef || undefined } });
      }
      // Card
      const last4 = cardNumber.replace(/\s/g, "").slice(-4);
      return doPay({ data: { transactionId, method: "card", cardLast4: last4 } });
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["checkout", transactionId] });
      if (res?.status === "verified") {
        toast.success("Payment verified! Your shipment label is ready.");
      } else {
        toast.success("Payment submitted. Awaiting verification.");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Payment failed"),
  });

  const copyAddress = useCallback(() => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success("Wallet address copied");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [wallet]);

  if (txn.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const t = txn.data;
  if (!t) {
    return <div className="grid min-h-[60vh] place-items-center"><p className="text-muted-foreground">Transaction not found.</p></div>;
  }

  const shipment = t.shipments as any;
  const isComplete = t.status === "verified";
  const isPending = t.status === "pending" || t.status === "processing";

  if (isComplete) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-success/40 bg-success/10 p-10">
          <ShieldCheck className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 font-display text-3xl font-bold">Payment Verified</h1>
          <p className="mt-2 text-muted-foreground">Your shipment <span className="font-mono font-semibold text-foreground">{shipment?.tracking_number}</span> is ready.</p>
          <p className="mt-1 text-sm text-muted-foreground">Reference: {t.reference}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => nav({ to: "/dashboard/shipments" })} className="bg-navy-deep text-cream hover:bg-navy">View shipments</Button>
            <Button variant="outline" onClick={() => nav({ to: `/tracking/${shipment?.tracking_number}` })}>Track shipment</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (t.status === "processing") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border border-amber/40 bg-amber/10 p-10">
          <Clock className="mx-auto h-12 w-12 text-amber" />
          <h1 className="mt-4 font-display text-3xl font-bold">Payment Processing</h1>
          <p className="mt-2 text-muted-foreground">Your payment is being verified. This page updates automatically.</p>
          <p className="mt-1 text-sm font-mono text-foreground">{t.reference}</p>
          <p className="mt-4 text-xs text-muted-foreground">Amount: {fmt(Number(t.amount))}</p>
          <ExpiryCountdown expiresAt={t.expires_at} />
        </motion.div>
      </div>
    );
  }

  const methodTabs: { key: MethodKey; label: string; icon: any }[] = [
    { key: "card", label: "Card", icon: CreditCard },
    { key: "bank_transfer", label: "Bank Transfer", icon: Building2 },
    { key: "crypto", label: "Digital Currency", icon: Coins },
  ];
  const enabledKeys = (methods.data ?? []).filter((m: any) => m.enabled).map((m: any) => m.key);
  const availableTabs = methodTabs.filter((t) => enabledKeys.includes(t.key));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => nav({ to: "/shipping" })}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to shipping
      </Button>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Complete your payment</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Shipment {shipment?.tracking_number} · {shipment?.service}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold">{fmt(Number(t.amount))}</p>
            <p className="text-xs text-muted-foreground">Ref: {t.reference}</p>
          </div>
        </div>

        {/* Method tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {availableTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === key ? "border-navy-deep bg-navy-deep text-cream" : "border-border bg-background hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          {tab === "card" && (
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label>Cardholder name</Label>
                <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Full name on card" className="h-11" />
              </div>
              <div className="grid gap-1.5">
                <Label>Card number</Label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, "").slice(0, 19))}
                  placeholder="4242 4242 4242 4242"
                  className="h-11 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Expiry</Label>
                  <Input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))} placeholder="MM/YY" className="h-11" />
                </div>
                <div className="grid gap-1.5">
                  <Label>CVC</Label>
                  <Input value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" className="h-11" type="password" />
                </div>
              </div>
              <Button
                onClick={() => payMut.mutate()}
                disabled={payMut.isPending || cardNumber.replace(/\s/g, "").length < 13}
                className="mt-2 h-11 w-full bg-amber text-navy-deep hover:bg-amber-soft"
              >
                {payMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                Pay {fmt(Number(t.amount))}
              </Button>
            </div>
          )}

          {tab === "bank_transfer" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-3">
                <h3 className="font-semibold">Bank Transfer Details</h3>
                <dl className="text-sm space-y-2">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Bank</dt><dd className="font-medium">SwiftArc Global Ltd.</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Account</dt><dd className="font-mono font-medium">GB82 WEST 1234 5698 7654 32</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">SWIFT</dt><dd className="font-mono font-medium">WESTGB2L</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Reference</dt><dd className="font-mono font-bold text-amber">{t.reference}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Amount</dt><dd className="font-bold">{fmt(Number(t.amount))}</dd></div>
                </dl>
              </div>
              <div className="grid gap-1.5">
                <Label>Your bank reference (optional)</Label>
                <Input value={bankRef} onChange={(e) => setBankRef(e.target.value)} placeholder="e.g. wire confirmation number" className="h-11" />
              </div>
              <Button
                onClick={() => payMut.mutate()}
                disabled={payMut.isPending}
                className="h-11 w-full bg-navy-deep text-cream hover:bg-navy"
              >
                {payMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
                I have sent the transfer
              </Button>
            </div>
          )}

          {tab === "crypto" && (
            <div className="space-y-5">
              {/* Wallet selector */}
              <div className="grid gap-1.5">
                <Label>Select currency and network</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(wallets.data ?? []).map((w: any) => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWallet(w.id)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        selectedWallet === w.id ? "border-amber bg-amber/10" : "border-border hover:bg-secondary"
                      }`}
                    >
                      <div className="font-semibold text-sm">{w.currency}</div>
                      <div className="text-xs text-muted-foreground">{w.network}</div>
                    </button>
                  ))}
                </div>
              </div>

              {wallet && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="rounded-2xl border border-border bg-white p-4">
                      <QRCodeCanvas address={wallet.address} size={180} />
                    </div>
                  </div>

                  {/* Wallet address */}
                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-xs text-muted-foreground mb-1">Send exactly {fmt(Number(t.amount))} worth of {wallet.currency} to:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 break-all rounded bg-background px-3 py-2 text-xs font-mono border border-border">
                        {wallet.address}
                      </code>
                      <Button size="icon" variant="outline" onClick={copyAddress}>
                        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Network: <span className="font-medium text-foreground">{wallet.network}</span></p>
                    {wallet.instructions && (
                      <p className="mt-2 text-xs text-muted-foreground">{wallet.instructions}</p>
                    )}
                  </div>

                  <Button
                    onClick={() => payMut.mutate()}
                    disabled={payMut.isPending}
                    className="h-11 w-full bg-amber text-navy-deep hover:bg-amber-soft"
                  >
                    {payMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
                    I have sent the payment
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={() => setShowOnRamp(true)}
                      className="text-sm text-navy-deep underline hover:text-navy font-medium"
                    >
                      Don't have {wallet.currency}? Buy with card
                    </button>
                  </div>
                </motion.div>
              )}

              {(wallets.data ?? []).length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No digital currency wallets configured. Contact support.</p>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* On-Ramp Modal */}
      {showOnRamp && wallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowOnRamp(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="font-display text-xl font-bold">Buy {wallet.currency}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Purchase {wallet.currency} with your card. Funds will be sent directly to the payment address.
            </p>

            <div className="mt-5 space-y-3">
              <div className="grid gap-1.5">
                <Label>Amount (USD)</Label>
                <Input type="number" defaultValue={Number(t.amount).toFixed(2)} className="h-11" readOnly />
              </div>
              <div className="grid gap-1.5">
                <Label>Receiving address</Label>
                <Input value={wallet.address} className="h-11 font-mono text-xs" readOnly />
              </div>
              <div className="grid gap-1.5">
                <Label>Card number</Label>
                <Input placeholder="4242 4242 4242 4242" className="h-11 font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>Expiry</Label><Input placeholder="MM/YY" className="h-11" /></div>
                <div className="grid gap-1.5"><Label>CVC</Label><Input placeholder="123" className="h-11" type="password" /></div>
              </div>
            </div>

            <Button
              className="mt-5 h-11 w-full bg-amber text-navy-deep hover:bg-amber-soft"
              onClick={() => {
                toast.success(`Simulated purchase of ${wallet.currency} complete. Proceed with your payment.`);
                setShowOnRamp(false);
              }}
            >
              Buy {wallet.currency} and Pay
            </Button>

            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              This is a simulated on-ramp. In production, this connects to a third-party provider.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function QRCodeCanvas({ address, size }: { address: string; size: number }) {
  // Simple deterministic visual QR placeholder based on address hash
  const grid = 11;
  const cellSize = size / grid;
  const cells: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = ((hash << 5) - hash + address.charCodeAt(i)) | 0;
  }
  for (let r = 0; r < grid; r++) {
    cells[r] = [];
    for (let c = 0; c < grid; c++) {
      // Finder patterns in corners
      const isFinderRow = r < 3 || r >= grid - 3;
      const isFinderCol = c < 3 || c >= grid - 3;
      if ((isFinderRow && c < 3) || (isFinderRow && c >= grid - 3) || (r < 3 && isFinderCol)) {
        const isOuter = r === 0 || r === 2 || r === grid - 1 || r === grid - 3 || c === 0 || c === 2 || c === grid - 1 || c === grid - 3;
        const isCenter = (r === 1 && c === 1) || (r === 1 && c === grid - 2) || (r === grid - 2 && c === 1);
        cells[r][c] = isOuter || isCenter;
      } else {
        hash = ((hash << 5) - hash + r * grid + c) | 0;
        cells[r][c] = (Math.abs(hash) % 3) !== 0;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" />
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#0b1220" /> : null
        )
      )}
    </svg>
  );
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string | null }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  if (!expiresAt) return null;
  return (
    <p className="mt-3 text-sm font-mono">
      <Clock className="mr-1 inline h-3.5 w-3.5" />
      {remaining === "Expired" ? <span className="text-destructive">Payment window expired</span> : <span>Expires in {remaining}</span>}
    </p>
  );
}
