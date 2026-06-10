import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { handler, ok, fail, parseBody, authGuard } from "@/lib/api";
import { audit } from "@/lib/audit";

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
});

export const POST = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const { currentPassword, newPassword } = await parseBody(req, schema);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return fail(404, "User not found");

  if (dbUser.passwordHash) {
    if (!currentPassword) return fail(400, "Current password is required");
    const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!valid) return fail(401, "Current password is incorrect");
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await audit({ userId: user.id, action: "profile.password_change", category: "login" });
  return ok({ updated: true });
});
