"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/dashboard/ui/Button";
import { DbFieldRow } from "@/components/dashboard/ui/DbFieldRow";
import { DbInput } from "@/components/dashboard/ui/DbInput";

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

export function LinksEditor({
  block,
  onSave,
}: {
  block: any;
  onSave: (next: any) => Promise<void>;
}) {
  const initial = (block.content ?? {}) as any;

  const [items, setItems] = useState<
    Array<{ title: string; url: string; align?: "left" | "center" | "right" }>
  >(
    (initial.items ?? []).map((x: any) => ({
      title: x.title ?? "",
      url: x.url ?? "",
      align: x.align,
    })),
  );

  const [align, setAlign] = useState<"left" | "center" | "right">(
    (initial.align as any) ?? "center",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = (block.content ?? {}) as any;
    setItems(
      (c.items ?? []).map((x: any) => ({
        title: x.title ?? "",
        url: x.url ?? "",
        align: x.align,
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
            it.align === "left" || it.align === "right" || it.align === "center"
              ? it.align
              : "center";

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
                <div className="text-sm font-semibold text-[rgb(var(--db-text))]">
                  Button #{idx + 1}
                </div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={(e) => {
                    e.preventDefault();
                    setItems((prev) => prev.filter((_, i) => i !== idx));
                  }}
                >
                  Delete
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-[rgb(var(--db-text))]">Button align</div>
                <div className="flex items-center gap-2">
                  {(["left", "center", "right"] as const).map((value) => {
                    const active = currentAlign === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setItems((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, align: value } : x)),
                          );
                        }}
                        className={
                          "rounded-xl px-3 py-1 text-xs border transition " +
                          (active
                            ? "bg-[rgb(var(--db-soft))] border-[rgb(var(--db-border))] text-[rgb(var(--db-text))]"
                            : "bg-transparent border-[rgb(var(--db-border))] text-[rgb(var(--db-muted))] hover:bg-[rgb(var(--db-soft))]")
                        }
                        aria-pressed={active}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>

              <DbFieldRow label="Button text">
                <DbInput
                  value={it.title}
                  placeholder="Telegram / Website / Portfolio..."
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, title: (e.target as HTMLInputElement).value } : x,
                      ),
                    )
                  }
                />
              </DbFieldRow>

              <DbFieldRow
                label="URL"
                error={
                  !empty && !urlOk && safeTrim(it.url)
                    ? "URL must be http(s). Example: https://t.me/yourname"
                    : undefined
                }
                hint={
                  !empty && partial
                    ? "Fill both fields (text + URL) or clear the row — otherwise it won’t be saved."
                    : !empty && !partial && valid
                      ? "Looks good — will be saved."
                      : undefined
                }
              >
                <DbInput
                  value={it.url}
                  placeholder="https://..."
                  className={!empty && !urlOk ? "border-red-500/50" : ""}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, url: (e.target as HTMLInputElement).value } : x,
                      ),
                    )
                  }
                />
              </DbFieldRow>
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
                  align:
                    x.align === "left" || x.align === "right" || x.align === "center"
                      ? x.align
                      : align,
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
