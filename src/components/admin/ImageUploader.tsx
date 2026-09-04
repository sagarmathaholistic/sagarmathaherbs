import { useCallback, useEffect, useRef, useState } from "react";
import { ImageUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BUCKET = "site-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && /^[a-z0-9]{2,5}$/i.test(fromName)) return fromName.toLowerCase();
  return file.type.split("/")[1] ?? "png";
}

/**
 * Drag-and-drop / click image uploader.
 * `value` is either an absolute URL or a storage path inside the site-images bucket.
 */
export function ImageUploader({
  value,
  onChange,
  folder,
  label = "Image",
  hint,
}: {
  value: string;
  onChange: (next: string) => void;
  folder: string;
  label?: string;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    if (!value) {
      setPreview(null);
      return;
    }
    if (/^https?:\/\//i.test(value) || value.startsWith("blob:")) {
      setPreview(value);
      return;
    }
    void supabase.storage
      .from(BUCKET)
      .createSignedUrl(value, 60 * 60)
      .then(({ data }) => {
        if (active) setPreview(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [value]);

  const upload = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error("Use a PNG, JPG, WEBP, GIF or SVG image.");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Image must be smaller than 5 MB.");
        return;
      }
      setUploading(true);
      const path = `${folder}/${crypto.randomUUID()}.${extensionFor(file)}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      setUploading(false);
      if (error) {
        toast.error(error.message || "Upload failed");
        return;
      }
      onChange(path);
      toast.success("Image uploaded");
    },
    [folder, onChange],
  );

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label.toLowerCase()}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt={`${label} preview`}
            className="max-h-32 w-auto rounded-md object-contain"
          />
        ) : uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : (
          <ImageUp className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
        <p className="text-xs text-muted-foreground">
          {uploading ? "Uploading…" : "Drag & drop an image here, or click to choose a file"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={value}
          maxLength={500}
          placeholder="…or paste an image URL"
          onChange={(e) => onChange(e.target.value)}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={() => onChange("")}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
