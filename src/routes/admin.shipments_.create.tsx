/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Package,
  MapPin,
  ShieldCheck,
  Loader2,
  Navigation,
  AlertTriangle,
  Copy,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminCreateShipment,
  adminCalculateRoute,
  adminCalculatePrice,
} from "@/lib/admin.functions";
import { LocationPicker, type LocationData } from "@/components/shipping/LocationPicker";
import { OriginSelector } from "@/components/shipping/OriginSelector";
import { PriceSummary } from "@/components/shipping/PriceSummary";
import { PackageImageUpload } from "@/components/shipping/PackageImageUpload";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/shipments_/create")({
  component: AdminCreateShipmentPage,
});

function AdminCreateShipmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const createMut = useMutation({
    mutationFn: useServerFn(adminCreateShipment),
    onSuccess: (res: any) => {
      if (res.ok) {
        setCreatedShipment(res.shipment);
        setStep(6); // Success modal step
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to create shipment"),
  });

  const calculateRoute = useServerFn(adminCalculateRoute);
  const calculatePrice = useServerFn(adminCalculatePrice);

  // Form State
  const defaultLocation: LocationData = {
    contact_name: "",
    phone: "",
    email: "",
    country_code: "US",
    region: "",
    city: "",
    line1: "",
    postal_code: "",
    lat: null,
    lng: null,
  };
  const [origin, setOrigin] = useState<LocationData>({ ...defaultLocation });
  const [destination, setDestination] = useState<LocationData>({ ...defaultLocation });
  const [originSource, setOriginSource] = useState<"gps" | "branch" | "manual" | "map_adjustment">(
    "manual",
  );
  const [originBranchId, setOriginBranchId] = useState<string | undefined>();
  const [originAccuracy, setOriginAccuracy] = useState<number | undefined>();

  const [service, setService] = useState("Standard Delivery");
  const [pkg, setPkg] = useState({
    weight_kg: 1,
    length_cm: 10,
    width_cm: 10,
    height_cm: 10,
    pieces: 1,
    description: "",
  });
  const [packageImagePath, setPackageImagePath] = useState<string | undefined>();
  const [declaredValue, setDeclaredValue] = useState(0);
  const [insurance, setInsurance] = useState(false);
  const [isHazmat, setIsHazmat] = useState(false);
  const [signatureRequired, setSignatureRequired] = useState(false);

  // Route & Pricing State
  const [routeInfo, setRouteInfo] = useState<{
    distance_km: number;
    duration_text: string;
    source: string;
  } | null>(null);
  const [priceInfo, setPriceInfo] = useState<{
    breakdown: any;
    total: number;
    error?: string;
  } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  // Success State
  const [createdShipment, setCreatedShipment] = useState<any>(null);

  // Effect to calculate route when locations change
  useEffect(() => {
    if (origin.lat && origin.lng && destination.lat && destination.lng) {
      setIsCalculatingRoute(true);
      calculateRoute({
        data: {
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
        },
      })
        .then((res) => {
          if (res) setRouteInfo(res);
          setIsCalculatingRoute(false);
        })
        .catch(() => {
          setIsCalculatingRoute(false);
        });
    }
  }, [origin.lat, origin.lng, destination.lat, destination.lng, calculateRoute]);

  // Effect to calculate price when route or package details change
  useEffect(() => {
    if (routeInfo?.distance_km && pkg.weight_kg) {
      setIsCalculatingPrice(true);
      calculatePrice({
        data: {
          distance_km: routeInfo.distance_km,
          weight_kg: pkg.weight_kg,
          declared_value: declaredValue,
          insurance,
          is_hazmat: isHazmat,
          signature_required: signatureRequired,
        },
      })
        .then((res) => {
          if (res) setPriceInfo(res);
          setIsCalculatingPrice(false);
        })
        .catch(() => {
          setIsCalculatingPrice(false);
        });
    } else {
      setPriceInfo(null);
    }
  }, [
    routeInfo?.distance_km,
    pkg.weight_kg,
    declaredValue,
    insurance,
    isHazmat,
    signatureRequired,
    calculatePrice,
  ]);

  const handleSubmit = () => {
    if (!origin.city || !destination.city)
      return toast.error("Please provide valid origin and destination cities.");
    if (!routeInfo || !priceInfo)
      return toast.error("Cannot create shipment without pricing information.");

    createMut.mutate({
      data: {
        origin: origin,
        destination: destination,
        sender_info: origin,
        receiver_info: destination,
        service,
        package: pkg,
        declared_value: declaredValue,
        insurance,
        is_hazmat: isHazmat,
        signature_required: signatureRequired,
        verification_status: "verified", // Admin flows are pre-verified
        verification_notes: "Admin creation",
        origin_source: originSource,
        origin_branch_id: originBranchId,
        origin_accuracy_m: originAccuracy,
        distance_km: routeInfo.distance_km,
        estimated_travel_time: routeInfo.duration_text,
        shipping_fee: priceInfo.total,
        package_image_path: packageImagePath,
      },
    });
  };

  const handleCopyTracking = () => {
    if (createdShipment?.tracking_number) {
      navigator.clipboard.writeText(createdShipment.tracking_number);
      toast.success("Tracking number copied.");
    }
  };

  const validateStep1 = () => {
    if (!origin.city) {
      toast.error("Please confirm an origin location.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!origin.contact_name || !destination.contact_name) {
      toast.error("Sender and Receiver names are required.");
      return false;
    }
    if (!destination.city) {
      toast.error("Destination city is required.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!pkg.weight_kg || pkg.weight_kg <= 0) {
      toast.error("Valid weight is required.");
      return false;
    }
    if (!service) {
      toast.error("Please select a service.");
      return false;
    }
    return true;
  };

  const steps = [
    { num: 1, label: "Origin" },
    { num: 2, label: "Contacts" },
    { num: 3, label: "Package" },
    { num: 4, label: "Route" },
    { num: 5, label: "Review" },
  ];

  if (step === 6 && createdShipment) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8">
        <div className="bg-card border rounded-2xl p-8 shadow-lg text-center space-y-6">
          <div className="bg-green-100 text-green-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Shipment Created Successfully</h2>
            <p className="text-muted-foreground mt-2">
              The shipment has been registered and the first tracking event was created.
            </p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-6 relative">
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold mb-2">
              Tracking Number
            </p>
            <h3 className="font-display text-4xl font-bold tracking-wider">
              {createdShipment.tracking_number}
            </h3>
            <button
              onClick={handleCopyTracking}
              className="absolute top-4 right-4 p-2 bg-background border rounded-lg hover:bg-secondary transition-colors"
              title="Copy Tracking Number"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="border rounded-xl p-4 bg-background">
              <p className="text-xs text-muted-foreground uppercase">Origin</p>
              <p className="font-medium mt-1">
                {origin.city}, {origin.region}
              </p>
            </div>
            <div className="border rounded-xl p-4 bg-background">
              <p className="text-xs text-muted-foreground uppercase">Destination</p>
              <p className="font-medium mt-1">
                {destination.city}, {destination.region}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t justify-center">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate({ to: `/tracking/${createdShipment.tracking_number}` })}
            >
              <Navigation className="w-4 h-4" /> Track Shipment
            </Button>
            <Button variant="outline" className="gap-2">
              <Receipt className="w-4 h-4" /> Print Label
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                setStep(1);
                setCreatedShipment(null);
                setOrigin({ ...defaultLocation });
                setDestination({ ...defaultLocation });
              }}
            >
              Create Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/shipments" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Create New Shipment</h1>
          <p className="text-sm text-muted-foreground">Internal booking and registration flow.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b pb-6 overflow-x-auto">
          {steps.map((s, idx) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 flex-shrink-0 ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step >= s.num ? "border-primary bg-primary/10" : "border-border"}`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className="font-medium text-sm hidden sm:inline-block">{s.label}</span>
              {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 mx-2 text-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Origin */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-muted-foreground" /> Shipment Origin
            </h2>
            <OriginSelector
              value={origin}
              onChange={(patch) => setOrigin({ ...origin, ...patch })}
              onSourceChange={(src, bId, acc) => {
                setOriginSource(src);
                setOriginBranchId(bId);
                setOriginAccuracy(acc);
              }}
            />
            <div className="flex justify-end pt-4">
              <Button onClick={() => validateStep1() && setStep(2)}>Continue to Contacts</Button>
            </div>
          </div>
        )}

        {/* Step 2: Sender & Receiver */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-muted-foreground" /> Sender & Receiver Details
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-widest">
                  Sender Info
                </h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Sender Name"
                    value={origin.contact_name}
                    onChange={(e) => setOrigin({ ...origin, contact_name: e.target.value })}
                  />
                  <Input
                    placeholder="Sender Phone"
                    value={origin.phone}
                    onChange={(e) => setOrigin({ ...origin, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Sender Email"
                    type="email"
                    value={origin.email}
                    onChange={(e) => setOrigin({ ...origin, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <LocationPicker
                  value={destination}
                  onChange={(patch) => setDestination({ ...destination, ...patch })}
                  role="receiver"
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => validateStep2() && setStep(3)}>Continue to Package</Button>
            </div>
          </div>
        )}

        {/* Step 3: Package */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" /> Package Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Service Level</Label>
                  <select
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  >
                    <option value="Same Day / Next Day">Same Day / Next Day</option>
                    <option value="Express Delivery">Express Delivery</option>
                    <option value="Standard Delivery">Standard Delivery</option>
                    <option value="International Shipping">International Shipping</option>
                    <option value="Freight">Freight</option>
                    <option value="Special Handling">Special Handling</option>
                  </select>
                </div>
                <div>
                  <Label>Pieces</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pkg.pieces}
                    onChange={(e) => setPkg({ ...pkg, pieces: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={pkg.weight_kg}
                    onChange={(e) => setPkg({ ...pkg, weight_kg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Declared Value (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Dimensions (cm)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min={1}
                      placeholder="L"
                      value={pkg.length_cm}
                      onChange={(e) => setPkg({ ...pkg, length_cm: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="W"
                      value={pkg.width_cm}
                      onChange={(e) => setPkg({ ...pkg, width_cm: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="H"
                      value={pkg.height_cm}
                      onChange={(e) => setPkg({ ...pkg, height_cm: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description of Goods</Label>
                  <Input
                    value={pkg.description}
                    onChange={(e) => setPkg({ ...pkg, description: e.target.value })}
                    placeholder="E.g. Electronics, Clothing..."
                    className="mt-1"
                  />
                </div>
                <div className="pt-2 space-y-2">
                  <Label className="block mb-2">Options</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={insurance}
                      onChange={(e) => setInsurance(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />{" "}
                    Add Insurance
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isHazmat}
                      onChange={(e) => setIsHazmat(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />{" "}
                    Contains Hazmat
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={signatureRequired}
                      onChange={(e) => setSignatureRequired(e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />{" "}
                    Signature Required
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-2">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-widest mb-4">
                Package Photo (Optional)
              </h3>
              <div className="max-w-md">
                <PackageImageUpload value={packageImagePath} onChange={setPackageImagePath} />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => validateStep3() && setStep(4)}>
                Continue to Route & Pricing
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Route & Pricing */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Navigation className="w-5 h-5 text-muted-foreground" /> Route & Pricing
            </h2>

            <div className="max-w-xl mx-auto">
              <PriceSummary
                priceBreakdown={priceInfo}
                isLoading={isCalculatingRoute || isCalculatingPrice}
                distanceKm={routeInfo?.distance_km ?? null}
                travelTime={routeInfo?.duration_text ?? null}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button onClick={() => setStep(5)} disabled={!priceInfo || isCalculatingPrice}>
                Review Shipment
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Review Shipment Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-6 bg-secondary/20 p-6 rounded-xl border">
              <div>
                <h4 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                  Origin
                </h4>
                <p className="font-medium">{origin.contact_name}</p>
                <p className="text-sm">{origin.line1}</p>
                <p className="text-sm">
                  {origin.city}, {origin.region} {origin.postal_code}
                </p>
                <p className="text-sm">{origin.country_code}</p>
              </div>
              <div>
                <h4 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                  Destination
                </h4>
                <p className="font-medium">{destination.contact_name}</p>
                <p className="text-sm">{destination.line1}</p>
                <p className="text-sm">
                  {destination.city}, {destination.region} {destination.postal_code}
                </p>
                <p className="text-sm">{destination.country_code}</p>
              </div>
              <div className="sm:col-span-2 grid sm:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                    Service
                  </h4>
                  <p className="text-sm font-medium">{service}</p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                    Package
                  </h4>
                  <p className="text-sm font-medium">
                    {pkg.pieces} piece(s) · {pkg.weight_kg} kg
                  </p>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                    Total Fee
                  </h4>
                  <p className="text-sm font-medium">${priceInfo?.total.toFixed(2)}</p>
                </div>
              </div>

              {packageImagePath && (
                <div className="sm:col-span-2 border-t pt-4">
                  <h4 className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                    Package Photo
                  </h4>
                  <img
                    src={
                      supabase.storage
                        .from("shipment-package-images")
                        .getPublicUrl(packageImagePath).data.publicUrl
                    }
                    alt="Package"
                    className="max-w-[200px] h-auto rounded-lg border shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 mt-6 border-t border-border/50">
              <Button variant="outline" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMut.isPending}
                className="bg-primary text-white hover:bg-primary-hover font-semibold gap-2 shadow-md"
              >
                {createMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Shipment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
