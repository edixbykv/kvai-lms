"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function EnrollButton({
  courseId, slug, isFree, enrolled, authed,
}: {
  courseId: string;
  slug: string;
  isFree: boolean;
  price: number;
  title: string;
  enrolled: boolean;
  authed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (enrolled) {
    return (
      <Button className="w-full" size="lg" asChild>
        <Link href={`/learn/${slug}`}>Go to course <ArrowRight className="h-4 w-4" /></Link>
      </Button>
    );
  }

  if (!authed) {
    return (
      <Button className="w-full" size="lg" asChild>
        <Link href={`/login?redirect=/courses/${slug}`}>{isFree ? "Enroll free" : "Sign in to enroll"}</Link>
      </Button>
    );
  }

  async function enrollFree() {
    setLoading(true);
    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(data.message || "Enrollment failed");
    toast.success("Enrolled! Redirecting…");
    router.push(`/learn/${slug}`);
    router.refresh();
  }

  async function checkout() {
    setLoading(true);
    const res = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      return toast.error(data.message || "Could not start checkout");
    }

    // Simulated checkout (no Razorpay keys configured)
    if (data.data.simulated) {
      setLoading(false);
      toast.success("Purchase complete! Redirecting…");
      router.push(`/learn/${slug}`);
      router.refresh();
      return;
    }

    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      setLoading(false);
      return toast.error("Failed to load payment gateway");
    }

    const rzp = new window.Razorpay({
      key: data.data.key,
      amount: data.data.amount * 100,
      currency: data.data.currency,
      name: data.data.name,
      description: data.data.description,
      order_id: data.data.razorpayOrderId,
      prefill: data.data.prefill,
      theme: { color: "#15803d" },
      handler: async (response: Record<string, string>) => {
        const v = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.data.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        const vd = await v.json();
        if (v.ok) {
          toast.success("Payment successful!");
          router.push(`/learn/${slug}`);
          router.refresh();
        } else {
          toast.error(vd.message || "Verification failed");
        }
      },
    });
    setLoading(false);
    rzp.open();
  }

  return (
    <Button className="w-full" size="lg" disabled={loading} onClick={isFree ? enrollFree : checkout}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isFree ? "Enroll for free" : "Buy now"}
    </Button>
  );
}
