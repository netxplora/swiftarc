import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — SwiftArc Logistics" },
      {
        name: "description",
        content:
          "Terms and conditions governing shipping, courier drop-off, freight handling, and platform usage with SwiftArc Logistics.",
      },
      { property: "og:title", content: "Terms of Service — SwiftArc Logistics" },
      {
        property: "og:description",
        content: "Guidelines and terms for shipping, customs clearance, and courier services.",
      },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal & Governance"
        title="Terms of Service"
        subtitle="The standard terms and conditions governing courier services, freight handling, and website usage."
        imageSrc={heroImg}
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none space-y-8 text-foreground/90">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              1. Scope of Logistics Services
            </h2>
            <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
              SwiftArc Logistics coordinates ground transportation, air cargo, ocean freight,
              warehousing, and customs clearance services through our dedicated offices, certified
              operators, and global partner networks.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              2. Package Inspection & On-Site Verification
            </h2>
            <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
              All physical shipments must be weighed, inspected, and processed by authorized
              SwiftArc staff at our branch offices. We reserve the right to inspect packaging to
              ensure safety, security, and compliance with dangerous goods regulations.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              3. Tariffs, Duties, and Taxes
            </h2>
            <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Unless a Delivered Duty Paid (DDP) service is specifically selected, the recipient is
              responsible for any applicable import duties, customs tariffs, and local taxes
              assessed by destination border authorities.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              4. Carrier Liability and Coverage
            </h2>
            <p className="mt-2 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Standard shipments include basic statutory liability limits based on weight. Senders
              may declare higher values and purchase additional cargo insurance at the time of
              branch booking.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
