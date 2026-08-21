import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, User, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  category: string;
  action: string;
  previous_value: any;
  new_value: any;
  created_at: string;
}

export function AuditLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["settings-audit-logs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("settings_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as AuditLogEntry[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const categoryColors: Record<string, string> = {
    visual_assets: "border-primary/40 text-primary",
    design_system: "border-accent/40 text-accent",
    contact_info: "border-success/40 text-success",
    compliance_legal: "border-error/40 text-error",
    global_seo: "border-secondary/40 text-secondary dark:text-accent",
    platform_fees: "border-primary/40 text-primary",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" /> Audit Logs
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          View a history of all platform settings changes. Logs are captured automatically by database triggers.
        </p>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card shadow-[0_2px_4px_rgba(0,0,0,0.07)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-medium">No audit log entries yet</p>
            <p className="text-sm mt-1">
              Changes to platform settings will be recorded here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#D8DDE6] dark:divide-border">
            {logs.map((log) => (
              <div
                key={log.id}
                className="px-5 py-4 hover:bg-muted/60 dark:hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-[4px] bg-accent/10 grid place-items-center flex-shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] rounded-[4px] uppercase tracking-wider ${
                            categoryColors[log.category] || "border-border text-muted-foreground"
                          }`}
                        >
                          {log.category.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">
                          {log.action}
                        </span>
                      </div>
                      {log.previous_value && log.new_value && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <code className="bg-error/5 text-error px-1.5 py-0.5 rounded text-[11px] truncate max-w-[200px]">
                            {typeof log.previous_value === "object"
                              ? JSON.stringify(log.previous_value).slice(0, 60) + "…"
                              : String(log.previous_value)}
                          </code>
                          <ArrowRight className="h-3 w-3 flex-shrink-0" />
                          <code className="bg-success/5 text-success px-1.5 py-0.5 rounded text-[11px] truncate max-w-[200px]">
                            {typeof log.new_value === "object"
                              ? JSON.stringify(log.new_value).slice(0, 60) + "…"
                              : String(log.new_value)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
