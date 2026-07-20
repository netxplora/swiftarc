import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Building2, Globe2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Sales & Support — SwiftArc" },
      { name: "description", content: "Get in touch with SwiftArc's enterprise sales team or global support network." },
      { property: "og:title", content: "Contact SwiftArc" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Your inquiry has been received. Our team will contact you shortly.");
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  const offices = [
    { city: "London", region: "EMEA Headquarters", address: "1 Canada Square, Canary Wharf, London E14 5AB", phone: "+44 20 7946 0958" },
    { city: "New York", region: "Americas Headquarters", address: "One World Trade Center, Suite 4500, NY 10007", phone: "+1 212 555 0198" },
    { city: "Singapore", region: "APAC Headquarters", address: "8 Marina View, Asia Square Tower 1, Singapore 018960", phone: "+65 6555 0122" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title="We're here to help."
        subtitle="Reach out to our enterprise sales team to discuss custom lanes, or contact our 24/7 global support network for immediate assistance."
        imageSrc="/images/hero_about_1784188685141.png"
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber">Get in touch</p>
              <h2 className="mt-2 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Speak with a logistics engineer.
              </h2>
            </div>
            <p className="mt-4 text-muted-foreground max-w-md">
              Whether you need to architect a complex cold-chain route or integrate your e-commerce platform via our API, our specialists are ready to architect your solution.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" required className="h-12 bg-secondary/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" required className="h-12 bg-secondary/30" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" required className="h-12 bg-secondary/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" required className="h-12 bg-secondary/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">How can we help?</Label>
                <textarea 
                  id="message" 
                  required 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 bg-navy-deep text-cream hover:bg-navy">
                {loading ? "Submitting..." : "Send inquiry"}
              </Button>
            </form>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-display text-2xl font-bold">Global Offices</h3>
              <p className="mt-2 text-sm text-muted-foreground">Operating across 3 major hubs to ensure 24/7 coverage.</p>
            </div>
            
            <div className="grid gap-6">
              {offices.map((office) => (
                <Card key={office.city} className="overflow-hidden border-border transition-colors hover:border-amber/50">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-navy-deep">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg font-bold">{office.city}</h4>
                      <p className="text-xs uppercase tracking-widest text-amber mt-1">{office.region}</p>
                      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {office.address}</p>
                        <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {office.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="rounded-2xl bg-navy-deep p-8 text-cream">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-amber" /> Need immediate support?
              </h3>
              <p className="mt-3 text-sm text-cream/70">
                Existing customers receive 24/7 priority routing support. Please log in to your dashboard to access live chat or call your dedicated account manager.
              </p>
              <div className="mt-6 flex gap-4">
                <Button variant="outline" className="border-cream/20 bg-cream/10 text-cream hover:bg-cream/20">
                  <Mail className="mr-2 h-4 w-4" /> support@swiftarc.com
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
