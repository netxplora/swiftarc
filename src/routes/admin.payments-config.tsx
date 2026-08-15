/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Wallet,
  CreditCard,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminGetCryptoAssets,
  adminUpsertCryptoAsset,
  adminGetPurchaseProviders,
  adminUpsertPurchaseProvider,
} from "@/lib/payment.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/payments-config")({
  head: () => ({ meta: [{ title: "Payment Config — Admin SwiftArc" }] }),
  component: PaymentsConfigPage,
});

function PaymentsConfigPage() {
  const qc = useQueryClient();
  const getAssetsFn = useServerFn(adminGetCryptoAssets);
  const upsertAssetFn = useServerFn(adminUpsertCryptoAsset);
  const getProvidersFn = useServerFn(adminGetPurchaseProviders);
  const upsertProviderFn = useServerFn(adminUpsertPurchaseProvider);

  const { data: assets, isLoading: loadingAssets } = useQuery({
    queryKey: ["admin-crypto-assets"],
    queryFn: () => getAssetsFn(),
  });

  const { data: providers, isLoading: loadingProviders } = useQuery({
    queryKey: ["admin-crypto-providers"],
    queryFn: () => getProvidersFn(),
  });

  const saveAssetMut = useMutation({
    mutationFn: (data: any) => upsertAssetFn({ data }),
    onSuccess: () => {
      toast.success("Asset saved successfully");
      qc.invalidateQueries({ queryKey: ["admin-crypto-assets"] });
      setEditingAsset(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to save asset"),
  });

  const saveProviderMut = useMutation({
    mutationFn: (data: any) => upsertProviderFn({ data }),
    onSuccess: () => {
      toast.success("Provider saved successfully");
      qc.invalidateQueries({ queryKey: ["admin-crypto-providers"] });
      setEditingProvider(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to save provider"),
  });

  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [editingProvider, setEditingProvider] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Payment Configuration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage digital currency assets, wallet addresses, and third-party purchase providers for
          clearance payments.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Assets List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-amber" /> Supported Assets
            </h2>
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() =>
                setEditingAsset({
                  asset_name: "",
                  symbol: "",
                  network: "",
                  wallet_address: "",
                  is_active: true,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add Asset
            </Button>
          </div>

          {loadingAssets ? (
            <div className="animate-pulse bg-muted h-32 rounded-xl" />
          ) : (
            <div className="space-y-3">
              {assets?.map((asset: any) => (
                <div
                  key={asset.id}
                  className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{asset.symbol}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${asset.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                      >
                        {asset.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {asset.asset_name} • {asset.network}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground/70 break-all">
                      {asset.wallet_address}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setEditingAsset(asset)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {assets?.length === 0 && (
                <div className="text-center p-8 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
                  No assets configured.
                </div>
              )}
            </div>
          )}

          {editingAsset && (
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-sm">
                {editingAsset.id ? "Edit Asset" : "New Asset"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold">Asset Name</label>
                  <Input
                    value={editingAsset.asset_name}
                    onChange={(e) =>
                      setEditingAsset({ ...editingAsset, asset_name: e.target.value })
                    }
                    placeholder="e.g. Tether USD"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Symbol</label>
                  <Input
                    value={editingAsset.symbol}
                    onChange={(e) => setEditingAsset({ ...editingAsset, symbol: e.target.value })}
                    placeholder="e.g. USDT"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Network</label>
                  <Input
                    value={editingAsset.network}
                    onChange={(e) => setEditingAsset({ ...editingAsset, network: e.target.value })}
                    placeholder="e.g. TRC20"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold">Wallet Address</label>
                  <Input
                    value={editingAsset.wallet_address}
                    onChange={(e) =>
                      setEditingAsset({ ...editingAsset, wallet_address: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activeAsset"
                    checked={editingAsset.is_active}
                    onChange={(e) =>
                      setEditingAsset({ ...editingAsset, is_active: e.target.checked })
                    }
                  />
                  <label htmlFor="activeAsset" className="text-sm">
                    Active (Visible to customers)
                  </label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setEditingAsset(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={saveAssetMut.isPending}
                  onClick={() => saveAssetMut.mutate(editingAsset)}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Providers List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber" /> Third-Party Providers
            </h2>
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() =>
                setEditingProvider({
                  provider_name: "",
                  website_url: "",
                  customer_facing_description: "",
                  instructions: "",
                  is_active: true,
                })
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add Provider
            </Button>
          </div>

          {loadingProviders ? (
            <div className="animate-pulse bg-muted h-32 rounded-xl" />
          ) : (
            <div className="space-y-3">
              {providers?.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base">{p.provider_name}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${p.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <a
                      href={p.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline block mb-2"
                    >
                      {p.website_url}
                    </a>
                    <p className="text-xs text-muted-foreground">{p.customer_facing_description}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setEditingProvider(p)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {providers?.length === 0 && (
                <div className="text-center p-8 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
                  No providers configured.
                </div>
              )}
            </div>
          )}

          {editingProvider && (
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-sm">
                {editingProvider.id ? "Edit Provider" : "New Provider"}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-semibold">Provider Name</label>
                  <Input
                    value={editingProvider.provider_name}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, provider_name: e.target.value })
                    }
                    placeholder="e.g. MoonPay"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Website URL</label>
                  <Input
                    value={editingProvider.website_url}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, website_url: e.target.value })
                    }
                    placeholder="e.g. https://moonpay.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Customer Description</label>
                  <Input
                    value={editingProvider.customer_facing_description}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        customer_facing_description: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Instructions for user</label>
                  <Input
                    value={editingProvider.instructions}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, instructions: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activeProvider"
                    checked={editingProvider.is_active}
                    onChange={(e) =>
                      setEditingProvider({ ...editingProvider, is_active: e.target.checked })
                    }
                  />
                  <label htmlFor="activeProvider" className="text-sm">
                    Active (Visible to customers)
                  </label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setEditingProvider(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={saveProviderMut.isPending}
                  onClick={() => saveProviderMut.mutate(editingProvider)}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
