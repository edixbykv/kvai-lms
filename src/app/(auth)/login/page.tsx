"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/auth/google-button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      code: fd.get("code") ? String(fd.get("code")) : undefined,
    };
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.errors?.twoFactor) {
        setNeeds2fa(true);
        toast.info("Enter the 2FA code sent to you");
        return;
      }
      toast.error(data.message || "Login failed");
      return;
    }
    toast.success("Welcome back!");
    const redirect = params.get("redirect") || "/dashboard";
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold">Welcome back</h2>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your learning journey.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
        </div>
        {needs2fa && (
          <div className="space-y-2">
            <Label htmlFor="code">2FA Code</Label>
            <Input id="code" name="code" placeholder="6-digit code" />
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to KVAI LMS?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">Create an account</Link>
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo accounts</p>
        <p>Admin: admin@kvai.in / Admin@123</p>
        <p>Student: student@kvai.in / Student@123</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
