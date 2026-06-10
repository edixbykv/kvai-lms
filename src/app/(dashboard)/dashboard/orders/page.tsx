import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt } from "lucide-react";

export const metadata = { title: "Orders & Invoices" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { invoice: true, payment: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Orders & Invoices</h2>
        <p className="text-muted-foreground">Your purchase history.</p>
      </div>
      {orders.length === 0 ? (
        <Card className="p-12 text-center"><Receipt className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 text-muted-foreground">No orders yet.</p></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const items = o.items as Array<{ title: string }>;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{items[0]?.title ?? "Order"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(Number(o.total))}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "PAID" ? "success" : o.status === "FAILED" ? "destructive" : "secondary"}>{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{o.invoice?.number ?? "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
