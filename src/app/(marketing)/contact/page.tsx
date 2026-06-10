import { PageHero } from "@/components/site/page-hero";
import { ContactForm } from "@/components/site/contact-form";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <>
      <PageHero title="Get in touch" subtitle="Have a question? We'd love to hear from you." />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Contact information</h2>
          <p className="text-muted-foreground">Reach out to the KVAI Solutions team — we typically respond within one business day.</p>
          <ul className="space-y-4">
            {[
              { icon: Mail, label: "Email", value: "support@kvai.in" },
              { icon: Phone, label: "Phone", value: "+91 00000 00000" },
              { icon: MapPin, label: "Location", value: "India · learn.kvai.in" },
              { icon: Clock, label: "Hours", value: "Mon–Sat, 9am – 7pm IST" },
            ].map((c) => (
              <li key={c.label} className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary"><c.icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-sm text-muted-foreground">{c.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ContactForm />
      </div>
    </>
  );
}
