"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: String(fd.get("password")) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.message || "Reset failed");
      return;
    }
    toast.success("Password updated! Please sign in.");
    router.push("/login");
  }

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Invalid link</h2>
        <p className="mt-2 text-sm text-muted-foreground">This reset link is missing or invalid.</p>
        <Button asChild className="mt-6"><Link href="/forgot-password">Request a new link</Link></Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold">Set a new password</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" placeholder="At least 8 characters" required minLength={8} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
