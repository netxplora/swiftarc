import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminListUsers, adminSetRole, adminDeleteUser } from "@/lib/admin.functions";
import { Loader2, Shield, ShieldOff, Trash2, Users, Search, Download } from "lucide-react";

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
    !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const adminCount = (q.data ?? []).filter(u => u.roles.includes("admin")).length;
  const totalCount = q.data?.length ?? 0;

  const exportCsv = () => {
    const rows = [["Name", "Email", "Roles", "Joined"]].concat(
      (q.data ?? []).map((u) => [
        u.displayName || "—",
        u.email || "—",
        u.roles.join(", ") || "user",
        new Date(u.createdAt).toLocaleDateString(),
      ])
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `users-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(a.href);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage account roles and access. <span className="font-medium text-navy-deep">{totalCount}</span> total · <span className="font-medium text-amber">{adminCount}</span> admin{adminCount !== 1 ? "s" : ""}.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, email, or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 max-w-xs" />
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      <Card><CardContent className="p-0">
        {q.isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isAdmin = u.roles.includes("admin");
                  const roleColors: Record<string, string> = {
                    admin: "bg-amber/15 text-amber-deep border-amber/30",
                    moderator: "bg-violet-500/15 text-violet-700 border-violet-300",
                    business: "bg-sky-500/15 text-sky-700 border-sky-300",
                    courier: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
                  };
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-navy-deep/10 text-navy-deep text-xs font-bold shrink-0">
                            {(u.displayName || "U").slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-navy-deep">{u.displayName || "—"}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{u.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{u.email || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 && <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">user</span>}
                          {u.roles.map((r) => (
                            <span key={r} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleColors[r] ?? "bg-secondary border-border"}`}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
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
