"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import type { SiteBlockRow as BlockRow } from "@/components/blocks/BlocksRenderer";
import { Button } from "@/components/dashboard/ui/Button";

type HeaderLink = { label?: string | null; url?: string | null };

type HeaderContent = {
  brandText?: string | null;
  brandUrl?: string | null;
  links?: HeaderLink[] | null;
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

  const [brandText, setBrandText] = useState<string>(safeTrim(initial.brandText ?? "My Site"));
  const [brandUrl, setBrandUrl] = useState<string>(safeTrim(initial.brandUrl ?? "/"));
  const [links, setLinks] = useState<HeaderLink[]>(() => {
    const raw = asArr(initial.links);
    const norm = raw.map((x) => {
      const o = asObj(x) as HeaderLink;
      return { label: safeTrim(o.label ?? ""), url: safeTrim(o.url ?? "") };
    });
    return norm.length ? norm : [{ label: "ppp", url: "#about" }];
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = asObj(block.content) as HeaderContent;
    setBrandText(safeTrim(c.brandText ?? "My Site"));
    setBrandUrl(safeTrim(c.brandUrl ?? "/"));

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

  const canSave = useMemo(() => {
    // можно сохранять всегда, но хоть какой-то бренд-текст лучше иметь
    return safeTrim(brandText).length > 0;
  }, [brandText]);

  return (
    <div className="space-y-4">
      <div className={hintCls}>Header block</div>

      <label className="block">
        <div className={labelCls}>Brand text</div>
        <input
          value={brandText}
          onChange={(e) => setBrandText(e.target.value)}
          placeholder="My Site"
          className={fieldBase}
        />
      </label>

      <label className="block">
        <div className={labelCls}>Brand URL</div>
        <input
          value={brandUrl}
          onChange={(e) => setBrandUrl(e.target.value)}
          placeholder="/ or https://..."
          className={fieldBase}
        />
        <div className={hintCls + " mt-2"}>Можно “/” (внутренний путь) или https://…</div>
      </label>

      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Links</div>
          <Button
            variant="ghost"
            onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
            disabled={saving}
          >
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
              <Button
                variant="danger"
                onClick={() => setLinks((prev) => prev.filter((_, i) => i !== idx))}
                disabled={saving}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={saving || !canSave}
          onClick={async () => {
            setSaving(true);
            try {
              const next: HeaderContent = {
                brandText: safeTrim(brandText),
                brandUrl: safeTrim(brandUrl),
                links: links.map((x) => ({ label: safeTrim(x.label ?? ""), url: safeTrim(x.url ?? "") })),
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
