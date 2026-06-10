"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CertificateActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  async function act(action: "revoke" | "reissue") {
    const res = await fetch(`/api/admin/certificates/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const d = await res.json();
    if (res.ok) { toast.success(`Certificate ${action}d`); router.refresh(); } else toast.error(d.message || "Failed");
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => act("reissue")}>Reissue</Button>
      {status !== "REVOKED" && <Button size="sm" variant="outline" className="text-red-600" onClick={() => act("revoke")}>Revoke</Button>}
    </div>
  );
}
