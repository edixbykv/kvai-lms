"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Verification token is missing.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setState("ok");
        else {
          setState("error");
          setMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Something went wrong.");
      });
  }, [token]);

  return (
    <div className="animate-fade-in text-center">
      {state === "loading" && (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h2 className="mt-4 text-2xl font-bold">Verifying your email…</h2>
        </>
      )}
      {state === "ok" && (
        <>
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-2xl font-bold">Email verified!</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your account is now fully activated.</p>
          <Button asChild className="mt-6"><Link href="/dashboard">Go to dashboard</Link></Button>
        </>
      )}
      {state === "error" && (
        <>
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold">Verification failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Button asChild variant="outline" className="mt-6"><Link href="/login">Back to sign in</Link></Button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
