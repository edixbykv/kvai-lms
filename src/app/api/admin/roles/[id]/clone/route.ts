import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler, created, fail, permissionGuard } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { nanoid } from "nanoid";
import { audit } from "@/lib/audit";

export const POST = handler(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await permissionGuard("admin.roles");
  const { id } = await ctx.params;
  const source = await prisma.role.findUnique({ where: { id }, include: { permissions: true } });
  if (!source) return fail(404, "Role not found");

  const name = `${source.name} (Copy)`;
  const slug = `${slugify(source.name)}-copy-${nanoid(4)}`;
  const role = await prisma.role.create({
    data: {
      name, slug, description: source.description, isSystem: false,
      permissions: { create: source.permissions.map((p) => ({ permissionId: p.permissionId })) },
    },
  });
  await audit({ userId: admin.id, action: "role.clone", category: "role", entityId: role.id });
  return created(role);
});
