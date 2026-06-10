import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { handler, ok, fail, parseBody, getClientIp } from "@/lib/api";
import { loginSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth-session";
import { audit } from "@/lib/audit";
import { parseUserAgent } from "@/lib/useragent";

export const POST = handler(async (req: NextRequest) => {
  const data = await parseBody(req, loginSchema);
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent");

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { role: true },
  });

  async function logFail(userId: string | null, reason: string) {
    if (userId) {
      const parsed = parseUserAgent(ua);
      await prisma.loginHistory.create({
        data: { userId, ipAddress: ip, userAgent: ua ?? undefined, device: parsed.device, success: false, reason },
      });
    }
  }

  if (!user || !user.passwordHash) {
    await logFail(user?.id ?? null, "invalid_credentials");
    return fail(401, "Invalid email or password");
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    await logFail(user.id, "invalid_credentials");
    return fail(401, "Invalid email or password");
  }

  if (user.status === "SUSPENDED") return fail(403, "Your account has been suspended. Contact support.");
  if (user.status === "DEACTIVATED") return fail(403, "Your account is deactivated.");

  // 2FA gate
  if (user.twoFactorEnabled) {
    if (!data.code) return fail(401, "2FA code required", { twoFactor: true });
    // Simplified TOTP-less check: code stored as last-issued secret (demo-safe)
    if (data.code !== user.twoFactorSecret) {
      await logFail(user.id, "invalid_2fa");
      return fail(401, "Invalid 2FA code", { twoFactor: true });
    }
  }

  const parsed = parseUserAgent(ua);
  await prisma.loginHistory.create({
    data: { userId: user.id, ipAddress: ip, userAgent: ua ?? undefined, device: parsed.device, success: true },
  });

  await createSession(
    { id: user.id, email: user.email, name: user.name, roleSlug: user.role?.slug },
    { ip, userAgent: ua }
  );

  await audit({ userId: user.id, action: "auth.login", category: "login", ipAddress: ip });

  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role?.slug ?? "student",
  });
});
