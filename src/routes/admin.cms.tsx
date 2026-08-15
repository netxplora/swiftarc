/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  Eye,
  Search,
  Globe,
  CheckCircle2,
  PenLine,
  EyeOff,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListCmsPages, adminDeleteCmsPage, adminUpsertCmsPage } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/cms")({
  head: () => ({ meta: [{ title: "CMS Management — Admin SwiftArc" }] }),
  component: AdminCMSPage,
});

type CMSPageForm = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  author: string;
};

const BLANK_PAGE: CMSPageForm = {
  title: "",
  slug: "/",
  content: "",
  status: "Draft",
  author: "Admin",
};

function CMSPageDialog({
  open,
  onClose,
  initial,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  initial?: any;
  onSuccess: () => void;
}) {
  const upsert = useServerFn(adminUpsertCmsPage);
  const [form, setForm] = useState<CMSPageForm>(
    initial
      ? {
          id: initial.id,
          title: initial.title,
          slug: initial.slug,
          content: initial.content,
          status: initial.status,
          author: initial.author || "Admin",
        }
      : BLANK_PAGE,
  );

  const mut = useMutation({
    mutationFn: () => upsert({ data: form as any }),
    onSuccess: () => {
      toast.success(initial ? "Page updated" : "Page created");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message || "Failed to save page"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Page" : "Add Page"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Terms of Service"
              />
            </div>
            <div className="grid gap-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. /terms"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {["Draft", "Published", "Archived"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Author</Label>
              <Input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Content (Markdown or HTML)</Label>
            <Textarea
              className="min-h-[200px]"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-navy-deep text-cream hover:bg-navy"
            disabled={!form.title || !form.slug || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const statusBadge = (s: string) => {
  if (s === "Published")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (s === "Draft") return "bg-amber/10 text-amber";
  return "bg-secondary text-muted-foreground";
};

function AdminCMSPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["admin_cms_pages"],
    queryFn: () => adminListCmsPages(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteCmsPage({ data: { id } }),
    onSuccess: () => {
      toast.success("Page deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_cms_pages"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete page");
    },
  });

  const filtered = pages.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const published = pages.filter((p) => p.status === "Published").length;
  const drafts = pages.filter((p) => p.status === "Draft").length;
  const totalViews = pages.reduce((sum, p) => sum + (p.views || 0), 0);

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete ${title}?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage marketing pages, legal terms, announcements, and site content.
          </p>
        </div>
        <Button
          className="bg-navy-deep text-cream hover:bg-navy font-medium"
          onClick={() => {
            setEditingPage(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Page
        </Button>
      </div>

      {dialogOpen && (
        <CMSPageDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          initial={editingPage}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin_cms_pages"] })}
        />
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Published Pages</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : published}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Drafts</span>
            <PenLine className="h-5 w-5 text-amber" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : drafts}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">
              Total Page Views
            </span>
            <Globe className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalViews.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search pages by title or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-10 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Published", "Draft", "Archived"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-navy-deep text-cream" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Page Title</th>
                <th className="px-4 py-3 font-medium">URL Route</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading pages...
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No pages found matching your search.
                  </td>
                </tr>
              )}
              {!isLoading &&
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Last updated: {new Date(p.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.author}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(p.views || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(p.status)}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5"
                          onClick={() => {
                            setEditingPage(p);
                            setDialogOpen(true);
                          }}
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5"
                          onClick={() => toast.info(`Previewing ${p.slug}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {p.status === "Published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-amber hover:text-amber"
                            onClick={() => {
                              const mut = adminUpsertCmsPage({
                                data: { ...p, status: "Draft" },
                              }).then(() => {
                                toast.success("Page unpublished");
                                queryClient.invalidateQueries({ queryKey: ["admin_cms_pages"] });
                              });
                            }}
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(p.id, p.title)}
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
    </div>
  );
}
