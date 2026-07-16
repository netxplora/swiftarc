import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { adminOverview } from "@/lib/admin.functions";
import { Users, Package2, Truck, Receipt, MessageSquare, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin overview — SwiftArc" }, { name: "robots", content: "noindex" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const fn = useServerFn(adminOverview);
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });

  if (q.isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-muted-foreground" />;

  const stats = [
    { label: "Users", value: q.data?.counts.users ?? 0, Icon: Users },
    { label: "Shipments", value: q.data?.counts.shipments ?? 0, Icon: Package2 },
    { label: "Pickups", value: q.data?.counts.pickups ?? 0, Icon: Truck },
    { label: "Invoices", value: q.data?.counts.invoices ?? 0, Icon: Receipt },
    { label: "Open chats", value: q.data?.counts.openChats ?? 0, Icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">System-wide activity across the SwiftArc network.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <s.Icon className="h-5 w-5 text-amber" />
              <p className="mt-3 font-display text-3xl">{s.value.toLocaleString()}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-display text-lg">Recent shipments</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr><th className="pb-2">Tracking</th><th className="pb-2">Service</th><th className="pb-2">Status</th><th className="pb-2">Created</th></tr>
              </thead>
              <tbody>
                {(q.data?.recentShipments ?? []).map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 font-mono text-xs">{r.tracking_number}</td>
                    <td className="py-2">{r.service}</td>
                    <td className="py-2"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{r.status}</span></td>
                    <td className="py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(q.data?.recentShipments ?? []).length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">No shipments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
