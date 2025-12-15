
"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";


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
  try {
    const u = new URL(normalizeUrl(v));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm text-white/80 mb-2">{label}</div>
      <input
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}


function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";

}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed";

    const style =
    variant === "danger"
      ? "bg-red-500/15 text-red-200 border border-red-400/20 hover:bg-red-500/20"
      : variant === "secondary"
        ? "border border-white/10 bg-white/5 text-white hover:bg-white/10"
        : variant === "ghost"
          ? "border border-white/10 bg-transparent text-white/80 hover:bg-white/10"
          : "bg-white text-black hover:opacity-90";
  

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={`${base} ${style} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinksEditor({
  block,
  onSave,
}:

{
  block: any;
onSave: (next: any) => Promise<void>;

}) {
  const initial = (block.content ?? {}) as any;


  const [items, setItems] = useState<Array<{ title: string; url: string; align?: "left" | "center" | "right" }>>(
    (initial.items ?? []).map((x: any) => ({

      title: x.title ?? "",
      url: x.url ?? "",
      align: (x as any).align,
    })),
  );

  const [align, setAlign] = useState<"left" | "center" | "right">((initial.align as any) ?? "center");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = (block.content ?? {}) as any;

    setItems(
      (c.items ?? []).map((x: any) => ({

        title: x.title ?? "",
        url: x.url ?? "",
        align: (x as any).align,
      })),
    );
    setAlign((c.align as any) ?? "center");
  }, [block.id, block.content]);

  function rowIsEmpty(row: { title: string; url: string }) {
    return !safeTrim(row.title) && !safeTrim(row.url);
  }
  function rowIsPartial(row: { title: string; url: string }) {
    const t = safeTrim(row.title);
    const u = safeTrim(row.url);
    return (t && !u) || (!t && u);
  }
  function rowIsValid(row: { title: string; url: string }) {
    const t = safeTrim(row.title);
    const u = safeTrim(row.url);
    return !!t && isValidHttpUrl(u);
  }

  const effectiveRows = useMemo(() => items.filter((r) => !rowIsEmpty(r)), [items]);
  const hasInvalid = useMemo(() => effectiveRows.some((r) => !rowIsValid(r)), [effectiveRows]);
  const hasPartials = useMemo(() => effectiveRows.some((r) => rowIsPartial(r)), [effectiveRows]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((it, idx) => {
          const empty = rowIsEmpty(it);
          const partial = rowIsPartial(it);
          const valid = rowIsValid(it);

          const urlOk = empty ? true : safeTrim(it.url) ? isValidHttpUrl(it.url) : false;

          const currentAlign: "left" | "center" | "right" =
            it.align === "left" || it.align === "right" || it.align === "center" ? it.align : "center";

            return (
              <div
                key={idx}
                style={{
                  background: "var(--card-bg)",
                  border: "var(--card-border)",
                  boxShadow: "var(--card-shadow)",
                  padding: "var(--card-padding)",
                  borderRadius: "var(--button-radius)",
                }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white/80">Button #{idx + 1}</div>
                  <Button
                    type="button"
                    variant="danger"
                    aria-label="Delete link button"
                    onClick={(e) => {
                      e.preventDefault();
                      setItems((prev) => prev.filter((_, i) => i !== idx));
                    }}
                  >
                    Delete
                  </Button>
                </div>
            
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-white/80">Button align</div>
                  <div className="flex items-center gap-2">
                    {(["left", "center", "right"] as const).map((value) => {
                      const active = currentAlign === value;
            
                      const alignBtnClass =
                        "rounded-xl px-3 py-1 text-xs transition border " +
                        (active
                          ? "bg-white/15 border-white/20 text-white"
                          : "bg-transparent border-white/10 text-white/70 hover:bg-white/10");
            
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, align: value } : x)));
                          }}
                          className={alignBtnClass}
                          aria-pressed={active}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
            
                <Input
                  label="Button text"
                  value={it.title}
                  onChange={(v) => setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)))}
                  placeholder="Telegram / Website / Portfolio..."
                />
            
                <label className="block">
                  <div className="text-sm text-white/80 mb-2">URL</div>
                  <input
                    value={it.url}
                    onChange={(e) =>
                      setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))
                    }
                    placeholder="https://..."
                    className={
                      "w-full rounded-2xl border bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 " +
                      (empty || urlOk ? "border-white/10" : "border-red-500/50")
                    }
                  />
            
                  {!empty && !urlOk && safeTrim(it.url) && (
                    <div className="text-xs text-red-300 mt-2">URL must be http(s). Example: https://t.me/yourname</div>
                  )}
            
                  {!empty && partial && (
                    <div className="text-xs text-yellow-200/80 mt-2">
                      Fill both fields (text + URL) or clear the row — otherwise it won’t be saved.
                    </div>
                  )}
            
                  {!empty && !partial && valid && (
                    <div className="text-xs text-emerald-200/70 mt-2">Looks good — will be saved.</div>
                  )}
                </label>
              </div>
            );
            
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            setItems((prev) => [...prev, { title: "", url: "", align }]);
          }}
        >
          + Add button
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            setItems((prev) => prev.filter((r) => !rowIsEmpty(r)));
          }}
          disabled={items.every((r) => !rowIsEmpty(r))}
          aria-label="Remove empty rows"
        >
          Clear empty
        </Button>

        <Button
          type="button"
          variant="primary"
          disabled={saving || hasInvalid}
          onClick={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const cleaned = items
                .map((x) => ({
                  title: safeTrim(x.title),
                  url: safeTrim(x.url),
                  align: x.align === "left" || x.align === "right" || x.align === "center" ? x.align : align,
                }))
                .filter((x) => x.title || x.url)
                .filter((x) => x.title && isValidHttpUrl(x.url))
                .map((x) => ({
                  title: x.title,
                  url: normalizeUrl(x.url),
                  align: x.align,
                }));

              await onSave({ items: cleaned, align });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving..." : "Save links"}
        </Button>
      </div>

      {hasPartials && (
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-100/90">
          Some rows are partially filled. They won’t be saved until both fields are valid.
        </div>
      )}
    </div>
  );
}
