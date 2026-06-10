import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { CheckCircle2, GraduationCap, ShieldCheck, Award } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-primary p-12 text-white lg:flex">
        <Logo white href="/" />
        <div className="space-y-6">
          <h1 className="text-3xl font-bold leading-tight">
            Learn in-demand skills.<br />Earn verifiable certificates.
          </h1>
          <ul className="space-y-4 text-green-50">
            {[
              { icon: GraduationCap, text: "Expert-led courses across top categories" },
              { icon: Award, text: "Industry-recognised certificates with QR verification" },
              { icon: ShieldCheck, text: "Secure, private and trusted by institutes" },
              { icon: CheckCircle2, text: "Learn on any device, at your own pace" },
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <f.icon className="h-5 w-5" />
                </span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-green-100">© {new Date().getFullYear()} KVAI Solutions · learn.kvai.in</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <div className="p-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
