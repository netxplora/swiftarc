import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminListUsers, adminSetRole, adminDeleteUser } from "@/lib/admin.functions";
import { Loader2, Shield, ShieldOff, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Admin — Users" }, { name: "robots", content: "noindex" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);
  const [search, setSearch] = useState("");
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });

  const roleMut = useMutation({
    mutationFn: (v: { userId: string; role: "admin"|"moderator"|"user"; grant: boolean }) =>
      setRole({ data: v }),
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: () => toast.error("Could not update role"),
  });

  const filtered = (q.data ?? []).filter((u) =>
    !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage account roles and access.</p>
        </div>
        <Input placeholder="Search by name or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Card><CardContent className="p-0">
        {q.isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-3">Name</th>
                  <th className="p-3">Roles</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isAdmin = u.roles.includes("admin");
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="p-3">
                        <p className="font-medium">{u.displayName || "—"}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{u.id}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 && <span className="text-xs text-muted-foreground">user</span>}
                          {u.roles.map((r) => (
                            <span key={r} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r === "admin" ? "bg-amber text-navy-deep" : "bg-secondary"}`}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant={isAdmin ? "outline" : "default"}
                            onClick={() => roleMut.mutate({ userId: u.id, role: "admin", grant: !isAdmin })}
                            disabled={roleMut.isPending}
                          >
                            {isAdmin ? <><ShieldOff className="mr-1 h-3 w-3" /> Revoke admin</> : <><Shield className="mr-1 h-3 w-3" /> Make admin</>}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            if (confirm("Delete user account entirely? This cannot be undone.")) {
                              const del = (await import("@/lib/admin.functions")).adminDeleteUser;
                              del({ data: { id: u.id } }).then(() => qc.invalidateQueries({ queryKey: ["admin-users"] }));
                            }
                          }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="p-10 text-center text-xs text-muted-foreground">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
