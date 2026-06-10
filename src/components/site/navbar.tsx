import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { getCurrentUser } from "@/lib/session";
import { STAFF_ROLE_SLUGS } from "@/lib/rbac";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export async function Navbar() {
  const user = await getCurrentUser();
  const isStaff = !!user && !!user.roleSlug && STAFF_ROLE_SLUGS.includes(user.roleSlug);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/verify" className="hidden text-sm font-medium text-muted-foreground hover:text-primary lg:block">
            Verify Certificate
          </Link>
          {user ? (
            <UserMenu user={{ name: user.name, email: user.email, image: user.image }} isStaff={isStaff} />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
              <Button asChild><Link href="/register">Get Started</Link></Button>
            </div>
          )}
          <MobileNav authed={!!user} />
        </div>
      </div>
    </header>
  );
}
