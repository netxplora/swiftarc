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

// ---------- Generic Factory ----------

export interface BusinessDocumentOptions {
  type: string; // e.g. "PROOF OF DELIVERY"
  referenceLabel: string; // e.g. "Tracking Number"
  referenceValue: string; // e.g. "SW123456"
  date: string;
  sender?: { contact?: string; line1?: string; city?: string; zip?: string; country?: string; phone?: string; email?: string };
  recipient?: { contact?: string; line1?: string; city?: string; zip?: string; country?: string; phone?: string; email?: string };
  details: { label: string; value: string }[];
  stamp?: { text: string; color: string };
  requiresSignature?: boolean;
}

function generateBusinessDocument(opts: BusinessDocumentOptions) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pw = 595.28;
  const ph = 841.89;

  // Header
  drawLogo(doc, 40, 40, 1.2);
  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(BRAND_NAVY);
  doc.text(opts.type.toUpperCase(), pw - 40, 60, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(TEXT_MUTED);
  doc.text(`${opts.referenceLabel}: ${opts.referenceValue}`, pw - 40, 78, { align: "right" });
  doc.text(`Date: ${opts.date}`, pw - 40, 92, { align: "right" });

  if (opts.referenceValue) {
    drawQRCode(doc, pw - 90, 110, 50, `https://swiftarc.app/tracking/${opts.referenceValue}`);
  }

  // Parties Box
  let contentY = 110;
  
  if (opts.sender) {
    doc.setDrawColor("#e2e8f0").setFillColor("#f8fafc").rect(40, contentY, 240, 110, "FD");
    doc.setTextColor(BRAND_NAVY).setFontSize(11).setFont("helvetica", "bold").text("Sender:", 50, contentY + 20);
    doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
    doc.text([
      opts.sender.contact,
      opts.sender.line1,
      [opts.sender.city, opts.sender.zip, opts.sender.country].filter(Boolean).join(", "),
      opts.sender.phone ? `Phone: ${opts.sender.phone}` : "",
      opts.sender.email ? `Email: ${opts.sender.email}` : ""
    ].filter(Boolean), 50, contentY + 38, { lineHeightFactor: 1.5 });
  }

  if (opts.recipient) {
    doc.setDrawColor("#e2e8f0").setFillColor("#f8fafc").rect(300, contentY, 255, 110, "FD");
    doc.setTextColor(BRAND_NAVY).setFontSize(11).setFont("helvetica", "bold").text("Recipient:", 310, contentY + 20);
    doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
    doc.text([
      opts.recipient.contact,
      opts.recipient.line1,
      [opts.recipient.city, opts.recipient.zip, opts.recipient.country].filter(Boolean).join(", "),
      opts.recipient.phone ? `Phone: ${opts.recipient.phone}` : "",
      opts.recipient.email ? `Email: ${opts.recipient.email}` : ""
    ].filter(Boolean), 310, contentY + 38, { lineHeightFactor: 1.5 });
  }

  if (opts.sender || opts.recipient) {
    contentY += 140;
  }

  // Details Section
  doc.setFillColor(BRAND_NAVY).rect(40, contentY, pw - 80, 25, "F");
  doc.setTextColor("#ffffff").setFontSize(10).setFont("helvetica", "bold");
  doc.text("Document Details", 50, contentY + 17);

  contentY += 45;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(BRAND_NAVY);
  
  const midPoint = 300;
  opts.details.forEach((detail, index) => {
    const isRight = index % 2 !== 0;
    const xOffset = isRight ? midPoint : 40;
    const rowY = contentY + Math.floor(index / 2) * 20;
    
    doc.setFont("helvetica", "bold").setTextColor(TEXT_MUTED);
    doc.text(`${detail.label}:`, xOffset + 10, rowY);
    
    doc.setFont("helvetica", "normal").setTextColor(BRAND_NAVY);
    doc.text(detail.value, xOffset + 100, rowY);
  });

  contentY += Math.ceil(opts.details.length / 2) * 20 + 20;

  // Signatures
  if (opts.requiresSignature) {
    contentY += 40;
    doc.setDrawColor(BRAND_NAVY).setLineWidth(0.5).line(40, contentY + 40, 250, contentY + 40);
    doc.text("Authorized Signature", 40, contentY + 55);

    doc.line(350, contentY + 40, 500, contentY + 40);
    doc.text("Date", 350, contentY + 55);
  }

  if (opts.stamp) {
    drawStamp(doc, opts.stamp.text, pw / 2, contentY + 100, opts.stamp.color);
  }

  drawFooter(doc, pw, ph);

  const cleanType = opts.type.toLowerCase().replace(/\s+/g, '_');
  doc.save(`${cleanType}_${opts.referenceValue}.pdf`);
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

// ---------- 4. Additional Enterprise Documents ----------

function parseAddress(addr: any) {
  if (!addr) return undefined;
  const parsed = typeof addr === 'string' ? JSON.parse(addr) : addr;
  return {
    contact: parsed.contact_name || "Sender",
    line1: parsed.line1 || "",
    city: parsed.city || "",
    zip: parsed.postal_code || "",
    country: parsed.country_code || "",
    phone: parsed.phone || "",
    email: parsed.email || ""
  };
}

export function generateShippingReceipt(shipment: any) {
  generateBusinessDocument({
    type: "Shipping Receipt",
    referenceLabel: "Tracking Number",
    referenceValue: shipment.tracking_number || shipment.trackingNumber,
    date: format(new Date(), "MMM dd, yyyy"),
    sender: parseAddress(shipment.origin),
    recipient: parseAddress(shipment.destination),
    details: [
      { label: "Service", value: shipment.service },
      { label: "Status", value: shipment.status },
      { label: "Weight", value: `${shipment.package?.weight_kg || 1} KG` },
      { label: "Created At", value: format(new Date(shipment.created_at || Date.now()), "MMM dd, yyyy HH:mm") }
    ],
    stamp: { text: "RECEIVED", color: "#10b981" }
  });
}

export function generateShipmentConfirmation(shipment: any) {
  generateBusinessDocument({
    type: "Shipment Confirmation",
    referenceLabel: "Tracking Number",
    referenceValue: shipment.tracking_number || shipment.trackingNumber,
    date: format(new Date(), "MMM dd, yyyy"),
    sender: parseAddress(shipment.origin),
    recipient: parseAddress(shipment.destination),
    details: [
      { label: "Service", value: shipment.service },
      { label: "Estimated Delivery", value: "3-5 Business Days" },
      { label: "Weight", value: `${shipment.package?.weight_kg || 1} KG` }
    ],
    stamp: { text: "CONFIRMED", color: "#0ea5e9" }
  });
}

export function generatePickupReceipt(pickup: any) {
  const addr = parseAddress(pickup.address || pickup.location);
  generateBusinessDocument({
    type: "Pickup Receipt",
    referenceLabel: "Pickup ID",
    referenceValue: pickup.id.substring(0, 8).toUpperCase(),
    date: format(new Date(), "MMM dd, yyyy"),
    sender: addr, // Pickup location is essentially the sender
    details: [
      { label: "Pickup Date", value: pickup.pickup_date || "N/A" },
      { label: "Time Slot", value: pickup.slot || "N/A" },
      { label: "Package Count", value: String(pickup.package_count || 1) },
      { label: "Status", value: pickup.status || "Completed" }
    ],
    requiresSignature: true,
    stamp: { text: "COLLECTED", color: "#10b981" }
  });
}

export function generateDeliveryConfirmation(shipment: any) {
  generateBusinessDocument({
    type: "Delivery Confirmation",
    referenceLabel: "Tracking Number",
    referenceValue: shipment.tracking_number || shipment.trackingNumber,
    date: format(new Date(), "MMM dd, yyyy"),
    recipient: parseAddress(shipment.destination),
    details: [
      { label: "Service", value: shipment.service },
      { label: "Status", value: "Delivered" },
      { label: "Delivery Date", value: format(new Date(), "MMM dd, yyyy HH:mm") }
    ],
    stamp: { text: "DELIVERED", color: "#10b981" }
  });
}

export function generateProofOfDelivery(shipment: any, podData: any) {
  generateBusinessDocument({
    type: "Proof Of Delivery",
    referenceLabel: "Tracking Number",
    referenceValue: shipment.tracking_number || shipment.trackingNumber,
    date: format(new Date(), "MMM dd, yyyy"),
    recipient: parseAddress(shipment.destination),
    details: [
      { label: "Service", value: shipment.service },
      { label: "Delivery Date", value: format(new Date(podData?.timestamp || Date.now()), "MMM dd, yyyy HH:mm") },
      { label: "Received By", value: podData?.signedBy || "Resident" },
      { label: "Location", value: podData?.location || "Front Desk" }
    ],
    requiresSignature: true,
    stamp: { text: "POD SECURED", color: "#8b5cf6" }
  });
}

export function generateShipmentCertificate(shipment: any) {
  generateBusinessDocument({
    type: "Shipment Certificate",
    referenceLabel: "Tracking Number",
    referenceValue: shipment.tracking_number || shipment.trackingNumber,
    date: format(new Date(), "MMM dd, yyyy"),
    sender: parseAddress(shipment.origin),
    recipient: parseAddress(shipment.destination),
    details: [
      { label: "Service", value: shipment.service },
      { label: "Weight", value: `${shipment.package?.weight_kg || 1} KG` },
      { label: "Declared Value", value: `$${shipment.declared_value || 0}` },
      { label: "Certification", value: "Authentic SwiftArc Record" }
    ],
    ],
    stamp: { text: "CERTIFIED", color: "#f59e0b" }
  });
}

