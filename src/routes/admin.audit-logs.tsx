/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  Clock,
  Search,
  AlertTriangle,
  Info,
  Shield,
  Filter,
  Activity,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Admin SwiftArc" }] }),
  component: AdminAuditLogsPage,
});

type Severity = "info" | "warning" | "critical";

import { adminListAuditLogs } from "@/lib/admin.functions";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

const severityBadge = (s: Severity) => {
  if (s === "critical") return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  if (s === "warning") return "bg-amber/10 text-amber";
  return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
};

const severityIcon = (s: Severity) => {
  if (s === "critical") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (s === "warning") return <Shield className="h-3.5 w-3.5" />;
  return <Info className="h-3.5 w-3.5" />;
};

function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");

  const listFn = useServerFn(adminListAuditLogs);
  const { data: AUDIT_LOGS = [], isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => listFn(),
  });

  const filtered = (AUDIT_LOGS as any[]).filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "All" || log.severity === severityFilter.toLowerCase();
    return matchSearch && matchSeverity;
  });

  const todayEvents = AUDIT_LOGS.length;
  const securityEvents = AUDIT_LOGS.filter(
    (l: any) => l.severity === "critical" || l.severity === "warning",
  ).length;
  const configChanges = AUDIT_LOGS.filter(
    (l: any) =>
      l.action.includes("Modified") || l.action.includes("Saved") || l.action.includes("Toggled"),
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">System Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable audit trail of system events, configuration changes, and administrative actions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Events Today</span>
            <Activity className="h-5 w-5 text-amber" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {todayEvents}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Total logged events</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Security Events</span>
            <Shield className="h-5 w-5 text-red-500" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {securityEvents}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Warnings and critical alerts</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Config Changes</span>
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {configChanges}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">System configuration modifications</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by event, actor, or log ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-10 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Info", "Warning", "Critical"].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${severityFilter === s ? "bg-navy-deep text-cream" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full min-w-[600px] text-sm text-left">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Log ID</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Action Event</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Target / Entity</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 font-medium text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No events matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-navy-deep dark:text-cream">
                        {log.id}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityBadge(log.severity as Severity)}`}
                        >
                          {severityIcon(log.severity as Severity)} {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-navy-deep dark:text-cream">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.actor}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.target}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {log.ip}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
