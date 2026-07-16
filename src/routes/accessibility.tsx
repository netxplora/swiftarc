import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import imageSrc from "@/assets/warehouse.jpg";

export const Route = createFileRoute("/accessibility")({
  component: AccessibilityPage,
});

function AccessibilityPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="Accessibility Statement"
        subtitle="Our commitment to making logistics accessible for everyone."
        imageSrc={imageSrc}
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none">
          <h3>Our Commitment</h3>
          <p>
            SwiftArc is committed to providing a website and logistics platform that is accessible to the widest possible audience, regardless of technology or ability. We are actively working to increase the accessibility and usability of our website and in doing so adhere to many of the available standards and guidelines.
          </p>
          <h3>Standards compliance</h3>
          <p>
            We endeavor to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 level AA. These guidelines explain how to make web content more accessible for people with disabilities. Conformance with these guidelines will help make the web more user friendly for all people.
          </p>
          <h3>Feedback</h3>
          <p>
            We are continually seeking out solutions that will bring all areas of the site up to the same level of overall web accessibility. In the meantime should you experience any difficulty in accessing the SwiftArc website, please don't hesitate to contact our dedicated accessibility support team.
          </p>
        </div>
      </section>
    </>
  );
}