export interface FinancialInvoiceInput {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  lineItems: Array<{ label: string; qty: number; unitPrice: number; amount: number }>;
  billTo: { contact: string; line1: string; city: string; zip: string; country: string; phone?: string; email?: string };
}

export function generateBillingInvoice(inv: FinancialInvoiceInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pw = 595.28;
  const ph = 841.89;

  drawLogo(doc, 40, 40, 1.2);
  
  doc.setFont("helvetica", "bold").setFontSize(26).setTextColor(BRAND_NAVY);
  doc.text("INVOICE", pw - 40, 60, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(TEXT_MUTED);
  doc.text(`Invoice Number: ${inv.invoiceNumber}`, pw - 40, 78, { align: "right" });
  doc.text(`Date Issued: ${format(new Date(inv.issueDate), "MMM dd, yyyy")}`, pw - 40, 92, { align: "right" });
  doc.text(`Due Date: ${format(new Date(inv.dueDate), "MMM dd, yyyy")}`, pw - 40, 106, { align: "right" });

  doc.setDrawColor("#e2e8f0").setFillColor("#f8fafc").rect(40, 130, 240, 110, "FD");
  doc.setTextColor(BRAND_NAVY).setFontSize(11).setFont("helvetica", "bold").text("Billed to:", 50, 150);
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
  doc.text([
    inv.billTo.contact,
    inv.billTo.line1,
    `${inv.billTo.city}, ${inv.billTo.zip}, ${inv.billTo.country}`,
    inv.billTo.phone ? `Phone: ${inv.billTo.phone}` : "",
    inv.billTo.email ? `Email: ${inv.billTo.email}` : ""
  ].filter(Boolean), 50, 168, { lineHeightFactor: 1.5 });

  const tableY = 270;
  doc.setFillColor(BRAND_NAVY).rect(40, tableY, pw - 80, 25, "F");
  
  doc.setTextColor("#ffffff").setFontSize(10).setFont("helvetica", "bold");
  doc.text("Description", 50, tableY + 17);
  doc.text("Qty", 350, tableY + 17);
  doc.text("Unit Price", 420, tableY + 17);
  doc.text("Amount", 500, tableY + 17);
  
  let rY = tableY + 45;
  inv.lineItems.forEach((li) => {
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(BRAND_NAVY);
    doc.text(li.label, 50, rY);
    doc.setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
    doc.text(`${li.qty}`, 350, rY);
    doc.text(`${inv.currency === "USD" ? "$" : ""}${li.unitPrice.toFixed(2)}`, 420, rY);
    doc.setTextColor(BRAND_NAVY).setFont("helvetica", "bold").text(`${inv.currency === "USD" ? "$" : ""}${li.amount.toFixed(2)}`, 500, rY);
    rY += 30;
  });

  doc.setDrawColor("#e2e8f0").line(40, rY + 10, pw - 40, rY + 10);

  const tY = rY + 40;
  doc.setFillColor("#f8fafc").rect(360, tY, 195, 90, "F");
  
  doc.setFontSize(10).setTextColor(TEXT_MUTED);
  doc.text("Subtotal:", 380, tY + 25);
  doc.setTextColor(BRAND_NAVY).text(`${inv.currency === "USD" ? "$" : ""}${inv.subtotal.toFixed(2)}`, 500, tY + 25);
  
  doc.setTextColor(TEXT_MUTED).text(`Tax:`, 380, tY + 45);
  doc.setTextColor(BRAND_NAVY).text(`${inv.currency === "USD" ? "$" : ""}${inv.tax.toFixed(2)}`, 500, tY + 45);

  doc.setDrawColor("#cbd5e1").line(380, tY + 60, 535, tY + 60);

  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(BRAND_NAVY);
  doc.text("Total:", 380, tY + 80);
  doc.text(`${inv.currency === "USD" ? "$" : ""}${inv.total.toFixed(2)}`, 500, tY + 80);

  if (inv.status === "paid") {
    drawStamp(doc, "PAID IN FULL", 200, tY, "#10b981");
  } else if (inv.status === "overdue") {
    drawStamp(doc, "OVERDUE", 200, tY, "#ef4444");
  } else if (inv.status === "void") {
    drawStamp(doc, "VOID", 200, tY, "#94a3b8");
  }

  drawFooter(doc, pw, ph);
  doc.save(`invoice_${inv.invoiceNumber}.pdf`);
}

export function generatePaymentReceipt(transaction: any) {
  generateBusinessDocument({
    type: "Payment Receipt",
    referenceLabel: "Transaction ID",
    referenceValue: transaction.id || transaction.txId,
    date: format(new Date(transaction.date || Date.now()), "MMM dd, yyyy"),
    details: [
      { label: "Payment Method", value: transaction.method || "Credit Card" },
      { label: "Amount Paid", value: `$${Number(transaction.amount || 0).toFixed(2)}` },
      { label: "Status", value: transaction.status || "Successful" },
      { label: "Related Invoice", value: transaction.invoiceId || "N/A" }
    ],
    stamp: { text: "PAID IN FULL", color: "#10b981" }
  });
}

export function generateShippingManifest(manifestId: string, driver: string, route: string, shipments: any[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pw = 595.28;
  const ph = 841.89;

  // Header
  drawLogo(doc, 40, 40, 1.2);
  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(BRAND_NAVY);
  doc.text("SHIPPING MANIFEST", pw - 40, 60, { align: "right" });
  
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(TEXT_MUTED);
  doc.text(`Manifest ID: ${manifestId}`, pw - 40, 78, { align: "right" });
  doc.text(`Date: ${format(new Date(), "MMM dd, yyyy")}`, pw - 40, 92, { align: "right" });

  drawQRCode(doc, pw - 90, 110, 50, `https://swiftarc.app/manifest/${manifestId}`);

  // Route Info
  doc.setDrawColor("#e2e8f0").setFillColor("#f8fafc").rect(40, 110, 300, 80, "FD");
  doc.setTextColor(BRAND_NAVY).setFontSize(11).setFont("helvetica", "bold").text("Dispatch Information", 50, 130);
  doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
  doc.text(`Driver / Carrier: ${driver}`, 50, 148);
  doc.text(`Route: ${route}`, 50, 163);
  doc.text(`Total Packages: ${shipments.length}`, 50, 178);

  // Table Header
  const tableY = 220;
  doc.setFillColor(BRAND_NAVY).rect(40, tableY, pw - 80, 25, "F");
  
  doc.setTextColor("#ffffff").setFontSize(9).setFont("helvetica", "bold");
  doc.text("Tracking Number", 50, tableY + 17);
  doc.text("Service", 170, tableY + 17);
  doc.text("Weight", 250, tableY + 17);
  doc.text("Destination", 310, tableY + 17);
  doc.text("Status", 490, tableY + 17);

  // Table Rows
  let rY = tableY + 45;
  doc.setFontSize(8).setFont("helvetica", "normal");
  
  shipments.forEach((s) => {
    if (rY > ph - 150) {
      // New Page if it overflows
      drawFooter(doc, pw, ph);
      doc.addPage();
      rY = 60;
      doc.setFillColor(BRAND_NAVY).rect(40, rY, pw - 80, 25, "F");
      doc.setTextColor("#ffffff").setFontSize(9).setFont("helvetica", "bold");
      doc.text("Tracking Number", 50, rY + 17);
      doc.text("Service", 170, rY + 17);
      doc.text("Weight", 250, rY + 17);
      doc.text("Destination", 310, rY + 17);
      doc.text("Status", 490, rY + 17);
      rY += 45;
      doc.setFontSize(8).setFont("helvetica", "normal");
    }

    const dest = typeof s.destination === "string" ? JSON.parse(s.destination) : (s.destination || {});
    
    doc.setTextColor(BRAND_NAVY).setFont("helvetica", "bold");
    doc.text(s.tracking_number || s.trackingNumber, 50, rY);
    
    doc.setFont("helvetica", "normal").setTextColor(TEXT_MUTED);
    doc.text(s.service || "Standard", 170, rY);
    doc.text(`${s.package?.weight_kg || 1} KG`, 250, rY);
    
    doc.text(`${dest.city || "Unknown"}, ${dest.country_code || ""}`, 310, rY);
    doc.text(s.status || "Pending", 490, rY);
    
    doc.setDrawColor("#f1f5f9").setLineWidth(0.5).line(40, rY + 10, pw - 40, rY + 10);
    rY += 25;
  });

  // Signatures
  rY += 20;
  if (rY > ph - 100) {
    drawFooter(doc, pw, ph);
    doc.addPage();
    rY = 60;
  }
  
  doc.setDrawColor(BRAND_NAVY).setLineWidth(0.5).line(40, rY + 40, 250, rY + 40);
  doc.text("Driver Signature", 40, rY + 55);

  doc.line(300, rY + 40, 500, rY + 40);
  doc.text("Dispatch Signature", 300, rY + 55);

  drawFooter(doc, pw, ph);

  doc.save(`manifest_${manifestId}.pdf`);
}
