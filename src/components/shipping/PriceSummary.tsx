import { CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  priceBreakdown: any | null;
  isLoading: boolean;
  distanceKm: number | null;
  travelTime: string | null;
}

export function PriceSummary({ priceBreakdown, isLoading, distanceKm, travelTime }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    );
  }

  if (!priceBreakdown) {
    return (
      <div className="bg-secondary/50 rounded-lg p-6 text-center text-muted-foreground text-sm">
        Enter all origin, destination, and package details to calculate pricing.
      </div>
    );
  }

  const { breakdown, total, error } = priceBreakdown;

  if (error) {
    return (
      <div className="bg-red-50 text-red-900 p-4 rounded-lg flex gap-3 text-sm border border-red-200">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-secondary/30 border-b flex justify-between items-center text-sm">
        <div className="flex gap-4">
          {distanceKm !== null && (
            <div>
              <span className="text-muted-foreground">Est. Distance:</span>{" "}
              <span className="font-medium">{distanceKm} km</span>
            </div>
          )}
          {travelTime && (
            <div>
              <span className="text-muted-foreground">Est. Travel:</span>{" "}
              <span className="font-medium">{travelTime}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Base Fee</span>
          <span>${breakdown.base_fee.toFixed(2)}</span>
        </div>

        {breakdown.distance_charge > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Distance Charge</span>
            <span>${breakdown.distance_charge.toFixed(2)}</span>
          </div>
        )}

        {breakdown.weight_charge > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Weight Charge</span>
            <span>${breakdown.weight_charge.toFixed(2)}</span>
          </div>
        )}

        {breakdown.insurance_charge > 0 && (
          <div className="flex justify-between items-center text-amber-600">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Insurance
            </span>
            <span>${breakdown.insurance_charge.toFixed(2)}</span>
          </div>
        )}

        {breakdown.hazmat_charge > 0 && (
          <div className="flex justify-between items-center text-red-600">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Hazmat Surcharge
            </span>
            <span>${breakdown.hazmat_charge.toFixed(2)}</span>
          </div>
        )}

        {breakdown.signature_charge > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Signature Fee</span>
            <span>${breakdown.signature_charge.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t pt-3 mt-3 flex justify-between items-center">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${breakdown.subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Tax ({breakdown.tax_rate}%)</span>
          <span>${breakdown.tax.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-navy text-cream p-5 flex justify-between items-center">
        <span className="font-medium text-lg">Total Shipping Fee</span>
        <span className="font-display text-2xl font-bold">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
