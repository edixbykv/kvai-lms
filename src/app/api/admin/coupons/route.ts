import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, created, fail, parseBody, permissionGuard } from "@/lib/api";
import { couponSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";

export const POST = handler(async (req: NextRequest) => {
  const admin = await permissionGuard("course.edit");
  const data = await parseBody(req, couponSchema);
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) return fail(409, "A coupon with this code already exists");

  const coupon = await prisma.coupon.create({
    data: {
      code: data.code, type: data.type, value: data.value,
      maxUses: data.maxUses, minAmount: data.minAmount,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  await audit({ userId: admin.id, action: "coupon.create", category: "system", entityId: coupon.id });
  return created(coupon);
});
