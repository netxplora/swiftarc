import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SwiftArc Logistics" },
      {
        name: "description",
        content: "Learn how SwiftArc Logistics collects, manages, and protects your personal and shipment information.",
      },
      { property: "og:title", content: "Privacy Policy — SwiftArc Logistics" },
      { property: "og:description", content: "Our commitments to customer data privacy and secure logistics processing." },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal & Governance"
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your personal information and shipment records across SwiftArc."
        imageSrc={heroImg}
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none space-y-8 text-foreground/90">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">1. Information We Collect</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
              We collect information necessary to fulfill shipping and logistics services, including contact names, physical delivery addresses, phone numbers, email addresses, package dimensions, weights, and declared item values.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">2. Use of Information</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Information collected is used strictly for routing shipments, customs documentation, tracking event delivery notices, billing transactions, and customer service communication.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">3. Data Sharing & Customs Compliance</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Shipment details are shared with verified transport partners, international air/sea carriers, and authorized government customs authorities strictly as required to complete delivery and comply with international trade laws.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">4. Data Security & Retention</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
              We implement industry-standard encryption, strict access controls, and regular security audits to protect account and tracking records against unauthorized access.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
