"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    if (c) router.push(`/verify/${encodeURIComponent(c)}`);
  }

  return (
    <>
      <PageHero title="Verify a Certificate" subtitle="Confirm the authenticity of any KVAI LMS certificate." />
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Enter certificate ID or verification code</h2>
          <p className="mt-1 text-sm text-muted-foreground">You&apos;ll find this on the certificate, e.g. KVAI-2026-ABCD1234.</p>
          <form onSubmit={onSubmit} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="KVAI-2026-XXXXXXXX" className="pl-10" />
            </div>
            <Button type="submit">Verify</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
