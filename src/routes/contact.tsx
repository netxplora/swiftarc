import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Mail, Phone, MapPin } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact SwiftArc" },
      { name: "description", content: "Talk to sales, get support, or visit a SwiftArc office. We respond in under 4 hours." },
      { property: "og:title", content: "Contact SwiftArc" },
      { property: "og:description", content: "Sales, support, offices — get in touch." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [submitting, setSubmitting] = useState(false);
  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title="We're here to help you navigate."
        subtitle="Get in touch with our global support team, sales experts, or local service centers."
        imageSrc="/images/hero_contact_1784190730869.png"
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8">
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            await new Promise((r) => setTimeout(r, 900));
            setSubmitting(false);
            toast.success("Message received", { description: "We'll reply within 4 hours." });
            (e.target as HTMLFormElement).reset();
          }}
        >
          <h2 className="font-display text-2xl">Send us a message</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input required className="mt-1.5 h-11" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" required className="mt-1.5 h-11" />
            </div>
            <div className="sm:col-span-2">
              <Label>Company (optional)</Label>
              <Input className="mt-1.5 h-11" />
            </div>
            <div className="sm:col-span-2">
              <Label>How can we help?</Label>
              <Textarea required rows={5} className="mt-1.5" />
            </div>
          </div>
          <Button disabled={submitting} type="submit" className="mt-6 h-11 bg-navy-deep text-cream hover:bg-navy">
            {submitting ? "Sending…" : "Send message"}
          </Button>
        </motion.form>

        <motion.aside 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg">Sales</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber" />sales@swiftarc.example</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber" />+31 10 555 0100</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg">Support</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber" />support@swiftarc.example</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber" />+1 800 555 0199</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-navy-deep p-6 text-cream">
            <h3 className="font-display text-lg">Global HQ</h3>
            <p className="mt-3 flex items-start gap-2 text-sm text-cream/80">
              <MapPin className="mt-0.5 h-4 w-4 text-amber" />
              Waalhaven Z.z. 32, 3089 JJ Rotterdam, Netherlands
            </p>
          </div>
        </motion.aside>
      </section>
    </>
  );
}
