"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SiteBlockRow as BlockRow } from "@/components/blocks/BlocksRenderer";
import { Button } from "@/components/dashboard/ui/Button";
import { supabase } from "@/lib/supabaseClient";

type HeaderLink = { label?: string | null; url?: string | null };

export type HeaderContent = {
  brand_text?: string | null;
  brand_url?: string | null;
  logo_url?: string | null;

  links?: HeaderLink[] | null;

  show_cta?: boolean | null;
  cta_label?: string | null;
  cta_url?: string | null;

  variant?: "default" | "centered" | string | null;

  // STYLE (stored in content for now)
  text_color?: string | null;
  link_color?: string | null;
  text_size?: "xs" | "sm" | "md" | "lg" | "xl" | string | null;
  logo_size?: "xs" | "sm" | "md" | "lg" | "xl" | string | null;

  cta_bg_color?: string | null;
  cta_text_color?: string | null;
  cta_border_color?: string | null;
};

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

function asArr(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
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

export function HeaderEditor({
  block,
  onSave,
}: {
  block: BlockRow;
  onSave: (next: HeaderContent) => Promise<void>;
}) {
  const initial = asObj(block.content) as HeaderContent;

  const [brandText, setBrandText] = useState<string>(
    safeTrim((initial as any).brand_text ?? "My Site")
  );
  const [brandUrl, setBrandUrl] = useState<string>(safeTrim((initial as any).brand_url ?? "/"));
  const [logoUrl, setLogoUrl] = useState<string>(safeTrim((initial as any).logo_url ?? ""));

  const [showCta, setShowCta] = useState<boolean>(Boolean((initial as any).show_cta ?? false));
  const [ctaLabel, setCtaLabel] = useState<string>(safeTrim((initial as any).cta_label ?? ""));
  const [ctaUrl, setCtaUrl] = useState<string>(safeTrim((initial as any).cta_url ?? ""));

  // STYLE
  const [textColor, setTextColor] = useState<string>(safeTrim((initial as any).text_color ?? ""));
  const [linkColor, setLinkColor] = useState<string>(safeTrim((initial as any).link_color ?? ""));
  const [textSize, setTextSize] = useState<string>(safeTrim((initial as any).text_size ?? "md"));
  const [logoSize, setLogoSize] = useState<string>(safeTrim((initial as any).logo_size ?? "md"));

  const [ctaBgColor, setCtaBgColor] = useState<string>(safeTrim((initial as any).cta_bg_color ?? ""));
  const [ctaTextColor, setCtaTextColor] = useState<string>(
    safeTrim((initial as any).cta_text_color ?? "")
  );
  const [ctaBorderColor, setCtaBorderColor] = useState<string>(
    safeTrim((initial as any).cta_border_color ?? "")
  );

  const [links, setLinks] = useState<HeaderLink[]>(() => {
    const raw = asArr((initial as any).links);
    const norm = raw.map((x) => {
      const o = asObj(x) as HeaderLink;
      return { label: safeTrim(o.label ?? ""), url: safeTrim(o.url ?? "") };
    });
    return norm.length ? norm : [{ label: "ppp", url: "#about" }];
  });

  const [saving, setSaving] = useState(false);

  // Upload state for logo
  const logoFileRef = useRef<HTMLInputElement | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  useEffect(() => {
    const c = asObj(block.content) as any;

    setBrandText(safeTrim(c.brand_text ?? "My Site"));
    setBrandUrl(safeTrim(c.brand_url ?? "/"));
    setLogoUrl(safeTrim(c.logo_url ?? ""));

    setShowCta(Boolean(c.show_cta ?? false));
    setCtaLabel(safeTrim(c.cta_label ?? ""));
    setCtaUrl(safeTrim(c.cta_url ?? ""));

    setTextColor(safeTrim(c.text_color ?? ""));
    setLinkColor(safeTrim(c.link_color ?? ""));
    setTextSize(safeTrim(c.text_size ?? "md"));
    setLogoSize(safeTrim(c.logo_size ?? "md"));

    setCtaBgColor(safeTrim(c.cta_bg_color ?? ""));
    setCtaTextColor(safeTrim(c.cta_text_color ?? ""));
    setCtaBorderColor(safeTrim(c.cta_border_color ?? ""));

    const raw = asArr(c.links);
    const norm = raw.map((x) => {
      const o = asObj(x) as HeaderLink;
      return { label: safeTrim(o.label ?? ""), url: safeTrim(o.url ?? "") };
    });
    setLinks(norm.length ? norm : [{ label: "ppp", url: "#about" }]);

    // reset logo upload UI on block switch
    setLogoUploadError(null);
    setLogoUploading(false);
    if (logoFileRef.current) logoFileRef.current.value = "";
  }, [block.id, block.content]);

  async function uploadLogo(file: File) {
    setLogoUploadError(null);
    setLogoUploading(true);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) throw new Error("Not authenticated");

      const ext = getExtFromFile(file);
      const base = safeFileSlug(file.name.replace(/\.[^/.]+$/, "")) || "logo";
      const id = makeId();

      // IMPORTANT: policy expects first path segment to be auth.uid()
      const path = `${user.id}/header/${block.id}/${Date.now()}-${id}-${base}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("site-assets").upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
        cacheControl: "3600",
      });

      if (uploadErr) throw uploadErr;

      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      const publicUrl = pub?.publicUrl;

      if (!publicUrl) throw new Error("Failed to get public URL");

      setLogoUrl(publicUrl);
      return publicUrl;
    } catch (e: any) {
      const msg = safeTrim(e?.message) || "Upload failed";
      setLogoUploadError(msg);
      throw e;
    } finally {
      setLogoUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  }

  const labelCls = "text-sm text-[rgb(var(--db-text))] mb-2";
  const hintCls = "text-xs text-[rgb(var(--db-muted))]";
  const fieldBase =
    "w-full rounded-xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.25)]";

  const canSave = useMemo(() => safeTrim(brandText).length > 0, [brandText]);

  return (
    <div className="space-y-4">
      <div className={hintCls}>Header block</div>

      {/* CONTENT */}
      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Content</div>

        <label className="block">
          <div className={labelCls}>Brand text</div>
          <input
            value={brandText}
            onChange={(e) => setBrandText(e.target.value)}
            placeholder="My Site"
            className={fieldBase}
            disabled={saving}
          />
        </label>

        <label className="block">
          <div className={labelCls}>Brand URL</div>
          <input
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
            placeholder="/ or https://..."
            className={fieldBase}
            disabled={saving}
          />
          <div className={hintCls + " mt-2"}>Можно “/” (внутренний путь) или https://…</div>
        </label>

        <label className="block">
          <div className={labelCls}>Logo URL</div>
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://.../logo.png"
            className={fieldBase}
            disabled={saving || logoUploading}
          />
          <div className={hintCls + " mt-2"}>Можно вставить ссылку вручную или загрузить файл ниже.</div>
        </label>

        {/* LOGO UPLOAD */}
        <div className="space-y-2">
          <input
            ref={logoFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await uploadLogo(file);
              } catch {
                // error already set
              }
            }}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={saving || logoUploading} onClick={() => logoFileRef.current?.click()}>
              {logoUploading ? "Uploading..." : "Upload logo"}
            </Button>

            {!!safeTrim(logoUrl) && (
              <Button
                disabled={saving || logoUploading}
                onClick={() => {
                  setLogoUrl("");
                  setLogoUploadError(null);
                }}
              >
                Clear logo
              </Button>
            )}

            {logoUploadError && (
              <div className="text-xs text-red-500" style={{ overflowWrap: "anywhere" }}>
                {logoUploadError}
              </div>
            )}
          </div>

          {!!safeTrim(logoUrl) && (
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
              <div className="text-xs text-[rgb(var(--db-muted))]">Logo preview</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={safeTrim(logoUrl)}
                alt=""
                className="h-14 w-auto rounded-xl"
                style={{ border: "1px solid rgb(var(--db-border))" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* LINKS */}
      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Links</div>

          <Button
            variant="pill"
            onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
            disabled={saving}
          >
            Add link
          </Button>
        </div>

        {links.map((l, idx) => (
          <div
            key={idx}
            className="space-y-3 rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-4"
          >
            <label className="block">
              <div className={labelCls}>Label</div>
              <input
                value={l.label ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setLinks((prev) => prev.map((x, i) => (i === idx ? { ...x, label: v } : x)));
                }}
                placeholder="Text"
                className={fieldBase}
                disabled={saving}
              />
            </label>

            <label className="block">
              <div className={labelCls}>URL</div>
              <input
                value={l.url ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setLinks((prev) => prev.map((x, i) => (i === idx ? { ...x, url: v } : x)));
                }}
                placeholder="https://... or #anchor"
                className={fieldBase}
                disabled={saving}
              />
            </label>

            <div className="flex justify-end">
              <Button
                variant="pillDanger"
                size="sm"
                onClick={() => setLinks((prev) => prev.filter((_, i) => i !== idx))}
                disabled={saving}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[rgb(var(--db-text))]">CTA button</div>

          <label className="flex items-center gap-2 text-sm text-[rgb(var(--db-text))]">
            <input
              type="checkbox"
              checked={showCta}
              onChange={(e) => setShowCta(e.target.checked)}
              disabled={saving}
            />
            Show CTA
          </label>
        </div>

        <label className="block">
          <div className={labelCls}>CTA label</div>
          <input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Купить"
            className={fieldBase}
            disabled={saving || !showCta}
          />
        </label>

        <label className="block">
          <div className={labelCls}>CTA URL</div>
          <input
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://... or #anchor"
            className={fieldBase}
            disabled={saving || !showCta}
          />
        </label>

        <div className={hintCls}>CTA появится только если включено Show CTA и заполнены label + url.</div>
      </div>

      {/* SAVE */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={saving || !canSave}
          onClick={async () => {
            setSaving(true);
            try {
              const next: HeaderContent = {
                brand_text: safeTrim(brandText),
                brand_url: safeTrim(brandUrl),
                logo_url: safeTrim(logoUrl) || null,

                links: links.map((x) => ({
                  label: safeTrim(x.label ?? ""),
                  url: safeTrim(x.url ?? ""),
                })),

                show_cta: Boolean(showCta),
                cta_label: safeTrim(ctaLabel),
                cta_url: safeTrim(ctaUrl),
              };

              await onSave(next);
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
