"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function StudentActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  async function act(action: "suspend" | "activate") {
    const res = await fetch(`/api/admin/students/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    if (res.ok) { toast.success(`Student ${action === "suspend" ? "suspended" : "activated"}`); router.refresh(); }
    else toast.error("Action failed");
  }
  return status === "SUSPENDED" ? (
    <Button size="sm" variant="outline" onClick={() => act("activate")}><CheckCircle2 className="h-4 w-4" /> Activate</Button>
  ) : (
    <Button size="sm" variant="outline" className="text-red-600" onClick={() => act("suspend")}><Ban className="h-4 w-4" /> Suspend</Button>
  );
}
