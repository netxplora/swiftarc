import { jsPDF } from "jspdf";
import { format } from "date-fns";

export function generateShippingLabel(shipment: any) {
  // Create a 4x6 inch label (101.6 x 152.4 mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [101.6, 152.4]
  });

  // Fonts & styles
  doc.setFont("helvetica");

  // Border
  doc.rect(2, 2, 97.6, 148.4);

  // Header Zone
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SWIFTARC", 5, 12);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(shipment.service.toUpperCase(), 95, 12, { align: "right" });

  doc.line(2, 16, 99.6, 16);

  // Origin
  doc.setFontSize(8);
  doc.text("FROM:", 5, 22);
  doc.setFont("helvetica", "bold");
  const orig = typeof shipment.origin === "string" ? JSON.parse(shipment.origin) : shipment.origin;
  doc.text(`${orig.city}, ${orig.country_code}`, 5, 27);

  // Weight & Dimension
  doc.setFont("helvetica", "normal");
  const actualWt = shipment.package?.weight_kg || 1;
  const volWt = shipment.volumetric_weight || 0;
  const billedWt = Math.max(actualWt, volWt);
  
  doc.text(`BILLED: ${billedWt} KG`, 95, 22, { align: "right" });
  if (volWt > 0) {
    doc.setFontSize(6);
    doc.text(`(DIM: ${volWt.toFixed(1)} KG)`, 95, 25, { align: "right" });
  }

  doc.line(2, 32, 99.6, 32);

  // Destination
  doc.setFontSize(10);
  doc.text("TO:", 5, 38);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const dest = typeof shipment.destination === "string" ? JSON.parse(shipment.destination) : shipment.destination;
  doc.text(dest.contact_name || dest.city, 5, 45);
  doc.text(`${dest.city}, ${dest.country_code}`, 5, 52);

  doc.line(2, 60, 99.6, 60);

  // Tracking #
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TRACKING #", 50, 70, { align: "center" });
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(shipment.tracking_number || shipment.trackingNumber, 50, 78, { align: "center" });

  // Simulated Barcode
  let x = 15;
  while (x < 85) {
    const w = Math.random() * 1.5 + 0.2;
    doc.rect(x, 82, w, 20, "F");
    x += w + Math.random() * 1.5 + 0.2;
  }

  doc.line(2, 110, 99.6, 110);

  // Hazmat Indicator & Routing
  if (shipment.is_hazmat) {
    doc.setFillColor(0, 0, 0);
    doc.rect(2, 110, 97.6, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("HAZMAT / DG", 50, 120, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text(dest.country_code.substring(0, 3).toUpperCase(), 50, 138, { align: "center" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Powered by SwiftArc Network", 50, 148, { align: "center" });

  doc.save(`${shipment.tracking_number || shipment.trackingNumber}_label.pdf`);
}
