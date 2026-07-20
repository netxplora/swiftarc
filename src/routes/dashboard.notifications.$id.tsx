import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Package, Truck, AlertTriangle, Info, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { listNotifications, markNotificationRead } from "@/lib/api.functions";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/notifications/$id")({
  component: NotificationDetail,
});

function iconFor(category: string) {
  if (category === "pickup") return Package;
  if (category === "shipment") return Truck;
  if (category === "exception") return AlertTriangle;
  return Info;
}

function NotificationDetail() {
  const { id } = Route.useParams();
  const fetchNotifs = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationRead);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ 
    queryKey: ["notifications"], 
    queryFn: () => fetchNotifs() 
  });

  const notification = data?.find(n => n.id === id);

  const markMut = useMutation({
    mutationFn: () => markRead({ data: { id, read: true } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    if (notification && !notification.read && !markMut.isPending && !markMut.isSuccess) {
      markMut.mutate();
    }
  }, [notification]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Bell className="h-10 w-10 text-muted-foreground opacity-50 mb-4" />
        <h2 className="text-xl font-bold">Notification not found</h2>
        <p className="text-muted-foreground mb-6">This notification may have been deleted.</p>
        <Button asChild>
          <Link to="/dashboard/notifications">Return to all notifications</Link>
        </Button>
      </div>
    );
  }

  const Icon = iconFor(notification.category);
  const date = new Date(notification.created_at);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-4">
      <Link 
        to="/dashboard/notifications" 
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to notifications
      </Link>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-6 bg-secondary/30">
          <div className="flex items-start gap-4">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy-deep text-cream`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {notification.category}
                </span>
                {notification.read && (
                  <span className="inline-flex items-center text-[10px] uppercase font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Read
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {notification.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {date.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {notification.body}
          </p>

          <div className="mt-8 pt-6 border-t border-border flex gap-3">
            {notification.category === "shipment" || notification.category === "pickup" || notification.category === "exception" ? (
              <Button asChild className="bg-navy-deep text-cream hover:bg-navy">
                <Link to="/dashboard/shipments">View your shipments</Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link to="/dashboard/notifications">Return to inbox</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
