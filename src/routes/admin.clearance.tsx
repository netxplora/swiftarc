/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Loader2,
  ExternalLink,
  Clock,
  BadgeDollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminVerifyPaymentSubmission, adminGetCryptoAssets } from "@/lib/payment.functions";
import { adminListCustomsCases, adminGetPaymentSubmissions } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/clearance")({
  head: () => ({
    meta: [{ title: "Admin — Clearance Payments" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminClearancePage,
});

function statusColor(s: string) {
  switch (s) {
    case "verified":
      return "bg-green-100 text-green-800 border-green-200";
    case "verification_required":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "underpaid":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "overpaid":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function holdStatusColor(s: string) {
  switch (s) {
    case "payment_required":
      return "bg-red-100 text-red-800";
    case "payment_verification":
      return "bg-amber-100 text-amber-800";
    case "clearance_processing":
      return "bg-blue-100 text-blue-800";
    case "cleared":
      return "bg-green-100 text-green-800";
    case "released":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function AdminClearancePage() {
  const qc = useQueryClient();
  const verifyFn = useServerFn(adminVerifyPaymentSubmission);
  const getSubmissions = useServerFn(adminGetPaymentSubmissions);

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [verifyNote, setVerifyNote] = useState("");

  const submissionsQ = useQuery({
    queryKey: ["admin-payment-submissions"],
    queryFn: () => getSubmissions(),
  });

  const verifyMut = useMutation({
    mutationFn: (vars: Parameters<typeof verifyFn>[0]) => verifyFn(vars),
    onSuccess: () => {
      toast.success("Payment decision recorded.");
      qc.invalidateQueries({ queryKey: ["admin-payment-submissions"] });
      setExpandedId(null);
      setVerifyNote("");
    },
    onError: (e: any) => toast.error(e.message || "Failed to update payment"),
  });

  const submissions: any[] = submissionsQ.data ?? [];

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.transaction_hash?.toLowerCase().includes(q) ||
      s.network?.toLowerCase().includes(q) ||
      s.customs_holds?.shipments?.tracking_number?.toLowerCase().includes(q)
    );
  });

  const pending = submissions.filter((s) => s.status === "verification_required").length;
  const verified = submissions.filter((s) => s.status === "verified").length;
  const issues = submissions.filter((s) =>
    ["rejected", "underpaid", "overpaid"].includes(s.status),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber" />
          Clearance Payments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and verify digital currency payment submissions for customs clearance cases.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Awaiting Review
          </p>
          <p className="text-3xl font-bold text-amber">{pending}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Verified</p>
          <p className="text-3xl font-bold text-green-600">{verified}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Requires Action
          </p>
          <p className="text-3xl font-bold text-red-600">{issues}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by TXID, network, or tracking number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Submissions List */}
      {submissionsQ.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin h-5 w-5 mr-2" />
          Loading submissions…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BadgeDollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No payment submissions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const hold = sub.customs_holds;
            const shipment = hold?.shipments;
            const asset = sub.digital_currency_assets;
            const isExpanded = expandedId === sub.id;

            return (
              <div key={sub.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Summary row */}
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusColor(sub.status)}`}
                    >
                      {sub.status?.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-medium truncate">
                        {sub.transaction_hash}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shipment?.tracking_number ?? "—"} · {asset?.symbol ?? "—"} / {sub.network}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold">
                        {Number(sub.amount_claimed).toFixed(6)} {asset?.symbol}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded verification panel */}
                {isExpanded && (
                  <div className="border-t border-border p-5 bg-muted/20 space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Shipment</p>
                        <p className="font-medium">{shipment?.tracking_number ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Hold Amount Due</p>
                        <p className="font-semibold text-amber">
                          {hold?.currency} {Number(hold?.amount_due).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Hold Status</p>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${holdStatusColor(hold?.status)}`}
                        >
                          {hold?.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Asset</p>
                        <p className="font-medium">
                          {asset?.symbol} / {sub.network}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Amount Claimed</p>
                        <p className="font-semibold">
                          {Number(sub.amount_claimed).toFixed(6)} {asset?.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Wallet</p>
                        <p className="font-mono text-xs truncate">{asset?.wallet_address ?? "—"}</p>
                      </div>
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-xs text-muted-foreground mb-0.5">Transaction Hash</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs break-all">{sub.transaction_hash}</p>
                          <a
                            href={`https://tronscan.org/#/transaction/${sub.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline shrink-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Submitted</p>
                        <p className="text-xs">{new Date(sub.submitted_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {sub.status === "verification_required" && (
                      <div className="space-y-3 border-t border-border pt-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-1">
                            Verification Notes (optional)
                          </label>
                          <Input
                            value={verifyNote}
                            onChange={(e) => setVerifyNote(e.target.value)}
                            placeholder="E.g., Transaction confirmed on blockchain, amount matches…"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={verifyMut.isPending}
                            onClick={() =>
                              verifyMut.mutate({
                                data: {
                                  submission_id: sub.id,
                                  status: "verified",
                                  notes: verifyNote,
                                },
                              })
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            Verify Payment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-400 text-orange-700 hover:bg-orange-50"
                            disabled={verifyMut.isPending}
                            onClick={() =>
                              verifyMut.mutate({
                                data: {
                                  submission_id: sub.id,
                                  status: "underpaid",
                                  notes: verifyNote,
                                },
                              })
                            }
                          >
                            <AlertTriangle className="h-4 w-4 mr-1.5" />
                            Mark Underpaid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-400 text-purple-700 hover:bg-purple-50"
                            disabled={verifyMut.isPending}
                            onClick={() =>
                              verifyMut.mutate({
                                data: {
                                  submission_id: sub.id,
                                  status: "overpaid",
                                  notes: verifyNote,
                                },
                              })
                            }
                          >
                            <AlertTriangle className="h-4 w-4 mr-1.5" />
                            Mark Overpaid
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={verifyMut.isPending}
                            onClick={() =>
                              verifyMut.mutate({
                                data: {
                                  submission_id: sub.id,
                                  status: "rejected",
                                  notes: verifyNote,
                                },
                              })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {sub.status !== "verification_required" && (
                      <div className="border-t border-border pt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Decision recorded
                        {sub.verified_at ? ` on ${new Date(sub.verified_at).toLocaleString()}` : ""}
                        .{sub.notes && <span className="ml-1 italic">"{sub.notes}"</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
