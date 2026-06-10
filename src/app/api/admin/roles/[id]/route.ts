import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handler, ok, fail, parseBody, permissionGuard } from "@/lib/api";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

export const PATCH = handler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await permissionGuard("admin.roles");
  const { id } = await ctx.params;
  const data = await parseBody(req, patchSchema);

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return fail(404, "Role not found");
  if (role.slug === "super-admin") return fail(403, "The Super Admin role cannot be modified");

  if (data.permissions) {
    const perms = await prisma.permission.findMany({ where: { key: { in: data.permissions } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.rolePermission.createMany({ data: perms.map((p) => ({ roleId: id, permissionId: p.id })), skipDuplicates: true });
  }
  await prisma.role.update({
    where: { id },
    data: { name: data.name, description: data.description, isActive: data.isActive },
  });
  await audit({ userId: admin.id, action: "role.update", category: "role", entityId: id });
  return ok({ updated: true });
});

export const DELETE = handler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await permissionGuard("admin.roles");
  const { id } = await ctx.params;
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) return fail(404, "Role not found");
  if (role.isSystem) return fail(403, "System roles cannot be deleted");
  if (role._count.users > 0) return fail(400, "Reassign users before deleting this role");
  await prisma.role.delete({ where: { id } });
  await audit({ userId: admin.id, action: "role.delete", category: "role", entityId: id });
  return ok({ deleted: true });
});
