import { jsPDF } from "jspdf";
import { format } from "date-fns";

const BRAND_NAVY = "#0b1220";
const BRAND_AMBER = "#f59e0b";
const TEXT_MUTED = "#64748b";

// --- Shared Document Helpers ---

function drawLogo(doc: jsPDF, x: number, y: number, scale = 1) {
  // Stylized S / abstract wings logo
  doc.setFillColor(BRAND_NAVY);
  doc.rect(x, y, 12 * scale, 12 * scale, "F");
  doc.setFillColor(BRAND_AMBER);
  doc.triangle(
    x + 12 * scale, y,
    x + 12 * scale, y + 12 * scale,
    x + 24 * scale, y + 12 * scale,
    "F"
  );
  doc.setTextColor(BRAND_NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22 * scale);
  doc.text("SwiftArc", x + 30 * scale, y + 10 * scale);
}

function drawQRCode(doc: jsPDF, x: number, y: number, size: number, data: string) {
  // Deterministic pseudo-QR
  const grid = 15;
  const cellSize = size / grid;
  doc.setFillColor(BRAND_NAVY);
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }
  
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const isFinderRow = r < 3 || r >= grid - 3;
      const isFinderCol = c < 3 || c >= grid - 3;
      if ((isFinderRow && c < 3) || (isFinderRow && c >= grid - 3) || (r < 3 && isFinderCol)) {
        const isOuter = r === 0 || r === 2 || r === grid - 1 || r === grid - 3 || c === 0 || c === 2 || c === grid - 1 || c === grid - 3;
        const isCenter = (r === 1 && c === 1) || (r === 1 && c === grid - 2) || (r === grid - 2 && c === 1);
        if (isOuter || isCenter) doc.rect(x + c * cellSize, y + r * cellSize, cellSize, cellSize, "F");
      } else {
        hash = ((hash << 5) - hash + r * grid + c) | 0;
        if (Math.abs(hash) % 3 !== 0) {
          doc.rect(x + c * cellSize, y + r * cellSize, cellSize, cellSize, "F");
        }
      }
    }
  }
}

function drawStamp(doc: jsPDF, text: string, x: number, y: number, color = "#10b981") {
  doc.saveGraphicsState();
  
  // Set up angled text and borders
  doc.setDrawColor(color);
  doc.setTextColor(color);
  doc.setLineWidth(2);
  
  // Basic math to center the text and draw a box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  const w = doc.getTextWidth(text) + 20;
  
  // Translate and rotate context
  (doc as any).advancedAPI((d: any) => {
    d.setCurrentTransformationMatrix([Math.cos(-0.3), Math.sin(-0.3), -Math.sin(-0.3), Math.cos(-0.3), x, y]);
  });
  
  doc.rect(-w/2, -20, w, 40);
  doc.text(text, 0, 8, { align: "center" });
  
  // Reset context
  (doc as any).advancedAPI((d: any) => {
    d.setCurrentTransformationMatrix([1, 0, 0, 1, 0, 0]);
  });
  
  doc.restoreGraphicsState();
}

function drawFooter(doc: jsPDF, pageW: number, pageH: number, includeLegal = true) {
  doc.setDrawColor("#e2e8f0").line(40, pageH - 80, pageW - 40, pageH - 80);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND_NAVY);
  doc.text("SwiftArc Global Logistics Ltd.", 40, pageH - 60);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT_MUTED);
  doc.text("100 Logistics Way, Suite 400 | San Francisco, CA 94107, USA | +1 (800) 555-0199 | swiftarc.app", 40, pageH - 45);
  
  if (includeLegal) {
    doc.setFontSize(7);
    doc.text(
      "This document is electronically generated and is valid without a physical signature. " +
      "Subject to SwiftArc Carrier Agreement available at swiftarc.app/legal.", 40, pageH - 25
    );
  }
}

// ---------- 1. Shipping Label ----------

