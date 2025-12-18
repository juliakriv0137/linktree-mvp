"use client";

import { useEffect, useState } from "react";
import type { SiteBlockRow as BlockRow } from "@/components/blocks/BlocksRenderer";
import { Button } from "@/components/dashboard/ui/Button";
import { DbFieldRow } from "@/components/dashboard/ui/DbFieldRow";
import { DbInput } from "@/components/dashboard/ui/DbInput";
import { DbSelect } from "@/components/dashboard/ui/DbSelect";

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

  useEffect(() => {
    const c = (block.content ?? {}) as ImageContent;
    setUrl(c.url ?? "");
    setAlt(c.alt ?? "");
    setShape(((c.shape as any) ?? "circle") as any);
  }, [block.id, block.content]);

  const normalizedUrl = normalizeUrl(url);
  const urlOk = isValidHttpUrl(normalizedUrl);
  const previewRadius =
    shape === "circle" ? "9999px" : shape === "rounded" ? "24px" : "0px";

  return (
    <div className="space-y-4">
      <div className="text-xs text-[rgb(var(--db-muted))]">Image block</div>

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
          disabled={saving || !urlOk}
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
