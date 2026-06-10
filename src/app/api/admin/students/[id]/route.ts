import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody, permissionGuard } from "@/lib/api";
import { audit } from "@/lib/audit";

const schema = z.object({ action: z.enum(["suspend", "activate"]) });

export const PATCH = handler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await permissionGuard("student.suspend");
  const { id } = await ctx.params;
  const { action } = await parseBody(req, schema);

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return fail(404, "User not found");

  const status = action === "suspend" ? "SUSPENDED" : "ACTIVE";
  await prisma.user.update({ where: { id }, data: { status } });
  if (action === "suspend") await prisma.session.updateMany({ where: { userId: id }, data: { revoked: true } });

  await audit({ userId: admin.id, action: `student.${action}`, category: "student", entityId: id });
  return ok({ status });
});
