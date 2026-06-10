import { NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody, authGuard } from "@/lib/api";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { enrollUser } from "@/lib/enroll";
import { audit } from "@/lib/audit";

const schema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export const POST = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const body = await parseBody(req, schema);

  const valid = verifyPaymentSignature(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature);
  if (!valid) {
    await prisma.order.update({ where: { id: body.orderId }, data: { status: "FAILED" } }).catch(() => {});
    return fail(400, "Payment verification failed");
  }

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order || order.userId !== user.id) return fail(404, "Order not found");

  const items = order.items as Array<{ id: string; type: string }>;
  const courseItem = items.find((i) => i.type === "course");

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
    prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayPaymentId: body.razorpayPaymentId,
        razorpaySignature: body.razorpaySignature,
        amount: order.total,
        status: "CAPTURED",
        method: "razorpay",
      },
    }),
    prisma.invoice.create({ data: { orderId: order.id, number: `INV-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}` } }),
  ]);

  if (order.couponId) await prisma.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });

  let slug: string | undefined;
  if (courseItem) {
    const course = await prisma.course.findUnique({ where: { id: courseItem.id }, select: { slug: true } });
    await enrollUser(user.id, courseItem.id, order.id);
    slug = course?.slug;
  }

  await audit({ userId: user.id, action: "payment.captured", category: "payment", entityId: order.id, metadata: { amount: Number(order.total) } });

  return ok({ verified: true, slug });
});
