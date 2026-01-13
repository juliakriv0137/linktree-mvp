"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/dashboard/ui/Button";
import { DbFieldRow } from "@/components/dashboard/ui/DbFieldRow";
import { DbInput } from "@/components/dashboard/ui/DbInput";
import { DbTextarea } from "@/components/dashboard/ui/DbTextarea";
import { DbSelect } from "@/components/dashboard/ui/DbSelect";

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function getExtFromFile(file: File) {
  const byName = (file.name.split(".").pop() || "").toLowerCase();
  if (byName && byName.length <= 8) return byName;

  const mime = (file.type || "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
  return "bin";
}

function safeFileSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 60);
}

function makeId() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis as any;
  if (c.crypto?.randomUUID) return c.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function HeroEditor({
  block,
  onSave,
}: {
  block: any;
  onSave: (next: { content: any; variant: string }) => Promise<void>;
}) {
  const initial = (block.content ?? {}) as any;

  const [title, setTitle] = useState(initial.title ?? "");
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "");
  const [titleSize, setTitleSize] = useState(initial.title_size ?? "lg");
  const [subtitleSize, setSubtitleSize] = useState(initial.subtitle_size ?? "md");
  const [align, setAlign] = useState(initial.align ?? "center");
  const [verticalAlign, setVerticalAlign] = useState(initial.vertical_align ?? "center");

  const [variant, setVariant] = useState((block as any).variant ?? "default");

  const [imageSide, setImageSide] = useState<"left" | "right">(initial.image_side ?? "right");
  const [imageSize, setImageSize] = useState(initial.image_size ?? "md");
  const [imageRatio, setImageRatio] = useState(initial.image_ratio ?? "square");

  const [bgHeight, setBgHeight] = useState(initial.bg_height ?? "md");
  const [bgOverlay, setBgOverlay] = useState(initial.bg_overlay ?? "medium");
  const [bgRadius, setBgRadius] = useState(initial.bg_radius ?? "2xl");

  const [primaryBtnTitle, setPrimaryBtnTitle] = useState(initial.primary_button_title ?? "");
  const [primaryBtnUrl, setPrimaryBtnUrl] = useState(initial.primary_button_url ?? "");
  const [secondaryBtnTitle, setSecondaryBtnTitle] = useState(initial.secondary_button_title ?? "");
  const [secondaryBtnUrl, setSecondaryBtnUrl] = useState(initial.secondary_button_url ?? "");

  const [avatar, setAvatar] = useState(initial.avatar ?? "");
  const [saving, setSaving] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const c = (block.content ?? {}) as any;

    setTitle(c.title ?? "");
    setSubtitle(c.subtitle ?? "");
    setTitleSize(c.title_size ?? "lg");
    setSubtitleSize(c.subtitle_size ?? "md");
    setAlign(c.align ?? "center");
    setVerticalAlign(c.vertical_align ?? "center");

    setVariant((block as any).variant ?? "default");

    setImageSide(c.image_side ?? "right");
    setImageSize(c.image_size ?? "md");
    setImageRatio(c.image_ratio ?? "square");

    setBgHeight(c.bg_height ?? "md");
    setBgOverlay(c.bg_overlay ?? "medium");
    setBgRadius(c.bg_radius ?? "2xl");

    setPrimaryBtnTitle(c.primary_button_title ?? "");
    setPrimaryBtnUrl(c.primary_button_url ?? "");
    setSecondaryBtnTitle(c.secondary_button_title ?? "");
    setSecondaryBtnUrl(c.secondary_button_url ?? "");

    setAvatar(c.avatar ?? "");

    // reset upload UI per block switch
    setUploadError(null);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [block.id, block.content]);

  const titleClass = titleSize === "sm" ? "text-xl" : titleSize === "md" ? "text-2xl" : "text-3xl";
  const subtitleClass =
    subtitleSize === "sm" ? "text-sm" : subtitleSize === "lg" ? "text-lg" : "text-base";
  const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

  async function uploadHeroImage(file: File) {
    setUploadError(null);
    setUploading(true);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) throw new Error("Not authenticated");

      const ext = getExtFromFile(file);
      const base = safeFileSlug(file.name.replace(/\.[^/.]+$/, "")) || "image";
      const id = makeId();

      // IMPORTANT: policy expects first path segment to be auth.uid()
      const path = `${user.id}/hero/${block.id}/${Date.now()}-${id}-${base}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("site-assets")
        .upload(path, file, {
          upsert: true,
          contentType: file.type || undefined,
          cacheControl: "3600",
        });

      if (uploadErr) throw uploadErr;

      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      const publicUrl = pub?.publicUrl;

      if (!publicUrl) throw new Error("Failed to get public URL");

      setAvatar(publicUrl);
      return publicUrl;
    } catch (e: any) {
      const msg = safeTrim(e?.message) || "Upload failed";
      setUploadError(msg);
      throw e;
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const showImageControls = variant === "split" || variant === "background";

  return (
    <div className="space-y-4">
      <div className="text-xs text-[rgb(var(--db-muted))]">Hero block</div>

      <DbFieldRow label="Title">
        <DbInput value={title} onChange={(e) => setTitle(e.target.value)} />
      </DbFieldRow>

      <DbFieldRow label="Subtitle">
        <DbTextarea
          rows={3}
          value={subtitle}
          onChange={(e) => setSubtitle((e.target as HTMLTextAreaElement).value)}
        />
      </DbFieldRow>

      <DbFieldRow label="Variant">
        <DbSelect value={variant} onChange={(e) => setVariant(e.target.value)}>
          <option value="default">Default</option>
          <option value="split">Split (text + image)</option>
          <option value="background">Background image</option>
        </DbSelect>
      </DbFieldRow>

      {variant === "background" && (
        <DbFieldRow label="Section height">
          <DbSelect value={bgHeight} onChange={(e) => setBgHeight(e.target.value as any)}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">X-Large</option>
          </DbSelect>
        </DbFieldRow>
      )}

      {variant === "background" && (
        <DbFieldRow label="Corner radius">
          <DbSelect value={bgRadius} onChange={(e) => setBgRadius(e.target.value as any)}>
            <option value="none">None</option>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">X-Large</option>
            <option value="2xl">2X-Large</option>
            <option value="full">Full</option>
          </DbSelect>
        </DbFieldRow>
      )}

      {showImageControls && (
        <div className="space-y-2">
          <DbFieldRow label={variant === "background" ? "Background image URL" : "Avatar / Image URL"}>
            <DbInput value={avatar} onChange={(e) => setAvatar(e.target.value)} />
          </DbFieldRow>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await uploadHeroImage(file);
                } catch {
                  // error already set in state
                }
              }}
            />

            <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? "Uploading..." : "Upload image"}
            </Button>

            {!!safeTrim(avatar) && (
              <Button
                disabled={uploading}
                onClick={() => {
                  setAvatar("");
                  setUploadError(null);
                }}
              >
                Clear
              </Button>
            )}

            {uploadError && (
              <div className="text-xs text-red-500" style={{ overflowWrap: "anywhere" }}>
                {uploadError}
              </div>
            )}
          </div>

          {!!safeTrim(avatar) && (
            <div
              style={{
                background: "var(--card-bg)",
                border: "var(--card-border)",
                boxShadow: "var(--card-shadow)",
                padding: "var(--card-padding)",
                borderRadius: "var(--button-radius)",
              }}
              className="space-y-2"
            >
              <div className="text-xs text-[rgb(var(--db-muted))]">Image preview</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={safeTrim(avatar)}
                alt=""
                className="w-full h-auto rounded-2xl"
                style={{ border: "1px solid rgb(var(--db-border))" }}
              />
            </div>
          )}
        </div>
      )}

      {variant === "background" && (
        <DbFieldRow label="Overlay">
          <DbSelect value={bgOverlay} onChange={(e) => setBgOverlay(e.target.value as any)}>
            <option value="soft">Soft</option>
            <option value="medium">Medium</option>
            <option value="strong">Strong</option>
          </DbSelect>
        </DbFieldRow>
      )}

      {variant === "split" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DbFieldRow label="Image side">
            <DbSelect value={imageSide} onChange={(e) => setImageSide(e.target.value as any)}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </DbSelect>
          </DbFieldRow>

          <DbFieldRow label="Image size">
            <DbSelect value={imageSize} onChange={(e) => setImageSize(e.target.value as any)}>
              <option value="xs">X-Small</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">X-Large</option>
              <option value="2xl">2X-Large</option>
            </DbSelect>
          </DbFieldRow>

          <DbFieldRow label="Image ratio">
            <DbSelect value={imageRatio} onChange={(e) => setImageRatio(e.target.value as any)}>
              <option value="square">Square (1:1)</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="3:4">3:4</option>
              <option value="9:16">9:16</option>
              <option value="auto">Auto</option>
            </DbSelect>
          </DbFieldRow>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DbFieldRow label="Title size">
          <DbSelect value={titleSize} onChange={(e) => setTitleSize(e.target.value as any)}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </DbSelect>
        </DbFieldRow>

        <DbFieldRow label="Subtitle size">
          <DbSelect value={subtitleSize} onChange={(e) => setSubtitleSize(e.target.value as any)}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </DbSelect>
        </DbFieldRow>

        <DbFieldRow label="Align">
          <DbSelect value={align} onChange={(e) => setAlign(e.target.value as any)}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </DbSelect>
        </DbFieldRow>

        {variant === "background" && (
          <DbFieldRow label="Vertical align">
            <DbSelect value={verticalAlign} onChange={(e) => setVerticalAlign(e.target.value as any)}>
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </DbSelect>
          </DbFieldRow>
        )}
      </div>

      <div
        style={{
          background: "var(--card-bg)",
          border: "var(--card-border)",
          boxShadow: "var(--card-shadow)",
          padding: "var(--card-padding)",
          borderRadius: "var(--button-radius)",
        }}
        className="space-y-2 min-w-0"
      >
        <div className="text-xs text-[rgb(var(--db-muted))]">Preview</div>
        <div className={`space-y-1 ${alignClass}`} style={{ overflowWrap: "anywhere" }}>
          <div className={`${titleClass} font-bold`}>{safeTrim(title) || "Your title…"}</div>
          <div className={`${subtitleClass} text-[rgb(var(--db-muted))]`}>
            {safeTrim(subtitle) || "Your subtitle…"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={saving || !safeTrim(title)}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                content: {
                  title: safeTrim(title),
                  subtitle: safeTrim(subtitle),
                  avatar: safeTrim(avatar) || null,
                  title_size: titleSize,
                  subtitle_size: subtitleSize,
                  align,
                  vertical_align: verticalAlign,
                  image_side: imageSide,
                  image_size: imageSize,
                  image_ratio: imageRatio,
                  bg_height: bgHeight,
                  bg_overlay: bgOverlay,
                  bg_radius: bgRadius,
                  primary_button_title: safeTrim(primaryBtnTitle),
                  primary_button_url: safeTrim(primaryBtnUrl),
                  secondary_button_title: safeTrim(secondaryBtnTitle),
                  secondary_button_url: safeTrim(secondaryBtnUrl),
                },
                variant,
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
