"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

type BlockRow = {
  id: string;
  content: any;
};

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
    // eslint-disable-next-line no-new
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

  const urlOk = isValidHttpUrl(normalizeUrl(url));
  const previewRadius = shape === "circle" ? "9999px" : shape === "rounded" ? "24px" : "0px";

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/50">Image block</div>

      <label className="block">
        <div className="text-sm text-white/80 mb-2">Image URL</div>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className={
            "w-full rounded-2xl border bg-black/30 px-4 py-3 text-white placeholder:text-white/30 " +
            "focus:outline-none focus:ring-2 focus:ring-white/20 " +
            (safeTrim(url) && !urlOk ? "border-red-500/50" : "border-white/10")
          }
        />
        {!urlOk && safeTrim(url) ? (
          <div className="text-xs text-red-300 mt-2">
            URL must be http(s). Example: https://images.unsplash.com/...
          </div>
        ) : null}
      </label>

      {/* ALT */}
      <Input
  label="Alt text"
  value={alt}
  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlt(e.target.value)}
  placeholder="Describe the image (optional)"
/>


      <label className="block">
        <div className="text-sm text-white/80 mb-2">Shape</div>
        <select
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          value={shape}
          onChange={(e) => setShape(e.target.value as any)}
        >
          <option value="circle">Circle</option>
          <option value="rounded">Rounded</option>
          <option value="square">Square</option>
        </select>
      </label>

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
        <div className="text-xs text-white/50">Preview</div>

        {urlOk ? (
          <div className="mx-auto w-full max-w-[360px] aspect-square overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizeUrl(url)}
              alt={safeTrim(alt) || "Image preview"}
              className="h-full w-full object-cover"
              style={{ borderRadius: previewRadius }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">
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
