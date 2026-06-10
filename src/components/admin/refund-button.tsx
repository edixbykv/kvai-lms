"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function RefundButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function refund() {
    if (!confirm("Process a full refund for this payment? The student will lose course access.")) return;
    setLoading(true);
    const res = await fetch("/api/admin/refunds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId, reason: "Admin refund" }) });
    const d = await res.json();
    setLoading(false);
    if (res.ok) { toast.success("Refund processed"); router.refresh(); } else toast.error(d.message || "Refund failed");
  }
  return <Button size="sm" variant="outline" className="text-red-600" disabled={loading} onClick={refund}>Refund</Button>;
}
