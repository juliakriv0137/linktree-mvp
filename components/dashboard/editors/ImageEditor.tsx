"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SiteBlockRow as BlockRow } from "@/components/blocks/BlocksRenderer";
import { Button } from "@/components/dashboard/ui/Button";
import { DbFieldRow } from "@/components/dashboard/ui/DbFieldRow";
import { DbInput } from "@/components/dashboard/ui/DbInput";
import { DbSelect } from "@/components/dashboard/ui/DbSelect";
import { supabase } from "@/lib/supabaseClient";

type ImageContent = {
  url?: string | null;
  alt?: string | null;
  shape?: "circle" | "rounded" | "square" | null;
};

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function normalizeUrl(raw: any) {
  const v = safeTrim(raw);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function isValidHttpUrl(raw: any) {
  const v = safeTrim(raw);
  if (!v) return false;
  if (!/^https?:\/\//i.test(v)) return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

function sanitizeFilename(name: string) {
  // keep it simple and safe for storage paths
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 120);
}

export function ImageEditor({
  block,
  onSave,
}: {
  block: BlockRow;
  onSave: (next: ImageContent) => Promise<void>;
}) {
  const initial = (block.content ?? {}) as ImageContent;

  const [url, setUrl] = useState<string>(initial.url ?? "");
  const [alt, setAlt] = useState<string>(initial.alt ?? "");
  const [shape, setShape] = useState<"circle" | "rounded" | "square">(
    (initial.shape as any) ?? "circle",
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string>("");

  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const c = (block.content ?? {}) as ImageContent;
    setUrl(c.url ?? "");
    setAlt(c.alt ?? "");
    setShape(((c.shape as any) ?? "circle") as any);
    setUploadErr("");
    setUploading(false);
    setSaving(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [block.id, block.content]);

  const normalizedUrl = useMemo(() => normalizeUrl(url), [url]);
  const urlOk = useMemo(() => isValidHttpUrl(normalizedUrl), [normalizedUrl]);

  const previewRadius =
    shape === "circle" ? "9999px" : shape === "rounded" ? "24px" : "0px";

  async function uploadToSupabase(file: File) {
    setUploadErr("");
    setUploading(true);

    try {

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const user = userRes?.user;
      if (!user?.id) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const safeName = sanitizeFilename(file.name || "image");
      const ext = safeName.includes(".") ? safeName.split(".").pop() : "";
      const ts = Date.now();
      const random = Math.random().toString(16).slice(2);
      const finalName =
        ext && safeName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
          ? safeName
          : ext
            ? `${safeName}.${ext}`
            : safeName;

      // IMPORTANT for your RLS: first path segment must equal auth.uid()
      const path = `${user.id}/${ts}-${random}-${finalName}`;

      const { error: upErr } = await supabase.storage
        .from("site-assets")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      const publicUrl = pub?.publicUrl;

      if (!publicUrl) {
        throw new Error("Could not get public URL for uploaded file.");
      }

      // Put into URL field so user sees it + preview updates
      setUrl(publicUrl);
      return publicUrl;
    } catch (e: any) {
      setUploadErr(e?.message ? String(e.message) : "Upload failed");
      return "";
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-[rgb(var(--db-muted))]">Image block</div>

      {/* Upload control */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // optional: simple size guard (10MB)
            if (file.size > 10 * 1024 * 1024) {
              setUploadErr("File is too large. Please use an image under 10MB.");
              if (fileRef.current) fileRef.current.value = "";
              return;
            }

            await uploadToSupabase(file);
          }}
        />

<Button
  disabled={uploading || saving}
  onClick={() => {
    fileRef.current?.click();
  }}
>
  {uploading ? "Uploading..." : "Upload image"}
</Button>


        {uploadErr ? (
          <div className="text-sm text-red-600">{uploadErr}</div>
        ) : (
          <div className="text-xs text-[rgb(var(--db-muted))]">
            Upload from your computer (stored in Supabase Storage)
          </div>
        )}
      </div>

      <DbFieldRow
        label="Image URL"
        error={
          !urlOk && safeTrim(url)
            ? "URL must be http(s). Example: https://images.unsplash.com/..."
            : undefined
        }
      >
        <DbInput
          value={url}
          onChange={(e) => setUrl((e.target as HTMLInputElement).value)}
          placeholder="https://..."
          className={!urlOk && safeTrim(url) ? "border-red-500/50" : ""}
        />
      </DbFieldRow>

      <DbFieldRow label="Alt text" hint="Describe the image (optional)">
        <DbInput
          value={alt}
          onChange={(e) => setAlt((e.target as HTMLInputElement).value)}
          placeholder="Describe the image"
        />
      </DbFieldRow>

      <DbFieldRow label="Shape">
        <DbSelect
          value={shape}
          onChange={(e) => setShape((e.target as HTMLSelectElement).value as any)}
        >
          <option value="circle">Circle</option>
          <option value="rounded">Rounded</option>
          <option value="square">Square</option>
        </DbSelect>
      </DbFieldRow>

      <div
        style={{
          background: "var(--card-bg)",
          border: "var(--card-border)",
          boxShadow: "var(--card-shadow)",
          padding: "var(--card-padding)",
          borderRadius: "var(--button-radius)",
        }}
        className="space-y-3"
      >
        <div className="text-xs text-[rgb(var(--db-muted))]">Preview</div>

        {urlOk ? (
          <div className="mx-auto w-full max-w-[360px] aspect-square overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizedUrl}
              alt={safeTrim(alt) || "Image preview"}
              className="h-full w-full object-cover"
              style={{ borderRadius: previewRadius }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-4 text-sm text-[rgb(var(--db-muted))]">
            Add a valid image URL to see preview.
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={saving || uploading || !urlOk}
          onClick={async () => {
            const normalized = normalizeUrl(url);
            if (!isValidHttpUrl(normalized)) return;

            setSaving(true);
            try {
              await onSave({
                url: normalized,
                alt: safeTrim(alt),
                shape,
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving..." : "Save image"}
        </Button>
      </div>
    </div>
  );
}
