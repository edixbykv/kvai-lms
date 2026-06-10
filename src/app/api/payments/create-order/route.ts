import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody, authGuard } from "@/lib/api";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";
import { enrollUser } from "@/lib/enroll";
import { nanoid } from "nanoid";

const schema = z.object({
  courseId: z.string(),
  couponCode: z.string().optional(),
});

export const POST = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const { courseId, couponCode } = await parseBody(req, schema);

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED") return fail(404, "Course not available");

  const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (existing && existing.status === "ACTIVE") return fail(409, "You are already enrolled");

  let amount = course.discountPrice ? Number(course.discountPrice) : Number(course.price);
  let discount = 0;
  let couponId: string | undefined;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses)) {
      discount = coupon.type === "PERCENTAGE" ? (amount * Number(coupon.value)) / 100 : Number(coupon.value);
      discount = Math.min(discount, amount);
      couponId = coupon.id;
    }
  }

  const total = Math.max(0, Math.round(amount - discount));
  const items = [{ type: "course", id: course.id, title: course.title, price: amount }];

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      amount,
      discount,
      total,
      currency: "INR",
      status: "CREATED",
      couponId,
      items,
    },
  });

  // No Razorpay credentials yet → simulate a successful purchase so the
  // platform remains fully usable. Replace by adding RAZORPAY_* env vars.
  if (!isRazorpayConfigured) {
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
      prisma.payment.create({ data: { orderId: order.id, amount: total, status: "CAPTURED", method: "simulated" } }),
      prisma.invoice.create({ data: { orderId: order.id, number: `INV-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}` } }),
    ]);
    if (couponId) await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    await enrollUser(user.id, course.id, order.id);
    return ok({ simulated: true, slug: course.slug });
  }

  const rzpOrder = await getRazorpay().orders.create({
    amount: total * 100, // paise
    currency: "INR",
    receipt: order.id,
    notes: { userId: user.id, courseId: course.id },
  });

  await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzpOrder.id } });

  return ok({
    simulated: false,
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: total,
    currency: "INR",
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    name: "KVAI LMS",
    description: course.title,
    prefill: { name: user.name, email: user.email },
  });
});
