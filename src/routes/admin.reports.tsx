/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Download,
  Calendar,
  BarChart2,
  Eye,
  Clock,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListReports,
  adminGenerateReport,
  adminDeleteReport,
  adminGetReportData,
} from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports & Intelligence — Admin SwiftArc" }] }),
  component: AdminReportsPage,
});

type ReportStatus = "ready" | "processing" | "scheduled";

const statusBadge = (s: ReportStatus) => {
  if (s === "ready")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (s === "processing") return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
  return "bg-secondary text-muted-foreground";
};

const statusIcon = (s: ReportStatus) => {
  if (s === "ready") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (s === "processing") return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  return <Clock className="h-3.5 w-3.5" />;
};

const CATEGORIES = ["All", "Financial", "Operations", "Fleet", "Analytics"] as const;

const REPORT_TEMPLATES: Record<string, string> = {
  Financial: "Revenue & Settlement Report",
  Operations: "Shipment SLA & Performance Report",
  Fleet: "Fleet Utilisation & Fuel Report",
  Analytics: "Customer Acquisition & Retention Report",
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadCsvFromData(report: any) {
  const fileData = report.file_data;
  if (!fileData?.headers || !fileData?.rows) {
    toast.error("No data available for this report.");
    return;
  }
  const headers = fileData.headers as string[];
  const rows = fileData.rows as Record<string, any>[];
  const keys = Object.keys(rows[0] || {});

  const csvRows = [headers.join(",")];
  rows.forEach((row: any) => {
    csvRows.push(keys.map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`).join(","));
  });
  const csv = csvRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${report.name.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast.success("CSV exported successfully.");
}

function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("All");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCategory, setNewCategory] = useState<string>("Financial");
  const [newPeriod, setNewPeriod] = useState(() => {
    const d = new Date();
    return `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
  });

  const listReports = useServerFn(adminListReports);
  const generateReport = useServerFn(adminGenerateReport);
  const deleteReport = useServerFn(adminDeleteReport);
  const getReportData = useServerFn(adminGetReportData);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => listReports(),
  });

  const genMut = useMutation({
    mutationFn: (v: { name: string; category: string; period: string }) =>
      generateReport({ data: v as any }),
    onSuccess: () => {
      toast.success("Report generated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setShowNewModal(false);
    },
    onError: () => toast.error("Failed to generate report."),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteReport({ data: { id } }),
    onSuccess: () => {
      toast.success("Report deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: () => toast.error("Failed to delete report."),
  });

  const filtered =
    category === "All" ? reports : reports.filter((r: any) => r.category === category);

  const readyCount = reports.filter((r: any) => r.status === "ready").length;
  const processingCount = reports.filter((r: any) => r.status === "processing").length;
  const scheduledCount = reports.filter((r: any) => r.status === "scheduled").length;

  const handleDownload = async (reportId: string) => {
    try {
      const report = await getReportData({ data: { id: reportId } });
      downloadCsvFromData(report);
    } catch {
      toast.error("Could not fetch report data.");
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete report "${name}"? This cannot be undone.`)) {
      delMut.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate, download, and manage operational intelligence reports.
          </p>
        </div>
        <Button
          onClick={() => setShowNewModal(true)}
          className="bg-navy-deep text-cream hover:bg-navy gap-2"
        >
          <Plus className="h-4 w-4" /> Generate Report
        </Button>
      </div>

      {/* Generate Report Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowNewModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold text-navy-deep dark:text-cream mb-4">
              Generate New Report
            </h2>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Period</Label>
                <Input
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  placeholder="e.g. August 2026"
                />
              </div>
              <div className="grid gap-2">
                <Label>Report Name</Label>
                <Input
                  value={REPORT_TEMPLATES[newCategory] ?? ""}
                  disabled
                  className="text-muted-foreground"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </Button>
              <Button
                disabled={genMut.isPending}
                onClick={() =>
                  genMut.mutate({
                    name: REPORT_TEMPLATES[newCategory] ?? "Custom Report",
                    category: newCategory,
                    period: newPeriod,
                  })
                }
                className="bg-amber text-navy-deep hover:bg-amber/90 gap-2"
              >
                {genMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart2 className="h-4 w-4" />
                )}
                Generate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${category === cat ? "bg-navy-deep text-cream" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Ready Reports</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {readyCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Processing</span>
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {processingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Scheduled</span>
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {scheduledCount}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="overflow-x-auto w-full pb-4">
              <table className="w-full min-w-[600px] text-sm text-left">
                <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Period</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Generated</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
                        No reports found. Click "Generate Report" to create one.
                      </td>
                    </tr>
                  )}
                  {filtered.map((r: any) => (
                    <tr key={r.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.name}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.period}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(r.status)}`}
                        >
                          {statusIcon(r.status)} {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatBytes(r.size_bytes ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === "ready" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(r.id)}
                            >
                              <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(r.id, r.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
