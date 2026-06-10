"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CouponDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("PERCENTAGE");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/coupons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: String(fd.get("code")).toUpperCase(), type,
        value: Number(fd.get("value")), maxUses: Number(fd.get("maxUses") || 0),
        minAmount: Number(fd.get("minAmount") || 0),
        expiresAt: fd.get("expiresAt") ? String(fd.get("expiresAt")) : null,
      }),
    });
    const d = await res.json();
    if (res.ok) { toast.success("Coupon created"); setOpen(false); router.refresh(); } else toast.error(d.message || "Failed");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> New coupon</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create coupon</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="code">Code</Label><Input id="code" name="code" required placeholder="WELCOME20" className="uppercase" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="PERCENTAGE">Percentage</SelectItem><SelectItem value="FLAT">Flat (₹)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="value">Value</Label><Input id="value" name="value" type="number" min={0} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="maxUses">Max uses (0 = ∞)</Label><Input id="maxUses" name="maxUses" type="number" min={0} defaultValue={0} /></div>
            <div className="space-y-2"><Label htmlFor="minAmount">Min amount (₹)</Label><Input id="minAmount" name="minAmount" type="number" min={0} defaultValue={0} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="expiresAt">Expires</Label><Input id="expiresAt" name="expiresAt" type="date" /></div>
          <DialogFooter><Button type="submit">Create coupon</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
