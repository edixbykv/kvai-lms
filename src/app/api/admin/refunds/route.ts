import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody, permissionGuard } from "@/lib/api";
import { isRazorpayConfigured, getRazorpay } from "@/lib/razorpay";
import { audit } from "@/lib/audit";

const schema = z.object({ paymentId: z.string(), reason: z.string().optional() });

export const POST = handler(async (req: NextRequest) => {
  const admin = await permissionGuard("finance.refunds");
  const { paymentId, reason } = await parseBody(req, schema);

  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment) return fail(404, "Payment not found");
  if (payment.status === "REFUNDED") return fail(400, "Already refunded");

  let razorpayRefundId: string | undefined;
  if (isRazorpayConfigured && payment.razorpayPaymentId) {
    try {
      const r = await getRazorpay().payments.refund(payment.razorpayPaymentId, { amount: Number(payment.amount) * 100 });
      razorpayRefundId = r.id;
    } catch {
      return fail(502, "Razorpay refund failed");
    }
  }

  await prisma.$transaction([
    prisma.refund.create({ data: { paymentId, amount: payment.amount, reason, status: "PROCESSED", razorpayRefundId, processedAt: new Date() } }),
    prisma.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED" } }),
    prisma.order.update({ where: { id: payment.orderId }, data: { status: "REFUNDED" } }),
  ]);

  // Revoke enrollment tied to this order
  const items = payment.order.items as Array<{ id: string; type: string }>;
  const courseItem = items.find((i) => i.type === "course");
  if (courseItem) {
    await prisma.enrollment.updateMany({ where: { userId: payment.order.userId, courseId: courseItem.id }, data: { status: "CANCELLED" } });
  }

  await audit({ userId: admin.id, action: "payment.refund", category: "payment", entityId: paymentId, metadata: { amount: Number(payment.amount) } });
  return ok({ refunded: true });
});
