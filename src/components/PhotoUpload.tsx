import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PhotoImg } from "./PhotoImg";

type Props = {
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
  folder?: string; // e.g. "items", "requests", "avatars", "bookings"
  className?: string;
};

export function PhotoUpload({ value, onChange, label = "Add photo", folder = "misc", className }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo must be under 8 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChange(path);
    toast.success("Photo uploaded");
  }

  async function remove() {
    if (value && user && value.startsWith(user.id + "/")) {
      await supabase.storage.from("photos").remove([value]);
    }
    onChange(null);
  }

  return (
    <div className={className}>
      {value ? (
        <div className="flex items-start gap-3">
          <PhotoImg path={value} className="size-24 rounded-xl object-cover ring-1 ring-border" />
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
              Replace
              <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            </label>
            <button type="button" onClick={remove} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-4 py-6 text-sm font-medium text-muted-foreground hover:bg-muted">
          {uploading ? "Uploading…" : `📷 ${label}`}
          <input type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      )}
    </div>
  );
}
