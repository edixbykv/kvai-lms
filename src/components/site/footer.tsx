import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Mail, MapPin, Phone } from "lucide-react";

const cols = [
  {
    title: "Platform",
    links: [
      { href: "/courses", label: "All Courses" },
      { href: "/dashboard", label: "My Learning" },
      { href: "/verify", label: "Verify Certificate" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact" },
      { href: "/success-stories", label: "Success Stories" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              KVAI LMS is a professional online education platform by KVAI Solutions —
              empowering students, institutes, skill councils and corporates with
              expert-led courses and verifiable certificates.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> support@kvai.in</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +91 00000 00000</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> India · learn.kvai.in</p>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold">{c.title}</h4>
              <ul className="mt-4 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} KVAI Solutions. All rights reserved.</p>
          <p>Built with care for learners across India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
