import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your data across the SwiftArc network."
        imageSrc="/images/hero_privacy_1784191969045.png"
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none">
          <h3>1. Data Collection</h3>
          <p>
            We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.
          </p>
          <h3>2. Information We Collect Through Your Use of Our Services</h3>
          <p>
            When you use our Services, we collect information about you in the following general categories: Location Information, Usage and Preference Information, Device Information, Call and SMS Data, and Log Information.
          </p>
          <h3>3. Use of Information</h3>
          <p>
            We may use the information we collect about you to Provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support, develop safety features, authenticate users, and send product updates and administrative messages.
          </p>
          <h3>4. Sharing of Information</h3>
          <p>
            We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows: With service providers, vendors, consultants, marketing partners, and other third parties who need access to such information to carry out work on our behalf.
          </p>
        </div>
      </section>
    </>
  );
}
