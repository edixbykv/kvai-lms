"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, Copy, Trash2, Lock, Save } from "lucide-react";
import { toast } from "sonner";

interface Perm { key: string; group: string; label: string }
interface Role { id: string; name: string; slug: string; description: string | null; isSystem: boolean; users: number; permissionKeys: string[] }

export function RoleManager({ permissions, roles }: { permissions: Perm[]; roles: Role[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(roles[0]?.id);
  const selected = roles.find((r) => r.id === selectedId);
  const [draft, setDraft] = useState<string[]>(selected?.permissionKeys ?? []);
  const [activeRole, setActiveRole] = useState(selectedId);
  const [saving, setSaving] = useState(false);

  // sync draft when role changes
  if (activeRole !== selectedId) {
    setActiveRole(selectedId);
    setDraft(selected?.permissionKeys ?? []);
  }

  const groups = Array.from(new Set(permissions.map((p) => p.group)));
  const isSuper = selected?.slug === "super-admin";

  function toggle(key: string) {
    setDraft((d) => d.includes(key) ? d.filter((k) => k !== key) : [...d, key]);
  }
  function toggleGroup(group: string, on: boolean) {
    const keys = permissions.filter((p) => p.group === group).map((p) => p.key);
    setDraft((d) => on ? Array.from(new Set([...d, ...keys])) : d.filter((k) => !keys.includes(k)));
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/admin/roles/${selected.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions: draft }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Permissions saved"); router.refresh(); }
    else { const d = await res.json(); toast.error(d.message || "Save failed"); }
  }

  async function clone(id: string) {
    const res = await fetch(`/api/admin/roles/${id}/clone`, { method: "POST" });
    if (res.ok) { toast.success("Role cloned"); router.refresh(); } else toast.error("Clone failed");
  }
  async function remove(id: string) {
    const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (res.ok) { toast.success("Role deleted"); router.refresh(); } else toast.error(d.message || "Delete failed");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Role list */}
      <div className="space-y-3">
        <CreateRoleDialog permissions={permissions} groups={groups} />
        <Card>
          <CardContent className="p-2">
            {roles.map((r) => (
              <button key={r.id} onClick={() => setSelectedId(r.id)}
                className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm", selectedId === r.id ? "bg-primary-soft" : "hover:bg-muted")}>
                <span>
                  <span className={cn("block font-medium", selectedId === r.id && "text-primary")}>{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.users} user(s)</span>
                </span>
                {r.isSystem && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Permission matrix */}
      {selected && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{selected.name}</h3>
                  {selected.isSystem && <Badge variant="outline">System</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => clone(selected.id)}><Copy className="h-4 w-4" /> Clone</Button>
                {!selected.isSystem && <Button variant="outline" size="sm" className="text-red-600" onClick={() => remove(selected.id)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </div>

            {isSuper ? (
              <div className="mt-4 rounded-lg bg-primary-soft p-4 text-sm text-primary">
                Super Admin has full, unrestricted access to all permissions. This role cannot be edited.
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-5">
                  {groups.map((group) => {
                    const keys = permissions.filter((p) => p.group === group);
                    const allOn = keys.every((p) => draft.includes(p.key));
                    return (
                      <div key={group}>
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-sm font-semibold">{group}</h4>
                          <button className="text-xs text-primary hover:underline" onClick={() => toggleGroup(group, !allOn)}>
                            {allOn ? "Clear all" : "Select all"}
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {keys.map((p) => (
                            <label key={p.key} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                              <Checkbox checked={draft.includes(p.key)} onCheckedChange={() => toggle(p.key)} />
                              {p.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button className="mt-6" onClick={save} disabled={saving}><Save className="h-4 w-4" /> Save permissions</Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CreateRoleDialog({ permissions, groups }: { permissions: Perm[]; groups: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/roles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: String(fd.get("name")), description: String(fd.get("description") || ""), permissions: picked }),
    });
    if (res.ok) { toast.success("Role created"); setOpen(false); setPicked([]); router.refresh(); }
    else toast.error("Create failed");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="w-full"><Plus className="h-4 w-4" /> New role</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Create custom role</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Role name</Label><Input id="name" name="name" required placeholder="e.g. Regional Manager" /></div>
          <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" name="description" /></div>
          <div className="max-h-64 space-y-4 overflow-y-auto pr-2">
            {groups.map((g) => (
              <div key={g}>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{g}</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {permissions.filter((p) => p.group === g).map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={picked.includes(p.key)} onCheckedChange={() => setPicked((s) => s.includes(p.key) ? s.filter((k) => k !== p.key) : [...s, p.key])} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter><Button type="submit">Create role</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
