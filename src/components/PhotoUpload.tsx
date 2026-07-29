import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/sonner";
import { PhotoImg } from "./PhotoImg";

type Props = {
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
  folder?: string; // e.g. "items", "requests", "avatars", "bookings"
  className?: string;
  crop?: boolean;
  cropTitle?: string;
  compact?: boolean;
  dense?: boolean;
  accept?: "image" | "video" | "media";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image"));
    img.src = src;
  });
}

async function uploadWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export function PhotoUpload({
  value,
  onChange,
  label = "Add photo",
  folder = "misc",
  className,
  crop = false,
  cropTitle = "Crop and save",
  compact = false,
  dense = false,
  accept = "image",
}: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  const isVideoPath = value ? /\.(mp4|mov|webm|m4v)$/i.test(value) : false;
  const inputAccept = accept === "video" ? "video/*" : accept === "media" ? "image/*,video/*" : "image/*";
  const isVideoUpload = accept === "video" || isVideoPath;
  const maxVideoBytes = 250 * 1024 * 1024;
  const maxImageBytes = 20 * 1024 * 1024;
  const uploadHint = accept === "video"
    ? "MP4, MOV, or WebM - up to 250 MB"
    : accept === "media"
      ? "Images or videos - up to 250 MB"
      : "PNG, JPG, or WebP - up to 20 MB";
  const uploaderTitle = crop
    ? "Add a polished profile photo"
    : label;
  const readyTitle = crop
    ? "Profile photo ready"
    : isVideoUpload
      ? "Video ready"
      : "Image ready";

  async function uploadFile(file: File) {
    if (!user) return;
    const maxBytes = (accept === "video" || accept === "media") ? maxVideoBytes : maxImageBytes;
    if (file.size > maxBytes) {
      toast.error((accept === "video" || accept === "media") ? "File must be under 250 MB" : "Photo must be under 20 MB");
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (accept === "image" && !isImage) {
      toast.error("Please pick an image file");
      return;
    }
    if (accept === "video" && !isVideo) {
      toast.error("Please pick a video file");
      return;
    }
    if (accept === "media" && !isImage && !isVideo) {
      toast.error("Please pick an image or video file");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.uid}/${folder}/${crypto.randomUUID()}.${ext}`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);
    formData.append("upsert", "false");

    try {
      const token = await (await import("@/lib/firebase")).getFirebaseIdToken();
      const uploadUrl = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/storage/photos/upload`;
      let response: Response;
      try {
        response = await uploadWithTimeout(uploadUrl, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          body: formData,
        }, 360000);
      } catch (firstError: any) {
        if (firstError?.name !== "AbortError") throw firstError;
        // Retry once on timeout because mobile networks can be temporarily slow.
        response = await uploadWithTimeout(uploadUrl, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          body: formData,
        }, 360000);
      }
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || "Upload failed");
      onChange(path);
      toast.success(crop ? "Profile photo updated" : (isVideo ? "Video uploaded" : "Photo uploaded"));
    } catch (error: any) {
      if (error?.name === "AbortError") {
        toast.error("Upload timed out. Please retry on a stable network or use a smaller file.");
        return;
      }
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
      setCropOpen(false);
      setSourceUrl(null);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setDragging(false);
      dragStartRef.current = null;
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (crop && accept === "image") {
      const dataUrl = await readFileAsDataUrl(file);
      setSourceUrl(dataUrl);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setCropOpen(true);
      return;
    }

    await uploadFile(file);
  }

  async function applyCrop() {
    if (!sourceUrl) return;

    try {
      const image = await loadImage(sourceUrl);
      const canvas = document.createElement("canvas");
      const size = 1080;
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to prepare the crop canvas");

      const previewSize = 460;
      const cropSize = Math.min(image.width, image.height);
      const zoomedCrop = cropSize * zoom;
      const sourceX = clamp((image.width - zoomedCrop) / 2 + (offsetX * image.width) / previewSize, 0, Math.max(0, image.width - zoomedCrop));
      const sourceY = clamp((image.height - zoomedCrop) / 2 + (offsetY * image.height) / previewSize, 0, Math.max(0, image.height - zoomedCrop));

      context.drawImage(image, sourceX, sourceY, zoomedCrop, zoomedCrop, 0, 0, size, size);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Could not create the cropped image"));
        }, "image/jpeg", 0.92);
      });

      const croppedFile = new File([blob], `${user?.uid || "avatar"}-${Date.now()}.jpg`, { type: "image/jpeg" });
      await uploadFile(croppedFile);
    } catch (error: any) {
      toast.error(error.message || "Unable to crop photo");
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragStartRef.current = { x: event.clientX, y: event.clientY, offsetX, offsetY };
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !dragStartRef.current) return;
    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    setOffsetX(dragStartRef.current.offsetX + deltaX);
    setOffsetY(dragStartRef.current.offsetY + deltaY);
  }

  function handlePointerUp() {
    setDragging(false);
    dragStartRef.current = null;
  }

  async function remove() {
    if (value && user && value.startsWith(user.uid + "/")) {
      try {
        const token = await (await import("@/lib/firebase")).getFirebaseIdToken();
        await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/storage/photos/remove`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ paths: [value] }),
        });
      } catch {
        // best effort
      }
    }
    onChange(null);
  }

  return (
    <div className={className}>
      {value ? (
        dense ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 p-2 shadow-sm">
            <div className="rounded-lg border border-border bg-muted/50 p-1">
              {isVideoPath ? (
                <div className="grid size-11 place-items-center rounded-md bg-black/70 text-[10px] font-semibold text-white">VIDEO</div>
              ) : (
                <PhotoImg path={value} className="size-11 rounded-md object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{readyTitle}</p>
              <p className="truncate text-[11px] text-muted-foreground">{isVideoUpload ? "360 media attached" : "Image attached"}</p>
            </div>
            <label className="inline-flex cursor-pointer items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold hover:bg-muted">
              Replace
              <input type="file" accept={inputAccept} capture={accept === "video" ? undefined : "environment"} onChange={handleFile} className="hidden" />
            </label>
            <button type="button" onClick={remove} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold hover:bg-muted">
              Remove
            </button>
          </div>
        ) : compact ? (
          <div className="flex flex-col items-center gap-3 rounded-[24px] border border-border/80 bg-background/80 p-4 shadow-sm">
            <div className="relative">
              <div className="rounded-full border border-border bg-muted/50 p-1.5">
                {isVideoPath ? (
                  <div className="grid size-24 place-items-center rounded-full bg-black/70 text-xs font-semibold text-white">VIDEO</div>
                ) : (
                  <PhotoImg path={value} className="size-24 rounded-full object-cover" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-foreground text-lg text-background shadow-lg">
                +
                <input type="file" accept={inputAccept} capture={accept === "video" ? undefined : "environment"} onChange={handleFile} className="hidden" />
              </label>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">{readyTitle}</p>
              <p className="text-xs text-muted-foreground">Use the edit button to replace this file</p>
            </div>
            <button type="button" onClick={remove} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted">
              {isVideoUpload ? "Remove video" : "Remove photo"}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-background/80 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border bg-muted/50 p-2">
                {isVideoPath ? (
                  <div className="grid size-20 place-items-center rounded-xl bg-black/70 text-xs font-semibold text-white">VIDEO</div>
                ) : (
                  <PhotoImg path={value} className="size-20 rounded-xl object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{readyTitle}</p>
                <p className="text-xs text-muted-foreground">{isVideoUpload ? "Ready to publish in listing view." : "Use a clear image to improve trust and response rate."}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                    <span className="text-sm">+</span>
                    {isVideoPath ? "Replace video" : "Replace photo"}
                    <input type="file" accept={inputAccept} capture={accept === "video" ? undefined : "environment"} onChange={handleFile} className="hidden" />
                  </label>
                  <button type="button" onClick={remove} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      ) : dense ? (
        <label className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2 transition hover:border-leaf hover:bg-leaf/5">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">{uploaderTitle}</p>
            <p className="truncate text-[11px] text-muted-foreground">{uploadHint}</p>
          </div>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium">
            {accept === "video" ? "Choose video" : accept === "media" ? "Choose file" : "Choose image"}
          </span>
          <input type="file" accept={inputAccept} capture={accept === "video" ? undefined : "environment"} onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      ) : (
        <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-border bg-gradient-to-br from-muted/60 to-background px-5 py-8 text-center transition hover:border-leaf hover:bg-leaf/5">
          <div className="rounded-full bg-leaf/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-leaf">Upload</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{uploaderTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {uploadHint}
            </p>
          </div>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
            {accept === "video" ? "Choose video" : accept === "media" ? "Choose file" : "Choose image"}
          </span>
          <input type="file" accept={inputAccept} capture={accept === "video" ? undefined : "environment"} onChange={handleFile} className="hidden" disabled={uploading} />
        </label>
      )}

      {cropOpen && sourceUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-border bg-card p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{cropTitle}</p>
                <p className="text-sm text-muted-foreground">Drag the photo to frame your face, then save a polished square avatar.</p>
              </div>
              <button type="button" onClick={() => setCropOpen(false)} className="rounded-full border border-border px-3 py-1 text-sm">
                Close
              </button>
            </div>

            <div className="mt-4 rounded-[24px] border border-border bg-background p-3">
              <div
                className="mx-auto flex aspect-square max-w-[460px] cursor-grab items-center justify-center overflow-hidden rounded-[24px] bg-slate-950"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <img
                  src={sourceUrl}
                  alt="Crop preview"
                  className="h-full w-full object-cover"
                  style={{ transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)` }}
                />
                <div className="pointer-events-none absolute inset-0 bg-black/30" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border-[3px] border-white/95 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 p-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setZoom((value) => clamp(value - 0.1, 1, 2.8))} className="rounded-full border border-border px-3 py-1 text-sm">−</button>
                <span className="min-w-16 text-center text-sm font-medium">{zoom.toFixed(1)}x</span>
                <button type="button" onClick={() => setZoom((value) => clamp(value + 0.1, 1, 2.8))} className="rounded-full border border-border px-3 py-1 text-sm">+</button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); }} className="rounded-full border border-border px-3 py-1 text-sm">Reset view</button>
                <button type="button" onClick={applyCrop} disabled={uploading} className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-leaf-foreground disabled:opacity-60">
                  {uploading ? "Saving…" : "Save profile photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
