import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { handler, ok, fail, parseBody } from "@/lib/api";
import { resetSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";

export const POST = handler(async (req: NextRequest) => {
  const { token, password } = await parseBody(req, resetSchema);

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.type !== "PASSWORD_RESET") return fail(400, "Invalid reset link");
  if (record.usedAt) return fail(400, "This link has already been used");
  if (record.expiresAt < new Date()) return fail(400, "This reset link has expired");

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // revoke all existing sessions for safety
    prisma.session.updateMany({ where: { userId: record.userId }, data: { revoked: true } }),
  ]);

  await audit({ userId: record.userId, action: "auth.password_reset", category: "login" });

  return ok({ reset: true });
});
