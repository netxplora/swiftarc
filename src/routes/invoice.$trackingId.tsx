/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { getShipmentInvoice } from "@/lib/api.functions";
import { useLocale } from "@/hooks/use-locale";
import { format } from "date-fns";
import { Globe, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invoice/$trackingId")({
  head: () => ({
    meta: [
      { title: "Commercial Invoice — SwiftArc" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ params: { trackingId } }) => {
    return await getShipmentInvoice({ data: { trackingNumber: trackingId } });
  },
  component: CommercialInvoice,
});

function CommercialInvoice() {
  const s = Route.useLoaderData() as any;
  const { format: fmt } = useLocale();

  const handlePrint = () => {
    window.print();
  };

  const o = s.origin;
  const d = s.destination;
  const p = s.package;
  const c = s.customs_info;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 font-sans print:p-0 print:bg-white print:text-black">
      <div className="mx-auto max-w-[210mm] min-h-[297mm] bg-card sm:shadow-lg sm:border sm:border-border print:shadow-none print:border-none p-8 sm:p-12 relative">
        {/* Print Controls (Hidden when printing) */}
        <div className="absolute top-4 right-4 print:hidden">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-2 border-border text-muted-foreground hover:bg-secondary shadow-sm"
          >
            <Printer className="h-4 w-4" /> Print Invoice
          </Button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-2xl font-black tracking-tighter">
              <Globe className="h-8 w-8" /> SWIFTARC
            </div>
            <p className="text-sm font-semibold mt-1">Global Logistics Network</p>
            <p className="text-xs text-gray-600 mt-2">
              123 Logistics Way
              <br />
              Rotterdam, NL 3011
              <br />
              VAT: NL802194830B01
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold uppercase tracking-widest text-foreground print:text-black">
              Commercial Invoice
            </h1>
            <div className="mt-4 text-sm space-y-1">
              <p>
                <span className="font-semibold">Invoice No:</span>{" "}
                {s.tracking_number.substring(0, 12)}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {format(new Date(s.created_at), "PPP")}
              </p>
              <p>
                <span className="font-semibold">Tracking Number:</span> {s.tracking_number}
              </p>
              <p>
                <span className="font-semibold">Terms of Sale:</span> DAP
              </p>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">
              Shipper / Exporter
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-bold">{o.contact_name}</p>
              <p>{o.line1}</p>
              <p>
                {o.city}, {o.region || ""} {o.postal_code}
              </p>
              <p className="font-bold">{o.country_code}</p>
              {o.phone && <p>Tel: {o.phone}</p>}
              {o.email && <p>Email: {o.email}</p>}
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">
              Consignee / Importer
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-bold">{d.contact_name}</p>
              <p>{d.line1}</p>
              <p>
                {d.city}, {d.region || ""} {d.postal_code}
              </p>
              <p className="font-bold">{d.country_code}</p>
              {d.phone && <p>Tel: {d.phone}</p>}
              {d.email && <p>Email: {d.email}</p>}
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">
            Shipment Details
          </h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Total Pieces</p>
              <p className="font-semibold">{p.pieces}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total Weight</p>
              <p className="font-semibold">{p.weight_kg} kg</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Service</p>
              <p className="font-semibold">{s.service}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Currency</p>
              <p className="font-semibold">USD</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-12">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 font-bold w-[10%]">Qty</th>
                <th className="py-2 font-bold w-[45%]">Full Description of Goods</th>
                <th className="py-2 font-bold w-[20%]">HS Code</th>
                <th className="py-2 font-bold w-[10%]">Country of Origin</th>
                <th className="py-2 font-bold w-[15%] text-right">Value (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-4 align-top">{p.pieces}</td>
                <td className="py-4 align-top pr-4">
                  <p className="font-semibold">
                    {c?.description || p.description || "General Merchandise"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Export purpose: Commercial sample / Personal use
                  </p>
                </td>
                <td className="py-4 align-top">{c?.hs_code || "N/A"}</td>
                <td className="py-4 align-top">{o.country_code}</td>
                <td className="py-4 align-top text-right font-semibold">
                  {fmt(s.declared_value || 0)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="py-4 text-xs text-gray-500 italic align-bottom">
                  These commodities, technology, or software were exported from the origin country
                  in accordance with the Export Administration Regulations. Diversion contrary to
                  law is prohibited.
                </td>
                <td className="py-4 text-right font-bold pt-6 border-t-2 border-black">TOTAL:</td>
                <td className="py-4 text-right font-bold pt-6 border-t-2 border-black text-lg">
                  {fmt(s.declared_value || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 mt-16 text-sm">
          <div>
            <div className="border-b border-black h-12 flex items-end pb-1 px-2 italic text-gray-600">
              Generated Electronically
            </div>
            <p className="mt-1 font-bold">Shipper Signature</p>
            <p className="text-xs text-gray-500">
              I declare that all the information contained in this invoice to be true and correct.
            </p>
          </div>
          <div>
            <div className="border-b border-black h-12 flex items-end pb-1 px-2 italic text-gray-600">
              {format(new Date(s.created_at), "PPP")}
            </div>
            <p className="mt-1 font-bold">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}
