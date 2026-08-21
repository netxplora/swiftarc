import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Trash2, ToggleLeft } from "lucide-react";
import type { PlatformFee } from "@/hooks/usePlatformSettings";

export function FeesForm({ initialData }: { initialData: PlatformFee[] }) {
  const [fees] = useState<PlatformFee[]>(initialData || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" /> Platform Fees
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage processing fees, surcharges, and platform commissions.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-border dark:border-border text-secondary dark:text-foreground h-9 text-sm rounded-[4px]"
          disabled
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Fee
        </Button>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card shadow-[0_2px_4px_rgba(0,0,0,0.07)] overflow-hidden">
        {fees.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <DollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">No platform fees configured</p>
            <p className="text-sm mt-1">
              Fees defined here are applied to shipments during checkout.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-border bg-muted dark:bg-muted/30">
                <th className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
                  Fee Name
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
                  Type
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
                  Value
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
                  Min
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
                  Max
                </th>
                <th className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
                  Status
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr
                  key={fee.id}
                  className="border-b border-border dark:border-border last:border-0 hover:bg-muted/60 dark:hover:bg-muted/20 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-foreground">
                    {fee.name}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs rounded-[4px] ${
                        fee.fee_type === "percentage"
                          ? "border-accent/40 text-accent"
                          : "border-primary/40 text-primary"
                      }`}
                    >
                      {fee.fee_type === "percentage" ? "%" : "$"} {fee.fee_type}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-mono">
                    {fee.fee_type === "percentage"
                      ? `${fee.value}%`
                      : `$${Number(fee.value).toFixed(2)}`}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                    {fee.min_amount != null ? `$${Number(fee.min_amount).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                    {fee.max_amount != null ? `$${Number(fee.max_amount).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Badge
                      variant={fee.is_active ? "default" : "secondary"}
                      className={`text-xs rounded-[4px] ${
                        fee.is_active
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {fee.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-accent"
                        disabled
                      >
                        <ToggleLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-error"
                        disabled
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
