/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Copy,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
  ScanLine,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  customerCreatePaymentQuote,
  customerSubmitTransaction,
  adminGetCryptoAssets,
  adminGetPurchaseProviders,
} from "@/lib/payment.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pay/$caseId")({
  head: () => ({ meta: [{ title: "Customs Clearance Payment — SwiftArc" }] }),
  component: PaymentPortal,
});

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Expired");
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const expired = remaining === "Expired";
  return (
    <span className={`font-mono font-bold ${expired ? "text-red-500" : "text-amber-500"}`}>
      {remaining}
    </span>
  );
}

function PaymentPortal() {
  const { caseId } = useParams({ from: "/pay/$caseId" });
  const getAssets = useServerFn(adminGetCryptoAssets);
  const getProviders = useServerFn(adminGetPurchaseProviders);
  const createQuoteFn = useServerFn(customerCreatePaymentQuote);
  const submitTxFn = useServerFn(customerSubmitTransaction);

  const [hold, setHold] = useState<any>(null);
  const [holdLoading, setHoldLoading] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [quote, setQuote] = useState<any>(null);
  const [txHash, setTxHash] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"crypto" | "buy">("crypto");

  useEffect(() => {
    supabase
      .from("customs_holds")
      .select("*, shipments(tracking_number, origin, destination)")
      .eq("id", caseId)
      .single()
      .then(({ data, error }) => {
        if (!error) setHold(data);
        setHoldLoading(false);
      });
  }, [caseId]);

  const assetsQ = useQuery({
    queryKey: ["crypto-assets-public"],
    queryFn: () => getAssets(),
  });

  const providersQ = useQuery({
    queryKey: ["crypto-providers-public"],
    queryFn: () => getProviders(),
  });

  const assets: any[] = (assetsQ.data ?? []).filter((a: any) => a.is_active);
  const providers: any[] = (providersQ.data ?? []).filter((p: any) => p.is_active);
  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const createQuoteMut = useMutation({
    mutationFn: () =>
      createQuoteFn({
        data: { customs_hold_id: caseId, asset_id: selectedAssetId },
      }),
    onSuccess: (res: any) => {
      setQuote(res.quote);
    },
    onError: (e: any) => toast.error(e.message || "Failed to generate quote"),
  });

  const submitMut = useMutation({
    mutationFn: () =>
      submitTxFn({
        data: { quote_id: quote.id, transaction_hash: txHash },
      }),
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Payment submitted. Our team will verify your transaction shortly.");
    },
    onError: (e: any) => toast.error(e.message || "Failed to submit transaction"),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (holdLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (!hold) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center bg-card p-10 rounded-3xl shadow-sm border border-border">
          <ShieldAlert className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-foreground">Case Not Found</h2>
          <p className="text-muted-foreground">
            This clearance case does not exist or has expired.
          </p>
        </div>
      </div>
    );
  }

  if (submitted || hold.payment_status === "verification_required") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 bg-card rounded-3xl border border-border shadow-2xl shadow-emerald-900/5 p-10 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto shadow-inner border border-emerald-100 dark:border-emerald-500/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            Payment Submitted
          </h2>
          <p className="text-muted-foreground">
            Your transaction has been received and is awaiting verification by our global clearance
            team. You will be notified once your payment is confirmed and your shipment is cleared.
          </p>
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300 shadow-sm">
            Status: <strong>Awaiting Verification</strong>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Reference ID: <span className="font-mono tracking-wider">{caseId}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 space-y-3">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
            Customs Clearance Required
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Action is required to release your shipment{" "}
            <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
              {hold.shipments?.tracking_number}
            </span>{" "}
            from customs holds.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Case Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card rounded-3xl border border-border shadow-xl shadow-border/20 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldAlert className="w-48 h-48 text-red-500 rotate-12" />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-500/20 shadow-sm">
                    <ShieldAlert className="h-7 w-7 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Hold Summary</h2>
                    <p className="text-sm text-muted-foreground">
                      Review the charges before payment.
                    </p>
                  </div>
                </div>

                <div className="bg-muted rounded-2xl p-5 border border-border space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Total Amount Due
                    </p>
                    <p className="text-4xl font-black text-amber-500 tracking-tight">
                      {hold.currency} {Number(hold.amount_due).toFixed(2)}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Responsibility
                      </p>
                      <p className="font-semibold text-foreground capitalize">
                        {hold.payment_responsibility}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Status
                      </p>
                      <p className="font-semibold text-red-600 capitalize">Payment Required</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Hold Reason
                    </p>
                    <p className="font-medium text-foreground leading-relaxed">
                      {hold.hold_reason}
                    </p>
                  </div>

                  {hold.required_action && (
                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 shadow-sm">
                      <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                        Required Document
                      </p>
                      <p className="font-medium text-blue-900 leading-relaxed">
                        {hold.required_action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Help box */}
            <div className="bg-navy-deep text-cream/80 rounded-3xl p-8 shadow-xl">
              <h3 className="text-cream font-bold text-lg mb-2">Need Assistance?</h3>
              <p className="text-sm mb-6 leading-relaxed text-cream/60">
                Our customs brokerage team is available 24/7 to assist you with clearance and
                payment issues.
              </p>
              <Button
                variant="outline"
                className="w-full border-cream/20 hover:bg-navy hover:text-cream bg-transparent text-cream rounded-xl"
              >
                Contact Support
              </Button>
            </div>
          </div>

          {/* Right Column: Payment Tabs */}
          <div className="lg:col-span-7 bg-card rounded-3xl border border-border shadow-xl shadow-border/20 overflow-hidden flex flex-col min-h-[600px]">
            <div className="flex border-b border-border bg-muted/50 p-2 gap-2">
              <button
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl transition-all ${
                  activeTab === "crypto"
                    ? "bg-card text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setActiveTab("crypto")}
              >
                <Wallet className="h-4 w-4" />
                Pay with Digital Currency
              </button>
              <button
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 rounded-2xl transition-all ${
                  activeTab === "buy"
                    ? "bg-card text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setActiveTab("buy")}
              >
                <CreditCard className="h-4 w-4" />
                Buy Digital Currency
              </button>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              {/* ---- Crypto Pay Tab ---- */}
              {activeTab === "crypto" && (
                <div className="flex-1 flex flex-col space-y-6">
                  {!quote ? (
                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                      <div className="text-center space-y-2 mb-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ScanLine className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">
                          Select Global Payment Asset
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Choose the digital currency network you wish to use for payment. We
                          automatically convert the equivalent amount.
                        </p>
                      </div>

                      {assetsQ.isLoading ? (
                        <div className="flex items-center justify-center gap-3 text-muted-foreground py-10">
                          <Loader2 className="animate-spin h-6 w-6" />{" "}
                          <span className="font-medium">Loading assets…</span>
                        </div>
                      ) : assets.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">
                          No digital currency options configured. Please contact support.
                        </p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {assets.map((asset) => (
                            <button
                              key={asset.id}
                              onClick={() => setSelectedAssetId(asset.id)}
                              className={`group rounded-2xl border-2 p-5 text-left transition-all ${
                                selectedAssetId === asset.id
                                  ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-md"
                                  : "border-border hover:border-primary/40 hover:bg-muted"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-black text-lg text-foreground group-hover:text-primary transition-colors">
                                  {asset.symbol}
                                </p>
                                <div
                                  className={`w-4 h-4 rounded-full border-2 ${selectedAssetId === asset.id ? "border-primary bg-primary" : "border-muted-foreground/30"}`}
                                />
                              </div>
                              <p className="text-sm font-medium text-muted-foreground">
                                {asset.network} Network
                              </p>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto pt-6">
                        <Button
                          className="w-full h-14 text-base font-bold rounded-2xl shadow-xl shadow-primary/20"
                          disabled={!selectedAssetId || createQuoteMut.isPending}
                          onClick={() => createQuoteMut.mutate()}
                        >
                          {createQuoteMut.isPending ? (
                            <>
                              <Loader2 className="animate-spin h-5 w-5 mr-2" /> Generating Quote…
                            </>
                          ) : (
                            <>
                              Generate Payment Invoice <ArrowRight className="h-5 w-5 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ---- Active Quote Flow ---- */
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col sm:flex-row gap-8">
                        {/* QR Code Section */}
                        <div className="sm:w-1/3 flex flex-col items-center gap-4">
                          <div className="bg-card p-4 rounded-3xl border border-border shadow-lg relative">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedAsset?.wallet_address}&margin=10`}
                              alt="Scan to pay"
                              className="w-full h-auto rounded-xl"
                            />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-3xl pointer-events-none"></div>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-200/60 dark:border-amber-500/20">
                            <Clock className="h-3.5 w-3.5" />
                            <CountdownTimer expiresAt={quote.expires_at} />
                          </div>
                        </div>

                        {/* Payment Instructions Section */}
                        <div className="sm:w-2/3 space-y-5">
                          <div className="space-y-1">
                            <h3 className="font-bold text-foreground text-lg">
                              Send exactly this amount:
                            </h3>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-black text-primary tracking-tight">
                                {Number(quote.crypto_amount).toFixed(6)}
                              </span>
                              <span className="text-xl font-bold text-muted-foreground">
                                {selectedAsset?.symbol}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                              on the{" "}
                              <strong className="text-foreground">{selectedAsset?.network}</strong>{" "}
                              network
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-foreground">
                              Global Payment Wallet Address
                            </h4>
                            <div className="flex items-center gap-2 bg-muted p-1.5 pl-4 rounded-xl border border-border focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                              <code className="font-mono text-sm text-foreground break-all flex-1 select-all py-2">
                                {selectedAsset?.wallet_address}
                              </code>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="shrink-0 h-10 w-10 rounded-lg hover:bg-muted"
                                onClick={() => copyToClipboard(selectedAsset?.wallet_address)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {selectedAsset?.instructions && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-blue-900 text-sm">
                              {selectedAsset.instructions}
                            </div>
                          )}

                          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-800 flex items-start gap-3 shadow-sm">
                            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                            <p>
                              Only send <strong>{selectedAsset?.symbol}</strong> on the{" "}
                              <strong>{selectedAsset?.network}</strong> network to this address.
                              Sending via any other network will result in permanent loss of funds.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Verification System */}
                      <div className="bg-navy-deep rounded-3xl p-8 text-cream shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 space-y-4">
                          <div>
                            <h3 className="text-xl font-bold">Payment Verification System</h3>
                            <p className="text-cream/60 text-sm mt-1">
                              Paste your transaction hash (TXID) below to verify your payment on the
                              blockchain.
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                              placeholder="e.g. 0x123abc..."
                              value={txHash}
                              onChange={(e) => setTxHash(e.target.value)}
                              className="bg-navy/50 border-navy text-cream placeholder:text-cream/40 h-14 rounded-xl px-5 flex-1 focus-visible:ring-primary"
                            />
                            <Button
                              className="h-14 px-8 font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all sm:w-auto w-full"
                              disabled={!txHash.trim() || submitMut.isPending}
                              onClick={() => submitMut.mutate()}
                            >
                              {submitMut.isPending ? (
                                <>
                                  <Loader2 className="animate-spin h-5 w-5 mr-2" /> Verifying…
                                </>
                              ) : (
                                "Verify Payment"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---- Buy Crypto Tab ---- */}
              {activeTab === "buy" && (
                <div className="flex-1 flex flex-col space-y-8 animate-in fade-in duration-300">
                  <div className="text-center max-w-sm mx-auto space-y-3">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CreditCard className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Buy Digital Currency</h3>
                    <p className="text-sm text-muted-foreground">
                      Use your credit card or bank account to purchase digital currency through our
                      integrated third-party providers.
                    </p>
                  </div>

                  {providersQ.isLoading ? (
                    <div className="flex items-center justify-center gap-3 text-muted-foreground py-10">
                      <Loader2 className="animate-spin h-6 w-6" />{" "}
                      <span className="font-medium">Loading providers…</span>
                    </div>
                  ) : providers.length === 0 ? (
                    <div className="bg-muted rounded-2xl p-8 text-center border border-border">
                      <p className="text-muted-foreground font-medium">
                        No purchase providers are currently configured. Please contact support.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {providers.map((p) => (
                        <div
                          key={p.id}
                          className="bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all rounded-2xl p-6"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="font-bold text-lg text-foreground">{p.provider_name}</p>
                              {p.customer_facing_description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {p.customer_facing_description}
                                </p>
                              )}
                            </div>
                            <a
                              href={p.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 w-full sm:w-auto"
                            >
                              <Button className="w-full sm:w-auto gap-2 rounded-xl" size="lg">
                                Buy Now <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                          {p.instructions && (
                            <div className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-xl border border-border">
                              <span className="font-semibold text-foreground">Instructions:</span>{" "}
                              {p.instructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-6 space-y-4">
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
                      <strong>Disclaimer:</strong> Digital currency purchases are processed by
                      external third-party providers. SwiftArc does not control the provider's
                      account verification, fees, availability, or transaction processing. SwiftArc
                      is not responsible for any issues arising from third-party purchases.
                    </div>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-14 rounded-xl font-bold border-border hover:bg-muted hover:text-primary"
                      onClick={() => setActiveTab("crypto")}
                    >
                      I already have digital currency
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
