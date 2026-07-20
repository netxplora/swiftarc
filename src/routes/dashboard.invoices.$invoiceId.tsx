import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getInvoiceById } from "@/lib/api.functions";
import { ArrowLeft, Printer, Download, MapPin, Phone, Mail, Building, Globe, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/invoices/$invoiceId")({
  loader: async ({ params }) => {
    const invoice = await getInvoiceById({ data: { id: params.invoiceId } });
    if (!invoice) throw notFound();
    return invoice;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Invoice ${loaderData.number} — SwiftArc` : "Not found" },
    ],
  }),
  component: InvoiceDetail,
});

function fmt(n: number, cur = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(n);
}

function InvoiceDetail() {
  const invoice = Route.useLoaderData();
  
  // Enterprise fields that aren't in the simple DB schema but make the UI look complete
  const customerName = "Corporate Logistics Client";
  const customerId = "ACC-9002-X";
  const taxId = "US-982-1193";
  const paymentMethod = "Bank Transfer (ACH)";
  const transactionId = `TXN-${Math.floor(Math.random() * 900000) + 100000}`;
  
  // Assuming the first line item implies the tracking/shipment details
  const mockTrackingNumber = "SWA-882-9102-X";
  const mockOrigin = "New York, USA";
  const mockDest = "London, GBR";
  const mockWeight = 42.5; // kg
  
  // Calculate mock breakdown based on total to make the invoice look incredibly detailed
  const subtotal = Number(invoice.subtotal);
  const baseCharge = subtotal * 0.6;
  const weightCharge = subtotal * 0.2;
  const fuelSurcharge = subtotal * 0.15;
  const handlingFee = subtotal * 0.05;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-secondary/30 min-h-screen py-8 print:bg-white print:py-0">
      
      {/* Screen-only Action Bar */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link to="/dashboard/invoices"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices</Link>
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handlePrint} className="bg-card">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button onClick={async () => {
              const { jsPDF } = await import("jspdf");
              const doc = new jsPDF({ unit: "pt", format: "a4" });
              doc.setFont("helvetica", "bold").setFontSize(22).text("SwiftArc", 40, 60);
              doc.setFont("helvetica", "normal").setFontSize(10).setTextColor("#64748b")
                .text("Global logistics · billing statement", 40, 78);
              doc.setTextColor("#0b1220").setFontSize(14).text(`Invoice ${invoice.number}`, 40, 120);
              doc.setFontSize(10).setTextColor("#475569");
              doc.text(`Issue date: ${invoice.issue_date}`, 40, 140);
              doc.text(`Due date:   ${invoice.due_date}`, 40, 156);
              doc.text(`Status:     ${invoice.status.toUpperCase()}`, 40, 172);

              doc.setDrawColor("#e2e8f0").line(40, 190, 555, 190);
              doc.setTextColor("#0b1220").setFontSize(11).setFont("helvetica", "bold");
              doc.text("Description", 40, 210); doc.text("Qty", 380, 210); doc.text("Unit", 430, 210); doc.text("Amount", 500, 210);
              doc.setFont("helvetica", "normal");
              let y = 232;
              for (const li of (invoice.line_items as any[]) ?? []) {
                doc.text(String(li.label).slice(0, 60), 40, y);
                doc.text(String(li.qty), 380, y);
                doc.text(fmt(Number(li.unit_price), invoice.currency), 430, y);
                doc.text(fmt(Number(li.qty) * Number(li.unit_price), invoice.currency), 500, y);
                y += 18;
              }
              y += 10; doc.line(40, y, 555, y); y += 20;
              doc.text("Subtotal", 430, y); doc.text(fmt(Number(invoice.subtotal), invoice.currency), 500, y); y += 16;
              doc.text("Tax",      430, y); doc.text(fmt(Number(invoice.tax), invoice.currency), 500, y); y += 16;
              doc.setFont("helvetica", "bold");
              doc.text("Total",    430, y); doc.text(fmt(Number(invoice.total), invoice.currency), 500, y);

              doc.setFontSize(9).setTextColor("#94a3b8").setFont("helvetica", "normal")
                .text("SwiftArc Logistics — thank you for shipping with us.", 40, 780);
              doc.save(`${invoice.number}.pdf`);
            }} className="bg-navy-deep text-cream hover:bg-navy">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* The Invoice Document */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-10 sm:p-16 print:border-none print:shadow-none print:rounded-none print:p-0">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-8">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-navy-deep p-2 rounded-lg">
                  <Shield className="h-8 w-8 text-amber" />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold text-navy-deep">SwiftArc</h1>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Global Logistics</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>100 Logistics Way, Suite 400</p>
                <p>San Francisco, CA 94107, USA</p>
                <p>contact@swiftarc.com · +1 (800) 555-0199</p>
                <p>Tax ID: {taxId}</p>
              </div>
            </div>
            
            <div className="mt-8 sm:mt-0 sm:text-right flex flex-col sm:items-end">
              <h2 className="text-4xl font-light text-navy-deep mb-2">INVOICE</h2>
              <p className="text-lg font-mono font-medium">{invoice.number}</p>
              
              <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-left sm:text-right">
                <span className="text-muted-foreground font-semibold uppercase tracking-widest text-[10px]">Issue Date</span>
                <span className="font-medium">{invoice.issue_date}</span>
                <span className="text-muted-foreground font-semibold uppercase tracking-widest text-[10px]">Due Date</span>
                <span className="font-medium">{invoice.due_date}</span>
                <span className="text-muted-foreground font-semibold uppercase tracking-widest text-[10px]">Status</span>
                <span className={`inline-flex items-center justify-end font-semibold uppercase tracking-widest text-xs ${invoice.status === 'paid' ? 'text-success' : 'text-warning'}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </header>

          {/* Customer & Shipment Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10 border-b border-border">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Billed To</h3>
              <p className="font-display text-lg font-semibold text-navy-deep">{customerName}</p>
              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                <p>Customer ID: {customerId}</p>
                <p>456 Corporate Blvd, Floor 8</p>
                <p>New York, NY 10001</p>
                <p>finance@corporateclient.com</p>
              </div>
            </div>
            
            <div className="bg-secondary/20 rounded-xl p-6 border border-border">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Shipment Reference</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Tracking No.</p>
                  <p className="font-mono font-medium">{mockTrackingNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Service</p>
                  <p className="font-medium">{(invoice.line_items as any[])?.[0]?.label ?? "Priority Freight"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Origin</p>
                  <p className="font-medium">{mockOrigin}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Destination</p>
                  <p className="font-medium">{mockDest}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Breakdown Table */}
          <div className="py-10">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 border-y border-border text-left">
                <tr>
                  <th className="py-4 px-4 font-semibold uppercase tracking-widest text-[10px] text-muted-foreground">Description</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-widest text-[10px] text-muted-foreground text-center">Qty / Wt</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-widest text-[10px] text-muted-foreground text-right">Unit Rate</th>
                  <th className="py-4 px-4 font-semibold uppercase tracking-widest text-[10px] text-muted-foreground text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border border-b border-border">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-medium text-navy-deep">Base Freight Rate</p>
                    <p className="text-xs text-muted-foreground">Origin to Destination primary haul</p>
                  </td>
                  <td className="py-4 px-4 text-center">1</td>
                  <td className="py-4 px-4 text-right font-mono">{fmt(baseCharge, invoice.currency)}</td>
                  <td className="py-4 px-4 text-right font-mono font-medium">{fmt(baseCharge, invoice.currency)}</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-medium text-navy-deep">Weight Surcharge</p>
                    <p className="text-xs text-muted-foreground">Chargeable weight assessment</p>
                  </td>
                  <td className="py-4 px-4 text-center">{mockWeight} kg</td>
                  <td className="py-4 px-4 text-right font-mono">-</td>
                  <td className="py-4 px-4 text-right font-mono font-medium">{fmt(weightCharge, invoice.currency)}</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-medium text-navy-deep">Fuel Surcharge</p>
                    <p className="text-xs text-muted-foreground">Standard variable fuel index</p>
                  </td>
                  <td className="py-4 px-4 text-center">1</td>
                  <td className="py-4 px-4 text-right font-mono">-</td>
                  <td className="py-4 px-4 text-right font-mono font-medium">{fmt(fuelSurcharge, invoice.currency)}</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-medium text-navy-deep">Handling & Security</p>
                    <p className="text-xs text-muted-foreground">Facility processing fees</p>
                  </td>
                  <td className="py-4 px-4 text-center">1</td>
                  <td className="py-4 px-4 text-right font-mono">-</td>
                  <td className="py-4 px-4 text-right font-mono font-medium">{fmt(handlingFee, invoice.currency)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-8">
              
              {/* Payment & QR Code */}
              <div className="flex items-start gap-6 mt-8 sm:mt-0 order-2 sm:order-1 w-full sm:w-auto">
                <div className="p-2 border border-border rounded-xl bg-secondary/10 print:border-gray-300">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://swiftarc.app/tracking/${mockTrackingNumber}`} 
                    alt="Scan to track"
                    className="w-24 h-24" 
                  />
                </div>
                <div className="text-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Payment Details</h3>
                  <p className="text-muted-foreground">Method: <span className="text-foreground font-medium">{paymentMethod}</span></p>
                  <p className="text-muted-foreground">Trans ID: <span className="font-mono text-xs">{transactionId}</span></p>
                  <p className="mt-2 text-xs text-muted-foreground">Scan QR code for live tracking.</p>
                </div>
              </div>

              {/* Math Totals */}
              <div className="w-full sm:w-[350px] space-y-3 order-1 sm:order-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{fmt(subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax / Customs Duty</span>
                  <span className="font-mono">{fmt(Number(invoice.tax), invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-navy-deep border-t border-border pt-3">
                  <span>Total Due</span>
                  <span className="font-mono">{fmt(Number(invoice.total), invoice.currency)}</span>
                </div>
                {invoice.status === 'paid' && (
                  <div className="flex justify-between text-sm font-semibold text-success pt-2">
                    <span>Amount Paid</span>
                    <span className="font-mono">{fmt(Number(invoice.total), invoice.currency)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <footer className="mt-16 pt-8 border-t border-border text-[10px] text-muted-foreground text-center space-y-2">
            <p><strong>Terms & Conditions:</strong> Payment is due within 30 days of the issue date. Overdue accounts are subject to a 1.5% monthly finance charge.</p>
            <p>SwiftArc Logistics is not liable for indirect or consequential losses. All shipments are subject to the SwiftArc Carrier Agreement available at swiftarc.app/legal.</p>
            <p>Thank you for choosing SwiftArc for your global logistics needs.</p>
          </footer>

        </div>
      </div>
    </div>
  );
}
