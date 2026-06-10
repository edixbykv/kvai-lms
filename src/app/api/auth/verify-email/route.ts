import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody } from "@/lib/api";

export const POST = handler(async (req: NextRequest) => {
  const { token } = await parseBody(req, z.object({ token: z.string().min(1) }));

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.type !== "EMAIL_VERIFICATION") return fail(400, "Invalid verification link");
  if (record.usedAt) return fail(400, "This link has already been used");
  if (record.expiresAt < new Date()) return fail(400, "This verification link has expired");

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date(), status: "ACTIVE" } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return ok({ verified: true });
});
