import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./prisma";
import { signToken, AUTH_COOKIE } from "./auth";
import { parseUserAgent } from "./useragent";

const SESSION_DAYS = 7;

interface SessionUser {
  id: string;
  email: string;
  name: string;
  roleSlug?: string | null;
}

/**
 * Create a JWT, persist a Session row (for device tracking) and set the cookie.
 */
export async function createSession(
  user: SessionUser,
  meta: { ip?: string; userAgent?: string | null }
) {
  const token = await signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.roleSlug ?? null,
  });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const ua = parseUserAgent(meta.userAgent ?? null);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      ipAddress: meta.ip,
      userAgent: meta.userAgent ?? undefined,
      device: ua.device,
      browser: ua.browser,
      os: ua.os,
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return token;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.session.updateMany({ where: { tokenHash }, data: { revoked: true } }).catch(() => {});
  }
  cookieStore.delete(AUTH_COOKIE);
}
