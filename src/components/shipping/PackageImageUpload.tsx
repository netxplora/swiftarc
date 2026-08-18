import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { Camera, UploadCloud, X, RefreshCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PackageImageUploadProps {
  value?: string; // The storage path
  onChange: (path?: string) => void;
  className?: string;
}

export function PackageImageUpload({ value, onChange, className }: PackageImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    value ? supabase.storage.from("shipment-package-images").getPublicUrl(value).data.publicUrl : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image is too large. Please choose an image under 10 MB.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Compress image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // 2. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from("shipment-package-images")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // 3. Update state
      onChange(data.path);
      const publicUrl = supabase.storage.from("shipment-package-images").getPublicUrl(data.path).data.publicUrl;
      setPreviewUrl(publicUrl);
      toast.success("Package photo uploaded successfully.");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    // Note: We don't delete the file immediately from storage here just in case they cancel the shipment creation.
    // We just clear the reference in the form.
    onChange(undefined);
    setPreviewUrl(null);
  };

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-border shadow-sm group bg-secondary/10 flex flex-col items-center justify-center p-2">
          <img
            src={previewUrl}
            alt="Package Preview"
            className="w-full max-h-[300px] object-contain rounded-lg"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 px-4 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Replace
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-9 px-4 rounded-full"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center gap-4 text-center cursor-pointer ${
            isUploading ? "bg-secondary/30 border-primary/30" : "bg-card hover:bg-secondary/20 hover:border-primary/50"
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center text-primary">
              <Loader2 className="w-10 h-10 animate-spin mb-2" />
              <span className="text-sm font-medium">Optimizing & Uploading...</span>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-muted-foreground">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Add Package Photo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap to use camera or upload an image
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2">
                <UploadCloud className="w-4 h-4 mr-2" />
                Choose Image
              </Button>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        capture="environment" // Suggests mobile camera for photos
      />
    </div>
  );
}
