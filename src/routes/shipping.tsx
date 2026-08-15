import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Book a Shipment — SwiftArc" },
      {
        name: "description",
        content:
          "Book air, express, ground, or freight shipments across 220+ countries with real-time tracking.",
      },
    ],
  }),
  component: ShippingInfo,
});

function ShippingInfo() {
  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="Shipping Update"
        title="Shipping Services"
        subtitle="Important changes to our shipment booking process."
      />

      <main className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-3xl font-light tracking-tight text-foreground">
            Office-First Shipping Model
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed">
            To ensure the highest level of security, compliance, and accurate weighing for all
            packages,
            <strong> customers can no longer create shipments directly online.</strong>
          </p>

          <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-left mt-8">
            <h3 className="text-xl font-medium mb-4 text-foreground">How to ship with SwiftArc:</h3>
            <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
              <li>Bring your physical package to the nearest SwiftArc courier office.</li>
              <li>Our staff will inspect, weigh, and measure your package accurately.</li>
              <li>An agent will create your shipment record and process your payment on-site.</li>
              <li>You will receive your tracking number and receipt immediately.</li>
            </ol>
          </div>

          <div className="pt-8">
            <Button asChild size="lg" className="rounded-full h-12 px-8">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Home
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
