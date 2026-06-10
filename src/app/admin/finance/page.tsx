import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RefundButton } from "@/components/admin/refund-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IndianRupee, RotateCcw, Receipt, TrendingUp } from "lucide-react";

export const metadata = { title: "Finance" };
export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [payments, refunds, paidAgg, orderCount] = await Promise.all([
    prisma.payment.findMany({ include: { order: { include: { user: true, invoice: true } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.refund.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { amount: true } }),
    prisma.order.count({ where: { status: "PAID" } }),
  ]);

  const totalRevenue = Number(paidAgg._sum.amount ?? 0);
  const totalRefunds = Number(refunds._sum.amount ?? 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Finance</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={IndianRupee} accent="primary" />
        <StatCard label="Net Revenue" value={formatCurrency(totalRevenue - totalRefunds)} icon={TrendingUp} accent="blue" />
        <StatCard label="Paid Orders" value={orderCount} icon={Receipt} accent="violet" />
        <StatCard label="Refunds" value={formatCurrency(totalRefunds)} icon={RotateCcw} accent="rose" hint={`${refunds._count} refund(s)`} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell><p className="font-medium">{p.order.user.name}</p><p className="text-xs text-muted-foreground">{p.order.user.email}</p></TableCell>
                <TableCell className="text-muted-foreground">{p.order.invoice?.number ?? "—"}</TableCell>
                <TableCell>{formatCurrency(Number(p.amount))}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{p.method}</TableCell>
                <TableCell><Badge variant={p.status === "CAPTURED" ? "success" : p.status === "REFUNDED" ? "destructive" : "secondary"}>{p.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                <TableCell>{p.status === "CAPTURED" && <RefundButton paymentId={p.id} />}</TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No payments yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
