import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  showText = true,
  white = false,
}: {
  className?: string;
  href?: string;
  showText?: boolean;
  white?: boolean;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-bold", className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </span>
      {showText && (
        <span className={cn("text-lg tracking-tight", white ? "text-white" : "text-foreground")}>
          KVAI<span className="text-primary">{white ? "" : ""}</span>
          <span className={white ? "text-green-300" : "text-primary"}> LMS</span>
        </span>
      )}
    </Link>
  );
}
