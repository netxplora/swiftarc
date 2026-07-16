import { useMemo, useState } from "react";
import { Copy, Mail, QrCode, Link as LinkIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShareDialog({ trackingNumber }: { trackingNumber: string }) {
  const [open, setOpen] = useState(false);
  const url = useMemo(() => {
    if (typeof window === "undefined") return `/tracking/${trackingNumber}`;
    return `${window.location.origin}/tracking/${trackingNumber}`;
  }, [trackingNumber]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy — copy the field manually");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-1 h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share tracking</DialogTitle>
          <DialogDescription>Send a live-updating link to anyone.</DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <Input readOnly value={url} className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" />
          </div>
          <Button size="sm" onClick={copy}>
            <Copy className="mr-1 h-4 w-4" /> Copy
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="mx-auto rounded-lg border border-border bg-cream p-2">
            <img src={qrSrc} alt="QR code" width={180} height={180} />
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <QrCode className="h-3.5 w-3.5" /> Scan to open on mobile
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`mailto:?subject=Track%20SwiftArc%20shipment%20${trackingNumber}&body=Follow%20live%20progress%3A%20${encodeURIComponent(url)}`}>
                <Mail className="mr-1 h-4 w-4" /> Email link
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
