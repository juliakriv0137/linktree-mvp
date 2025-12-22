"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import type { SiteBlockRow as BlockRow } from "@/components/blocks/BlocksRenderer";
import { Button } from "@/components/dashboard/ui/Button";

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

export function HeaderEditor({
  block,
  onSave,
}: {
  block: BlockRow;
  onSave: (next: HeaderContent) => Promise<void>;
}) {
  const initial = asObj(block.content) as HeaderContent;

  const [brandText, setBrandText] = useState<string>(safeTrim((initial as any).brand_text ?? "My Site"));
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
  const [ctaTextColor, setCtaTextColor] = useState<string>(safeTrim((initial as any).cta_text_color ?? ""));
  const [ctaBorderColor, setCtaBorderColor] = useState<string>(safeTrim((initial as any).cta_border_color ?? ""));

  const [links, setLinks] = useState<HeaderLink[]>(() => {
    const raw = asArr((initial as any).links);
    const norm = raw.map((x) => {
      const o = asObj(x) as HeaderLink;
      return { label: safeTrim(o.label ?? ""), url: safeTrim(o.url ?? "") };
    });
    return norm.length ? norm : [{ label: "ppp", url: "#about" }];
  });

  const [saving, setSaving] = useState(false);

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
  }, [block.id, block.content]);

  const labelCls = "text-sm text-[rgb(var(--db-text))] mb-2";
  const hintCls = "text-xs text-[rgb(var(--db-muted))]";
  const fieldBase =
    "w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-4 py-3 text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]";

  const canSave = useMemo(() => safeTrim(brandText).length > 0, [brandText]);

  return (
    <div className="space-y-4">
      <div className={hintCls}>Header block</div>

      {/* CONTENT */}
      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Content</div>
        <label className="block">
          <div className={labelCls}>Brand text</div>
          <input value={brandText} onChange={(e) => setBrandText(e.target.value)} placeholder="My Site" className={fieldBase} />
        </label>

        <label className="block">
          <div className={labelCls}>Brand URL</div>
          <input value={brandUrl} onChange={(e) => setBrandUrl(e.target.value)} placeholder="/ or https://..." className={fieldBase} />
          <div className={hintCls + " mt-2"}>Можно “/” (внутренний путь) или https://…</div>
        </label>

        <label className="block">
          <div className={labelCls}>Logo URL</div>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://.../logo.png" className={fieldBase} />
          <div className={hintCls + " mt-2"}>Оставь пустым, если логотип не нужен.</div>
        </label>
      </div>

      {/* LINKS */}
      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Links</div>
          <Button variant="ghost" onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])} disabled={saving}>
            Add link
          </Button>
        </div>

        {links.map((l, idx) => (
          <div key={idx} className="space-y-3 rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-4">
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
              />
            </label>

            <div className="flex justify-end">
              <Button variant="danger" onClick={() => setLinks((prev) => prev.filter((_, i) => i !== idx))} disabled={saving}>
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
            <input type="checkbox" checked={showCta} onChange={(e) => setShowCta(e.target.checked)} disabled={saving} />
            Show CTA
          </label>
        </div>

        <label className="block">
          <div className={labelCls}>CTA label</div>
          <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Купить" className={fieldBase} disabled={saving || !showCta} />
        </label>

        <label className="block">
          <div className={labelCls}>CTA URL</div>
          <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://... or #anchor" className={fieldBase} disabled={saving || !showCta} />
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
                logo_url: safeTrim(logoUrl),

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
