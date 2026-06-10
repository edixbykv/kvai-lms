import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CouponDialog } from "@/components/admin/coupon-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Marketing" };
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const [coupons, leads] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Marketing</h2>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Coupons</CardTitle>
          <CouponDialog />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Used</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>{c.type === "PERCENTAGE" ? `${Number(c.value)}%` : formatCurrency(Number(c.value))}</TableCell>
                  <TableCell>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</TableCell>
                  <TableCell className="text-muted-foreground">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</TableCell>
                  <TableCell><Badge variant={c.isActive ? "success" : "secondary"}>{c.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                </TableRow>
              ))}
              {coupons.length === 0 && <TableRow><TableCell colSpan={5} className="py-6 text-center text-muted-foreground">No coupons yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Leads ({leads.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.email}</TableCell>
                  <TableCell className="text-muted-foreground">{l.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{l.source ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(l.createdAt)}</TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No leads yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
