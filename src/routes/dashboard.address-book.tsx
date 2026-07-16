import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Star, Building2, Trash2, Pencil, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { listAddresses, upsertAddress, deleteAddress, setDefaultAddress } from "@/lib/api.functions";

export const Route = createFileRoute("/dashboard/address-book")({
  component: AddressBook,
});

type AddressRow = {
  id: string; label: string; contact_name: string; company: string | null;
  phone: string | null; email: string | null;
  line1: string; line2: string | null; city: string; region: string | null;
  postal_code: string; country_code: string;
  is_default_sender: boolean; is_default_recipient: boolean;
};

type FormState = Partial<AddressRow> & { label: string; contact_name: string; line1: string; city: string; postal_code: string; country_code: string };

const empty: FormState = { label: "", contact_name: "", line1: "", city: "", postal_code: "", country_code: "US" };

function AddressBook() {
  const fetchAll = useServerFn(listAddresses);
  const doUpsert = useServerFn(upsertAddress);
  const doDelete = useServerFn(deleteAddress);
  const doDefault = useServerFn(setDefaultAddress);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["addresses"], queryFn: () => fetchAll() });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const list = (data ?? []).filter((a) =>
    !q ? true : `${a.label} ${a.contact_name} ${a.company ?? ""} ${a.city} ${a.country_code}`.toLowerCase().includes(q.toLowerCase()),
  );

  const save = useMutation({
    mutationFn: (payload: FormState) => doUpsert({ data: payload as any }),
    onSuccess: () => { toast.success("Address saved"); qc.invalidateQueries({ queryKey: ["addresses"] }); setOpen(false); setForm(empty); },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => doDelete({ data: { id } }),
    onSuccess: () => { toast.success("Address removed"); qc.invalidateQueries({ queryKey: ["addresses"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });
  const setDef = useMutation({
    mutationFn: (v: { id: string; role: "sender" | "recipient" }) => doDefault({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });

  const edit = (a: AddressRow) => { setForm(a as FormState); setOpen(true); };
  const add = () => { setForm(empty); setOpen(true); };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Address book</h1>
          <p className="text-sm text-muted-foreground">Saved senders & recipients — quick-fill on new shipments.</p>
        </div>
        <Button className="bg-navy-deep text-cream hover:bg-navy" onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> Add address
        </Button>
      </header>

      <Input placeholder="Search saved addresses" value={q} onChange={(e) => setQ(e.target.value)} />

      {isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-lg">No saved addresses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a sender or recipient to speed up bookings.</p>
          <Button onClick={add} className="mt-4 bg-navy-deep text-cream hover:bg-navy"><Plus className="mr-1 h-4 w-4" /> Add first address</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-navy-deep">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1">
                  <button aria-label="Default sender" title="Default sender" onClick={() => setDef.mutate({ id: a.id, role: "sender" })} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary">
                    <Star className={`h-4 w-4 ${a.is_default_sender ? "fill-amber text-amber" : "text-muted-foreground"}`} />
                  </button>
                  <button aria-label="Edit" onClick={() => edit(a)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button aria-label="Delete" onClick={() => confirm("Delete this address?") && remove.mutate(a.id)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <p className="font-semibold">{a.label}</p>
                <p className="text-sm">{a.contact_name}{a.company ? ` · ${a.company}` : ""}</p>
                <p className="mt-2 text-sm text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                <p className="text-sm text-muted-foreground">{a.city}{a.region ? `, ${a.region}` : ""}, {a.postal_code} · {a.country_code}</p>
                {(a.is_default_sender || a.is_default_recipient) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.is_default_sender && <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-deep">Default sender</span>}
                    {a.is_default_recipient && <span className="rounded-full bg-navy-deep/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-deep">Default recipient</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">{form.id ? "Edit address" : "Add address"}</h2>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="grid gap-3 sm:grid-cols-2">
              <F label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} required />
              <F label="Contact name" value={form.contact_name} onChange={(v) => setForm({ ...form, contact_name: v })} required />
              <F label="Company" value={form.company ?? ""} onChange={(v) => setForm({ ...form, company: v })} />
              <F label="Phone" value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} />
              <F label="Email" value={form.email ?? ""} onChange={(v) => setForm({ ...form, email: v })} type="email" wide />
              <F label="Address line 1" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} required wide />
              <F label="Address line 2" value={form.line2 ?? ""} onChange={(v) => setForm({ ...form, line2: v })} wide />
              <F label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
              <F label="Region / state" value={form.region ?? ""} onChange={(v) => setForm({ ...form, region: v })} />
              <F label="Postal code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} required />
              <F label="Country (ISO-2)" value={form.country_code} onChange={(v) => setForm({ ...form, country_code: v.toUpperCase().slice(0,2) })} required />
              <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={save.isPending} className="bg-navy-deep text-cream hover:bg-navy">
                  {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, value, onChange, required, type = "text", wide }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} required={required} type={type} className="mt-1.5" />
    </div>
  );
}
