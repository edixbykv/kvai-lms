import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { RoleManager } from "@/components/admin/role-manager";

export const metadata = { title: "Roles & Permissions" };
export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Roles & Permissions</h2>
        <p className="text-muted-foreground">Create custom roles and control exactly what each team member can do.</p>
      </div>
      <RoleManager
        permissions={PERMISSIONS}
        roles={roles.map((r) => ({
          id: r.id, name: r.name, slug: r.slug, description: r.description,
          isSystem: r.isSystem, users: r._count.users,
          permissionKeys: r.permissions.map((p) => p.permission.key),
        }))}
      />
    </div>
  );
}
