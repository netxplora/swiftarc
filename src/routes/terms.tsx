import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="The rules, guidelines, and agreements for using the SwiftArc network."
        imageSrc="/images/hero_terms_1784191977588.png"
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none">
          <h3>1. Contractual Relationship</h3>
          <p>
            These Terms of Use ("Terms") govern the access or use by you, an individual, from within any country in the world of applications, websites, content, products, and services made available by SwiftArc Global Logistics.
          </p>
          <h3>2. The Services</h3>
          <p>
            The Services constitute a technology platform that enables users of SwiftArc's mobile applications or websites provided as part of the Services to arrange and schedule transportation and/or logistics services with independent third party providers of such services.
          </p>
          <h3>3. Your Use of the Services</h3>
          <p>
            In order to use most aspects of the Services, you must register for and maintain an active personal user Services account ("Account"). You must be at least 18 years of age to obtain an Account.
          </p>
          <h3>4. Payment</h3>
          <p>
            You understand that use of the Services may result in charges to you for the services or goods you receive from a Third Party Provider ("Charges"). After you have received services or goods obtained through your use of the Service, SwiftArc will facilitate your payment of the applicable Charges.
          </p>
        </div>
      </section>
    </>
  );
}
