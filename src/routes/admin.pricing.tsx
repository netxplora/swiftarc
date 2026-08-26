/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import {
  DollarSign,
  Sliders,
  Save,
  Percent,
  Truck,
  Bike,
  Package,
  Globe,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetPricingRules, adminUpdatePricingRules } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/pricing")({
  head: () => ({ meta: [{ title: "Pricing Engine Rules — Admin SwiftArc" }] }),
  component: AdminPricingPage,
});

const VEHICLE_RATES_DEFAULT = [
  { type: "Motorcycle / Bike", icon: "🏍️", key: "bike", maxWeight: 25, capacity: "Up to 25 kg" },
  { type: "Cargo Van", icon: "🚐", key: "van", maxWeight: 500, capacity: "Up to 500 kg" },
  { type: "Box Truck", icon: "🚛", key: "box_truck", maxWeight: 2500, capacity: "Up to 2,500 kg" },
  {
    type: "Semi-Truck / Freight",
    icon: "🚚",
    key: "freight_semi",
    maxWeight: 20000,
    capacity: "Up to 20,000 kg",
  },
];

const ZONE_DEFAULTS = [
  { zone: "Urban Core", key: "urban", description: "City centre and metro areas" },
  { zone: "Suburban", key: "suburban", description: "Greater metro and surrounding suburbs" },
  { zone: "Regional", key: "regional", description: "Interstate and rural corridors" },
  { zone: "International", key: "international", description: "Cross-border shipments" },
];

