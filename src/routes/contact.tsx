import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Building2, Globe, Globe2, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — SwiftArc Logistics Support" },
      {
        name: "description",
        content:
          "Contact SwiftArc for customer support, shipping quotes, package inquiries, and office locations worldwide. We are available 24/7.",
      },
      { property: "og:title", content: "Contact Us — SwiftArc Logistics" },
      {
        property: "og:description",
        content: "Get in touch with SwiftArc for international courier support, rates, and tracking help.",
      },
      { name: "keywords", content: "contact swiftarc, customer support, shipping inquiry, courier office, tracking help" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const offices = [
  {
    city: "London Office",
    region: "European Operations",
    address: "1 Canada Square, Canary Wharf, London E14 5AB, United Kingdom",
    phone: "+44 20 7946 0958",
    email: "london@swiftarc.com",
    hours: "Mon - Sat: 08:00 - 20:00",
  },
  {
    city: "New York Office",
    region: "North American Operations",
    address: "One World Trade Center, Suite 4500, New York, NY 10007, USA",
    phone: "+1 212 555 0198",
    email: "ny@swiftarc.com",
    hours: "Mon - Sat: 08:00 - 20:00",
  },
  {
    city: "Singapore Office",
    region: "Asia-Pacific Operations",
    address: "8 Marina View, Asia Square Tower 1, Singapore 018960",
    phone: "+65 6555 0122",
    email: "singapore@swiftarc.com",
    hours: "Mon - Sat: 08:00 - 20:00",
  },
];

function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Your message has been sent. A team member will respond shortly.");
      (e.target as HTMLFormElement).reset();
    }, 1200);
  };

  return (
    <>
      {/* Clean Light Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-secondary/30 dark:via-background dark:to-background pt-14 pb-20 sm:pt-16 sm:pb-24 border-b border-border/50">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#032D60 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-4"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>24/7 CUSTOMER SERVICE</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#032D60] dark:text-white leading-[1.12]"
              >
                Contact SwiftArc <span className="text-primary">Support</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed"
              >
                Our global customer operations team is ready to assist you with tracking inquiries,
                branch directions, custom rate quotes, and delivery coordination.
              </motion.p>
            </div>

            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative overflow-hidden rounded-3xl border border-border shadow-2xl bg-card p-2"
              >
                <img
                  src={heroImg}
                  alt="SwiftArc Customer Support"
                  className="w-full h-72 sm:h-80 rounded-2xl object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="bg-background py-10 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card className="border-border bg-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mt-1">Available 24/7 for urgent inquiries</p>
                  <a href="tel:+18009479382" className="text-sm font-semibold text-primary mt-2 inline-block hover:underline">
                    +1 (800) 947-9382
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Email Support</h3>
                  <p className="text-sm text-muted-foreground mt-1">Replies within 2 to 4 hours</p>
                  <a href="mailto:support@swiftarc.com" className="text-sm font-semibold text-primary mt-2 inline-block hover:underline">
                    support@swiftarc.com
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Courier Offices</h3>
                  <p className="text-sm text-muted-foreground mt-1">Find your nearest drop-off hub</p>
                  <Link to="/locations" className="text-sm font-semibold text-primary mt-2 inline-flex items-center hover:underline">
                    Find Locations <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content: Form + Office List */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Send a Message</p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How Can We Help You?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Fill out the form below with your shipment details or general inquiry, and our support
                team will get back to you promptly.
              </p>
            </div>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-6 sm:p-8">
                {submitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground">Thank You!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm">
                      Your message has been received. One of our support representatives will contact you via email shortly.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                          First Name *
                        </Label>
                        <Input id="firstName" required placeholder="John" className="h-11 bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                          Last Name *
                        </Label>
                        <Input id="lastName" required placeholder="Doe" className="h-11 bg-background" />
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                          Email Address *
                        </Label>
                        <Input id="email" type="email" required placeholder="john.doe@example.com" className="h-11 bg-background" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                          Phone Number
                        </Label>
                        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="h-11 bg-background" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trackingNumber" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                        Tracking Number (Optional)
                      </Label>
                      <Input id="trackingNumber" placeholder="e.g. SA-7241-9032-11" className="h-11 bg-background font-mono text-sm" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                        Inquiry Subject *
                      </Label>
                      <Input id="subject" required placeholder="Shipment status / Shipping quote / General question" className="h-11 bg-background" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                        Message Details *
                      </Label>
                      <textarea
                        id="message"
                        required
                        rows={4}
                        placeholder="Please describe your request or question in detail..."
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="w-full bg-primary text-white hover:bg-primary-hover font-semibold h-12 shadow-md"
                    >
                      {loading ? "Sending Message..." : "Submit Inquiry"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Regional Offices */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Global Presence</p>
              <h3 className="mt-2 font-display text-2xl font-bold text-foreground">
                Regional Hubs
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Visit or call any of our main coordination hubs for on-site services.
              </p>
            </div>

            <div className="space-y-4">
              {offices.map((office) => (
                <Card key={office.city} className="border-border bg-card hover:border-primary/40 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="font-display font-bold text-foreground text-base">{office.city}</h4>
                        <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-primary">
                          {office.region}
                        </span>
                        <div className="space-y-1 pt-2 text-xs text-muted-foreground">
                          <p className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                            {office.address}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                            {office.phone}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                            {office.hours}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Track Box */}
            <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: "#032D60" }}>
              <h4 className="font-display text-lg font-bold flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-primary" />
                Track an Active Shipment
              </h4>
              <p className="mt-2 text-xs text-white/80 leading-relaxed">
                Already have a tracking code? Check the real-time location and expected delivery date instantly online.
              </p>
              <div className="mt-4">
                <Link to="/tracking">
                  <Button className="w-full bg-primary text-white hover:bg-primary-hover font-semibold text-sm">
                    Go to Tracking Page <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
