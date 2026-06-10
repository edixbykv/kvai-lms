import { NextRequest } from "next/server";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";
import { handler, ok, parseBody, authGuard } from "@/lib/api";
import { audit } from "@/lib/audit";

const codeGen = customAlphabet("0123456789", 6);

export const POST = handler(async (req: NextRequest) => {
  const user = await authGuard();
  const { enabled } = await parseBody(req, z.object({ enabled: z.boolean() }));

  // For a production TOTP setup, generate & store a base32 secret and verify
  // codes with otplib. Here we issue a static demo code stored on the user.
  const code = enabled ? codeGen() : null;

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: enabled, twoFactorSecret: code },
  });

  await audit({ userId: user.id, action: enabled ? "2fa.enabled" : "2fa.disabled", category: "login" });
  return ok({ enabled, code });
});