export function generateShippingLabel(shipment: any) {
  // Create a 4x6 inch label (101.6 x 152.4 mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [101.6, 152.4]
  });

  // Fonts & styles
  doc.setFont("helvetica");

  // Outer Border
  doc.setLineWidth(1);
  doc.setDrawColor(0);
  doc.rect(2, 2, 97.6, 148.4);

  // Header Zone
  doc.setFillColor(0);
  doc.rect(2, 2, 97.6, 18, "F");
  
  doc.setTextColor(255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SWIFTARC", 5, 14);
  
  doc.setFontSize(12);
  doc.text(shipment.service.toUpperCase(), 95, 14, { align: "right" });

  doc.setTextColor(0);

  // Origin
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("FROM:", 5, 25);
  doc.setFont("helvetica", "normal");
  const orig = typeof shipment.origin === "string" ? JSON.parse(shipment.origin) : shipment.origin;
  doc.text([
    orig.contact_name || "Sender",
    orig.line1 || "",
    `${orig.city}, ${orig.postal_code || ""}`,
    orig.country_code || ""
  ].filter(Boolean), 5, 30);

  // Weight & Dimension
  const actualWt = shipment.package?.weight_kg || 1;
  const volWt = shipment.volumetric_weight || 0;
  const billedWt = Math.max(actualWt, volWt);
  
  doc.setFont("helvetica", "bold");
  doc.text(`BILLED: ${billedWt} KG`, 95, 25, { align: "right" });
  if (volWt > 0) {
    doc.setFontSize(6);
    doc.text(`(DIM: ${volWt.toFixed(1)} KG)`, 95, 28, { align: "right" });
  }

  doc.setLineWidth(0.5);
  doc.line(2, 45, 99.6, 45);

  // Destination
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TO:", 5, 52);
  
  doc.setFontSize(14);
  const dest = typeof shipment.destination === "string" ? JSON.parse(shipment.destination) : shipment.destination;
  doc.text(dest.contact_name || dest.city, 5, 59);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text([
    dest.line1 || "",
    `${dest.city}, ${dest.postal_code || ""}`,
    dest.country_code || ""
  ].filter(Boolean), 5, 66);

  doc.line(2, 85, 99.6, 85);

  // QR Code Routing
  drawQRCode(doc, 5, 90, 25, `https://swiftarc.app/tracking/${shipment.tracking_number}`);

  // Tracking #
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TRACKING #", 95, 95, { align: "right" });
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(shipment.tracking_number || shipment.trackingNumber, 95, 103, { align: "right" });

  doc.line(2, 120, 99.6, 120);

  // Routing and Service Indicators
  if (shipment.is_hazmat) {
    doc.setFillColor(0, 0, 0);
    doc.rect(2, 120, 97.6, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("HAZMAT / DG", 50, 130, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  doc.text(dest.country_code.substring(0, 3).toUpperCase(), 50, 142, { align: "center" });
  
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Powered by SwiftArc Logistics Engine", 50, 148, { align: "center" });

  doc.save(`${shipment.tracking_number || shipment.trackingNumber}_label.pdf`);
}

// ---------- 2. Commercial Invoice PDF ----------

export interface InvoiceInput {
  trackingNumber: string;
  service: string;
  pieces: number;
  weightKg: number;
  dimensions: string;
  declaredValue: number;
  origin: { contact: string; line1: string; city: string; zip: string; country: string; phone: string; email?: string };
  destination: { contact: string; line1: string; city: string; zip: string; country: string; phone: string; email?: string };
}

export function generateCommercialInvoice(inv: InvoiceInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pw = 595.28; // A4 width
  const ph = 841.89; // A4 height

  // Brand Header
  drawLogo(doc, 40, 40, 1.2);
  
  doc.setFont("helvetica", "bold").setFontSize(26).setTextColor(BRAND_NAVY);
  doc.text("COMMERCIAL INVOICE", pw - 40, 60, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(TEXT_MUTED);
  doc.text(`Tracking: ${inv.trackingNumber}`, pw - 40, 78, { align: "right" });
  doc.text(`Date: ${format(new Date(), "MMM dd, yyyy")}`, pw - 40, 92, { align: "right" });

  // QR Code for tracking
  drawQRCode(doc, pw - 90, 110, 50, `https://swiftarc.app/tracking/${inv.trackingNumber}`);

  // Parties Box
  doc.setDrawColor("#e2e8f0").setFillColor("#f8fafc").rect(40, 110, 240, 130, "FD");
  doc.setTextColor(BRAND_NAVY).setFontSize(11).setFont("helvetica", "bold").text("Billed to (Sender):", 50, 130);
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
  doc.text([
    inv.origin.contact,
    inv.origin.line1,
    `${inv.origin.city}, ${inv.origin.zip}, ${inv.origin.country}`,
    `Phone: ${inv.origin.phone}`,
    inv.origin.email ? `Email: ${inv.origin.email}` : ""
  ].filter(Boolean), 50, 148, { lineHeightFactor: 1.5 });

  doc.setDrawColor("#e2e8f0").setFillColor("#f8fafc").rect(300, 110, 255, 130, "FD");
  doc.setTextColor(BRAND_NAVY).setFontSize(11).setFont("helvetica", "bold").text("Shipped to (Receiver):", 310, 130);
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
  doc.text([
    inv.destination.contact,
    inv.destination.line1,
    `${inv.destination.city}, ${inv.destination.zip}, ${inv.destination.country}`,
    `Phone: ${inv.destination.phone}`,
    inv.destination.email ? `Email: ${inv.destination.email}` : ""
  ].filter(Boolean), 310, 148, { lineHeightFactor: 1.5 });

  // Itemized Table
  const tableY = 270;
  doc.setFillColor(BRAND_NAVY).rect(40, tableY, pw - 80, 25, "F");
  
  doc.setTextColor("#ffffff").setFontSize(10).setFont("helvetica", "bold");
  doc.text("Description", 50, tableY + 17);
  doc.text("Qty", 310, tableY + 17);
  doc.text("Weight", 370, tableY + 17);
  doc.text("Unit Price", 440, tableY + 17);
  doc.text("Amount", 500, tableY + 17);
  
  // Row 1
  const rY = tableY + 45;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(BRAND_NAVY);
  doc.text(`Logistics - ${inv.service}`, 50, rY);
  
  doc.setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
  doc.text(`${inv.pieces}`, 310, rY);
  doc.text(`${inv.weightKg} kg`, 370, rY);
  const unitPrice = Math.max(1, inv.declaredValue * 0.05);
  const lineTotal = unitPrice * inv.pieces;
  doc.text(`$${unitPrice.toFixed(2)}`, 440, rY);
  doc.setTextColor(BRAND_NAVY).setFont("helvetica", "bold").text(`$${lineTotal.toFixed(2)}`, 500, rY);

  // Subtext
  doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
  doc.text(`Dimensions: ${inv.dimensions}`, 50, rY + 14);

  doc.setDrawColor("#e2e8f0").line(40, rY + 30, pw - 40, rY + 30);

  // Totals Box
  const tY = rY + 60;
  doc.setFillColor("#f8fafc").rect(360, tY, 195, 90, "F");
  
  doc.setFontSize(10).setTextColor(TEXT_MUTED);
  doc.text("Subtotal:", 380, tY + 25);
  doc.setTextColor(BRAND_NAVY).text(`$${lineTotal.toFixed(2)}`, 500, tY + 25);
  
  doc.setTextColor(TEXT_MUTED).text("Tax (0%):", 380, tY + 45);
  doc.setTextColor(BRAND_NAVY).text(`$0.00`, 500, tY + 45);

  doc.setDrawColor("#cbd5e1").line(380, tY + 60, 535, tY + 60);

  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(BRAND_NAVY);
  doc.text("Total:", 380, tY + 80);
  doc.text(`$${lineTotal.toFixed(2)}`, 500, tY + 80);

  // Paid Stamp
  drawStamp(doc, "PAID", 200, 420, "#10b981");

  // Footer
  drawFooter(doc, pw, ph);

  doc.save(`invoice_${inv.trackingNumber}.pdf`);
}

// ---------- 3. Customs Declaration PDF ----------

export interface CustomsInput {
  trackingNumber: string;
  weightKg: number;
  pieces: number;
  declaredValue: number;
  origin: { contact: string; line1: string; city: string; zip: string; country: string };
  destination: { contact: string; line1: string; city: string; zip: string; country: string };
}

export function generateCustomsDeclaration(c: CustomsInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pw = 595.28;
  const ph = 841.89;

  // Brand Header
  drawLogo(doc, 40, 40, 1.2);
  
  doc.setFont("helvetica", "bold").setFontSize(24).setTextColor(BRAND_NAVY);
  doc.text("CUSTOMS DECLARATION", pw - 40, 60, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(TEXT_MUTED);
  doc.text("CN23 Equivalent Form", pw - 40, 75, { align: "right" });
  doc.text(`Tracking: ${c.trackingNumber} | Date: ${format(new Date(), "MMM dd, yyyy")}`, pw - 40, 90, { align: "right" });

  drawQRCode(doc, 40, 110, 50, `https://swiftarc.app/tracking/${c.trackingNumber}`);

  doc.setDrawColor("#e2e8f0").line(40, 180, pw - 40, 180);

  // Layout Grid
  doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(BRAND_NAVY);
  doc.text("Exporter / Sender", 40, 205);
  doc.setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
  doc.text([
    c.origin.contact,
    c.origin.line1,
    `${c.origin.city}, ${c.origin.zip}`,
    c.origin.country
  ], 40, 225, { lineHeightFactor: 1.5 });

  doc.setFont("helvetica", "bold").setTextColor(BRAND_NAVY);
  doc.text("Importer / Receiver", 300, 205);
  doc.setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
  doc.text([
    c.destination.contact,
    c.destination.line1,
    `${c.destination.city}, ${c.destination.zip}`,
    c.destination.country
  ], 300, 225, { lineHeightFactor: 1.5 });

  // Table
  const tableY = 320;
  doc.setFillColor(BRAND_NAVY).rect(40, tableY, pw - 80, 25, "F");
  
  doc.setTextColor("#ffffff").setFontSize(10).setFont("helvetica", "bold");
  doc.text("Detailed description of contents", 50, tableY + 17);
  doc.text("Qty", 360, tableY + 17);
  doc.text("Net Wt", 420, tableY + 17);
  doc.text("Value", 490, tableY + 17);
  
  // Row
  const rY = tableY + 45;
  doc.setFont("helvetica", "bold").setTextColor(BRAND_NAVY);
  doc.text("Commercial Goods - General", 50, rY);
  
  doc.setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
  doc.text(`${c.pieces}`, 360, rY);
  doc.text(`${c.weightKg} kg`, 420, rY);
  doc.text(`$${c.declaredValue.toFixed(2)}`, 490, rY);

  doc.setDrawColor("#e2e8f0").line(40, rY + 20, pw - 40, rY + 20);

  // Summary box
  doc.setFillColor("#f8fafc").rect(pw - 240, rY + 40, 200, 40, "F");
  doc.setFont("helvetica", "bold").setTextColor(BRAND_NAVY).text("Total Gross Weight:", pw - 220, rY + 65);
  doc.text(`${c.weightKg} kg`, pw - 60, rY + 65, { align: "right" });

  // Certification
  doc.setFontSize(11).setFont("helvetica", "bold").setTextColor(BRAND_NAVY).text("Certification", 40, 480);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(TEXT_MUTED);
  doc.text(
    "I certify that the particulars given in this customs declaration are correct and that this item does " +
    "not contain any dangerous article or articles prohibited by legislation or by postal or customs regulations.",
    40, 500, { maxWidth: pw - 80 }
  );

  doc.setDrawColor(BRAND_NAVY).setLineWidth(0.5).line(40, 560, 250, 560);
  doc.text("Signature of Sender", 40, 575);

  doc.line(350, 560, 450, 560);
  doc.text("Date", 350, 575);

  drawStamp(doc, "CLEARED", 450, 650, "#0ea5e9");

  drawFooter(doc, pw, ph);

  doc.save(`customs_declaration_${c.trackingNumber}.pdf`);
}