function AdminPricingPage() {
  const qc = useQueryClient();
  const getRules = useServerFn(adminGetPricingRules);
  const updateRules = useServerFn(adminUpdatePricingRules);

  const { data: rules, isLoading } = useQuery({
    queryKey: ["admin-pricing-rules"],
    queryFn: () => getRules(),
  });

  const [baseFee, setBaseFee] = useState(25);
  const [perKmRate, setPerKmRate] = useState(1.85);
  const [perKgRate, setPerKgRate] = useState(2.5);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.15);
  const [insuranceRate, setInsuranceRate] = useState(0.8);
  const [hazmatSurcharge, setHazmatSurcharge] = useState(45);
  const [taxRate, setTaxRate] = useState(7.5);
  const [signatureFee, setSignatureFee] = useState(4.5);
  const [carbonRate, setCarbonRate] = useState(0.001);
  const [vehicleRates, setVehicleRates] = useState<Record<string, any>>({});
  const [zoneMultipliers, setZoneMultipliers] = useState<Record<string, number>>({});

  // Sync form state when data loads
  useEffect(() => {
    if (!rules) return;
    setBaseFee(Number(rules.base_fee));
    setPerKmRate(Number(rules.per_km_rate));
    setPerKgRate(Number(rules.per_kg_rate));
    setSurgeMultiplier(Number(rules.surge_multiplier));
    setInsuranceRate(Number(rules.insurance_rate));
    setHazmatSurcharge(Number(rules.hazmat_surcharge));
    setTaxRate(Number(rules.tax_rate));
    setSignatureFee(Number(rules.signature_fee));
    setCarbonRate(Number(rules.carbon_offset_per_km_kg));
    setVehicleRates(
      typeof rules.vehicle_rates === "object" ? (rules.vehicle_rates as Record<string, any>) : {},
    );
    setZoneMultipliers(
      typeof rules.zone_multipliers === "object"
        ? (rules.zone_multipliers as Record<string, number>)
        : {},
    );
  }, [rules]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateRules({
        data: {
          base_fee: baseFee,
          per_km_rate: perKmRate,
          per_kg_rate: perKgRate,
          surge_multiplier: surgeMultiplier,
          insurance_rate: insuranceRate,
          hazmat_surcharge: hazmatSurcharge,
          tax_rate: taxRate,
          signature_fee: signatureFee,
          carbon_offset_per_km_kg: carbonRate,
          vehicle_rates: vehicleRates,
          zone_multipliers: zoneMultipliers,
        },
      }),
    onSuccess: () => {
      toast.success("Pricing engine rules saved to database.");
      qc.invalidateQueries({ queryKey: ["admin-pricing-rules"] });
    },
    onError: () => toast.error("Failed to save pricing rules."),
  });

  const fmt = (val: number) => `$${val.toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Pricing Engine</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure base rates, distance multipliers, weight surcharges, vehicle tariffs, and zone
            rules. Changes are saved to the database and take effect immediately.
          </p>
        </div>
        {rules?.updated_at && (
          <p className="text-xs text-muted-foreground hidden sm:block">
            Last saved: {new Date(rules.updated_at).toLocaleString()}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
        className="space-y-8"
      >
        {/* Base Tariff Rules */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
            <Sliders className="h-5 w-5 text-primary" /> Base Tariff Rules
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-5">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Base Dispatch Fee (USD)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Distance Rate per KM (USD)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={perKmRate}
                onChange={(e) => setPerKmRate(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Weight Charge per KG (USD)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={perKgRate}
                onChange={(e) => setPerKgRate(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Peak / Surge Multiplier
              </Label>
              <Input
                type="number"
                step="0.05"
                value={surgeMultiplier}
                onChange={(e) => setSurgeMultiplier(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Insurance Coverage Fee (%)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={insuranceRate}
                onChange={(e) => setInsuranceRate(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Hazmat Surcharge (USD)
              </Label>
              <Input
                type="number"
                step="1"
                value={hazmatSurcharge}
                onChange={(e) => setHazmatSurcharge(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Tax Rate (%)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Signature Fee (USD)
              </Label>
              <Input
                type="number"
                step="0.50"
                value={signatureFee}
                onChange={(e) => setSignatureFee(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Carbon Offset (per km·kg)
              </Label>
              <Input
                type="number"
                step="0.0001"
                value={carbonRate}
                onChange={(e) => setCarbonRate(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Category Rate Table */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
            <Truck className="h-5 w-5 text-primary" /> Vehicle Category Rates
          </h2>
          <div className="overflow-x-auto mt-4">
            <div className="overflow-x-auto w-full pb-4">
              <table className="w-full min-w-[600px] text-sm text-left">
                <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vehicle Type</th>
                    <th className="px-4 py-3 font-medium">Base Rate</th>
                    <th className="px-4 py-3 font-medium">Per KM</th>
                    <th className="px-4 py-3 font-medium">Per KG</th>
                    <th className="px-4 py-3 font-medium">Max Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {VEHICLE_RATES_DEFAULT.map((v) => {
                    const rates = vehicleRates[v.key] || {};
                    return (
                      <tr key={v.key} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">
                          <span className="mr-2">{v.icon}</span> {v.type}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            step="0.5"
                            className="w-24 h-8 text-xs"
                            value={rates.base ?? 0}
                            onChange={(e) =>
                              setVehicleRates({
                                ...vehicleRates,
                                [v.key]: { ...rates, base: Number(e.target.value) },
                              })
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            step="0.1"
                            className="w-24 h-8 text-xs"
                            value={rates.perKm ?? 0}
                            onChange={(e) =>
                              setVehicleRates({
                                ...vehicleRates,
                                [v.key]: { ...rates, perKm: Number(e.target.value) },
                              })
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            step="0.1"
                            className="w-24 h-8 text-xs"
                            value={rates.perKg ?? 0}
                            onChange={(e) =>
                              setVehicleRates({
                                ...vehicleRates,
                                [v.key]: { ...rates, perKg: Number(e.target.value) },
                              })
                            }
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{v.capacity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Zone Multipliers */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
            <Globe className="h-5 w-5 text-primary" /> Zone Multipliers
          </h2>
          <div className="overflow-x-auto mt-4">
            <div className="overflow-x-auto w-full pb-4">
              <table className="w-full min-w-[600px] text-sm text-left">
                <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Zone</th>
                    <th className="px-4 py-3 font-medium">Multiplier</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ZONE_DEFAULTS.map((z) => (
                    <tr key={z.key} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{z.zone}</td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          step="0.05"
                          className="w-24 h-8 text-xs"
                          value={zoneMultipliers[z.key] ?? 1.0}
                          onChange={(e) =>
                            setZoneMultipliers({
                              ...zoneMultipliers,
                              [z.key]: Number(e.target.value),
                            })
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{z.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saveMut.isPending}
            className="bg-navy-deep text-cream hover:bg-navy font-medium"
          >
            {saveMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saveMut.isPending ? "Saving…" : "Save Pricing Rules"}
          </Button>
        </div>
      </form>
    </div>
  );
}
