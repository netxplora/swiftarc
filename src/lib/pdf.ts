import { jsPDF } from "jspdf";

export function generateShippingLabel(shipment: {
  trackingNumber: string;
  service: string;
  weightKg: number;
  origin: { city: string; country: string };
  destination: { city: string; country: string };
  recipient: string;
}) {
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
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("SWIFTARC", 5, 12);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(shipment.service.toUpperCase(), 95, 12, { align: "right" });

  doc.line(2, 16, 99.6, 16);

  // Origin
  doc.setFontSize(8);
  doc.text("FROM:", 5, 22);
  doc.setFont("helvetica", "bold");
  doc.text(`${shipment.origin.city}, ${shipment.origin.country}`, 5, 27);

  // Weight
  doc.setFont("helvetica", "normal");
  doc.text(`${shipment.weightKg} KG`, 95, 22, { align: "right" });

  doc.line(2, 32, 99.6, 32);

  // Destination
  doc.setFontSize(10);
  doc.text("TO:", 5, 38);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(shipment.recipient, 5, 45);
  doc.text(`${shipment.destination.city}, ${shipment.destination.country}`, 5, 52);

  doc.line(2, 60, 99.6, 60);

  // Simulated Barcode area (we'll just draw a block of lines to look like a 1D barcode)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TRACKING #", 50, 70, { align: "center" });
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(shipment.trackingNumber, 50, 78, { align: "center" });

  // Draw some lines to simulate a barcode
  let x = 15;
  while (x < 85) {
    const w = Math.random() * 1.5 + 0.2;
    doc.rect(x, 82, w, 20, "F");
    x += w + Math.random() * 1.5 + 0.2;
  }

  doc.line(2, 110, 99.6, 110);

  // Footer / Routing
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text(shipment.destination.country.substring(0, 3).toUpperCase(), 50, 130, { align: "center" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Powered by SwiftArc Network", 50, 145, { align: "center" });

  doc.save(`${shipment.trackingNumber}_label.pdf`);
}
