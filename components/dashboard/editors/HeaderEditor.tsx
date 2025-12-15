"use client";

import * as React from "react";
import type { SiteBlockRow } from "@/components/blocks/BlocksRenderer";
import { Button } from "@/components/Button";

type HeaderContent = {
  brand_text?: string;
  brand_url?: string;
  links?: { label: string; url: string }[];
  show_cta?: boolean;
  cta_label?: string;
  cta_url?: string;
};

type Props = {
  block: SiteBlockRow;
  onSave: (patch: { content?: any; variant?: any }) => void;
};

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

export function HeaderEditor({ block, onSave }: Props) {
  const c0 = asObj(block.content) as HeaderContent;

  const [variant, setVariant] = React.useState<"default" | "centered">(
    (((block as any).variant ?? "default") as any) === "centered" ? "centered" : "default"
  );

  const [brandText, setBrandText] = React.useState<string>(c0.brand_text ?? "");
  const [brandUrl, setBrandUrl] = React.useState<string>(c0.brand_url ?? "");

  const [showCta, setShowCta] = React.useState<boolean>(Boolean((c0 as any).show_cta));

  const [ctaLabel, setCtaLabel] = React.useState<string>(c0.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = React.useState<string>(c0.cta_url ?? "");

  const [links, setLinks] = React.useState<Array<{ label: string; url: string }>>(
    Array.isArray(c0.links) ? c0.links : []
  );

  // sync when switching selected block
  React.useEffect(() => {
    const c = asObj(block.content) as HeaderContent;

    setVariant((((block as any).variant ?? "default") as any) === "centered" ? "centered" : "default");
    setBrandText(c.brand_text ?? "");
    setBrandUrl(c.brand_url ?? "");
    setShowCta(Boolean((c as any).show_cta));
    setCtaLabel(c.cta_label ?? "");
    setCtaUrl(c.cta_url ?? "");
    setLinks(Array.isArray(c.links) ? c.links : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(block as any).id]);

  function updateLink(i: number, patch: Partial<{ label: string; url: string }>) {
    setLinks((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function save() {
    onSave({
      variant,
      content: {
        brand_text: brandText,
        brand_url: brandUrl,
        links,
        show_cta: showCta,
        cta_label: ctaLabel,
        cta_url: ctaUrl,
      },
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium mb-1">Variant</div>
        <select
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          value={variant}
          onChange={(e) => setVariant(e.target.value as any)}
        >
          <option value="default">Default</option>
          <option value="centered">Centered</option>
        </select>
      </div>

      <div>
        <div className="text-sm font-medium mb-1">Brand text</div>
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          value={brandText}
          onChange={(e) => setBrandText(e.target.value)}
          placeholder="My Site"
        />
      </div>

      <div>
        <div className="text-sm font-medium mb-1">Brand URL</div>
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          value={brandUrl}
          onChange={(e) => setBrandUrl(e.target.value)}
          placeholder="/"
        />
        <div className="mt-1 text-xs opacity-70">Можно "/" (внутренний путь) или https://...</div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Links</div>
          <Button variant="secondary" onClick={addLink}>
            Add link
          </Button>
        </div>

        {links.length === 0 ? (
          <div className="text-xs opacity-70">No links yet.</div>
        ) : (
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
                <div>
                  <div className="text-xs opacity-70 mb-1">Label</div>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                    value={l.label}
                    onChange={(e) => updateLink(i, { label: e.target.value })}
                    placeholder="About"
                  />
                </div>

                <div>
                  <div className="text-xs opacity-70 mb-1">URL</div>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                    value={l.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="flex justify-end">
                  <Button variant="danger" onClick={() => removeLink(i)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-sm font-medium">Show CTA</div>
          <input
            type="checkbox"
            checked={showCta}
            onChange={(e) => setShowCta(e.target.checked)}
          />
        </div>

        <div>
          <div className="text-sm font-medium mb-1">CTA label</div>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Buy"
          />
        </div>

        <div>
          <div className="text-sm font-medium mb-1">CTA URL</div>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
