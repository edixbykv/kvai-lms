import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";
import { verifyToken, AUTH_COOKIE } from "./auth";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  status: string;
  roleSlug: string | null;
  roleName: string | null;
  permissions: string[];
  emailVerified: boolean;
}

/**
 * Resolve the currently authenticated user from the auth cookie.
 * Cached per-request. Returns null if not authenticated.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.sub) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!user || user.status === "SUSPENDED" || user.status === "DEACTIVATED") {
    return null;
  }

  const isSuperAdmin = user.role?.slug === "super-admin";
  const permissions = isSuperAdmin
    ? ["*"]
    : user.role?.permissions.map((rp) => rp.permission.key) ?? [];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    status: user.status,
    roleSlug: user.role?.slug ?? null,
    roleName: user.role?.name ?? null,
    permissions,
    emailVerified: !!user.emailVerified,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
