"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { BlocksRenderer } from "@/components/blocks/BlocksRenderer";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/lib/supabaseClient";
import InsertBlockMenu from "@/components/InsertBlockMenu";
import { THEMES } from "@/lib/themes";
import { SiteShell } from "@/components/site/SiteShell";
import { LinkButton } from "@/components/site/LinkButton";

type SiteRow = {
  id: string;
  owner_id: string;
  slug: string;
  name: string | null;
  theme: any;
  layout_width: "compact" | "wide" | "full";

  theme_key: string;
  background_style: string;
  button_style: string;

  font_scale: "sm" | "md" | "lg";
  button_radius: "md" | "xl" | "2xl" | "full";
  card_style: "plain" | "card";

  bg_color?: string | null;
  text_color?: string | null;
  muted_color?: string | null;
  border_color?: string | null;
  button_color?: string | null;
  button_text_color?: string | null;

  created_at: string;
};

type BlockRow = {
  id: string;
  site_id: string;
  type: string;
  variant?: string | null;
  style?: Record<string, unknown> | null;
  content: any;
  position: number;
  is_visible: boolean;
  created_at: string;
};

type HeroContent = {
  title?: string;
  subtitle?: string;
  avatar?: string | null;

  title_size?: "sm" | "md" | "lg";
  subtitle_size?: "sm" | "md" | "lg";
  align?: "left" | "center" | "right";
};

type LinksContent = {
  items?: Array<{ title?: string; url?: string; align?: "left" | "center" | "right" }>;
  align?: "left" | "center" | "right";
};

type ImageContent = {
  url?: string;
  alt?: string;
  shape?: "circle" | "rounded" | "square";
};

type TextContent = {
  text?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center" | "right";
};

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safeTrim(v: string) {
  return (v ?? "").trim();
}

function normalizeUrl(raw: string) {
  const v = safeTrim(raw);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function isValidHttpUrl(raw: string) {
  const v = safeTrim(raw);
  if (!v) return false;
  try {
    const u = new URL(normalizeUrl(v));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeHexOrNull(v: string): string | null {
  const raw = safeTrim(v);
  if (!raw) return null;

  const m = raw.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;

  let hex = m[1].toLowerCase();
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${hex}`;
}

async function getAuthedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

async function ensureSiteForUser(): Promise<SiteRow> {
  const uid = await getAuthedUserId();

  const { data: existing, error: selErr } = await supabase
    .from("sites")
    .select("*")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing as SiteRow;

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", uid)
    .single();

  if (profErr) throw profErr;

  const slug = String(profile?.username ?? "").trim();
  if (!slug) throw new Error("Profile username is empty; cannot create site slug.");

  const name = String(profile?.display_name ?? "").trim() || slug;

  const { data: created, error: insErr } = await supabase
    .from("sites")
    .insert({
      owner_id: uid,
      slug,
      name,
      theme: { mode: "dark" },
      theme_key: "midnight",
      button_style: "solid",
      background_style: "solid",
      layout_width: "compact",

      font_scale: "md",
      button_radius: "2xl",
      card_style: "card",

      bg_color: null,
      text_color: null,
      muted_color: null,
      border_color: null,
      button_color: null,
      button_text_color: null,
    })
    .select("*")
    .single();

  if (insErr) throw insErr;
  return created as SiteRow;
}

async function loadBlocks(siteId: string): Promise<BlockRow[]> {
  const { data, error } = await supabase
    .from("site_blocks")
    .select("*")
    .eq("site_id", siteId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BlockRow[];
}

async function createBlock(siteId: string, type: "hero" | "links" | "image" | "text" | "divider") {
  const { data: maxPosRow, error: maxPosErr } = await supabase
    .from("site_blocks")
    .select("position")
    .eq("site_id", siteId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxPosErr) throw maxPosErr;
  const nextPos = (maxPosRow?.position ?? 0) + 1;

  const defaultContent =
    type === "hero"
      ? ({
          title: "Your title",
          subtitle: "Short subtitle",
          avatar: null,
        } satisfies HeroContent)
      : type === "image"
        ? ({
            url: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=600&q=80",
            alt: "Profile image",
            shape: "circle",
          } satisfies ImageContent)
        : type === "text"
          ? ({ text: "Your text here" } satisfies TextContent)
          : type === "divider"
            ? ({ style: "line" } as any)
            : ({
                items: [{ title: "Telegram", url: "https://t.me/yourname" }],
              } satisfies LinksContent);

  const { error } = await supabase.from("site_blocks").insert({
    site_id: siteId,
    type,
    content: defaultContent,
    position: nextPos,
    is_visible: true,
  });

  if (error) throw error;
}

async function updateBlock(
  blockId: string,
  patch: Partial<Pick<BlockRow, "content" | "is_visible" | "position">>,
) {
  const { error } = await supabase.from("site_blocks").update(patch).eq("id", blockId);
  if (error) throw error;
}

async function deleteBlock(blockId: string) {
  const { error } = await supabase.from("site_blocks").delete().eq("id", blockId);
  if (error) throw error;
}

async function updateSiteTheme(
  siteId: string,
  patch: Partial<
    Pick<
      SiteRow,
      | "theme_key"
      | "background_style"
      | "button_style"
      | "font_scale"
      | "button_radius"
      | "card_style"
      | "bg_color"
      | "text_color"
      | "muted_color"
      | "border_color"
      | "button_color"
      | "button_text_color"
      | "layout_width"
    >
  >,
) {
  const { error } = await supabase.from("sites").update(patch).eq("id", siteId);
  if (error) throw error;
}

/** UI primitives (dashboard only) */
function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.6)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-40 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-white/90"
      : variant === "danger"
        ? "bg-red-600 text-white hover:bg-red-500"
        : "bg-white/10 text-white hover:bg-white/15";

  return (
    <button {...props} className={clsx(base, styles, className)}>
      {children}
    </button>
  );
}

function IconButton({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={clsx(
        "inline-flex h-9 w-9 items-center justify-center rounded-2xl border text-sm transition",
        disabled
          ? "cursor-not-allowed opacity-40 border-white/10 bg-white/5"
          : "border-white/10 bg-white/5 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <div className="text-sm text-white/80 mb-2">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
  placeholder = "#rrggbb",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const normalized = normalizeHexOrNull(value) ?? "#000000";
  const isValid = value ? normalizeHexOrNull(value) !== null : true;

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block">
          <div className="text-sm text-white/80 mb-2">{label}</div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={clsx(
              "w-full rounded-2xl border bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20",
              isValid ? "border-white/10" : "border-red-500/50",
            )}
          />
          {!isValid && (
            <div className="text-xs text-red-300 mt-2">Invalid hex. Use #fff or #ffffff.</div>
          )}
        </label>
      </div>

      <div className="w-[64px]">
        <div className="text-xs text-white/50 mb-2">Pick</div>
        <input
          type="color"
          value={normalized}
          onChange={(e) => onChange(e.target.value)}
          className="h-[44px] w-full cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
          aria-label={`${label} color picker`}
        />
      </div>
    </div>
  );
}

/** Block Editors (same logic) */
function HeroEditor({
  block,
  onSave,
}: {
  block: BlockRow;
  onSave: (next: HeroContent) => Promise<void>;
}) {
  const initial = (block.content ?? {}) as HeroContent;

  const [title, setTitle] = useState(initial.title ?? "");
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "");
  const [titleSize, setTitleSize] = useState<HeroContent["title_size"]>(initial.title_size ?? "lg");
  const [subtitleSize, setSubtitleSize] = useState<HeroContent["subtitle_size"]>(
    initial.subtitle_size ?? "md",
  );
  const [align, setAlign] = useState<HeroContent["align"]>(initial.align ?? "center");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = (block.content ?? {}) as HeroContent;
    setTitle(c.title ?? "");
    setSubtitle(c.subtitle ?? "");
    setTitleSize((c.title_size as any) ?? "lg");
    setSubtitleSize((c.subtitle_size as any) ?? "md");
    setAlign((c.align as any) ?? "center");
  }, [block.id, block.content]);

  const titleClass =
    titleSize === "sm" ? "text-xl" : titleSize === "md" ? "text-2xl" : "text-3xl";
  const subtitleClass =
    subtitleSize === "sm" ? "text-sm" : subtitleSize === "lg" ? "text-lg" : "text-base";
  const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/50">Hero block</div>

      <Input label="Title" value={title} onChange={setTitle} placeholder="Your name / brand" />

      <Textarea
        label="Subtitle"
        value={subtitle}
        onChange={setSubtitle}
        placeholder="Short bio / tagline"
        rows={3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <div className="text-sm text-white/80 mb-2">Title size</div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            value={titleSize ?? "lg"}
            onChange={(e) => setTitleSize(e.target.value as any)}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm text-white/80 mb-2">Subtitle size</div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            value={subtitleSize ?? "md"}
            onChange={(e) => setSubtitleSize(e.target.value as any)}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm text-white/80 mb-2">Align</div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            value={align ?? "center"}
            onChange={(e) => setAlign(e.target.value as any)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
      </div>

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
        <div className="text-xs text-white/50">Preview</div>
        <div className={`space-y-1 ${alignClass}`}>
          <div className={`${titleClass} font-bold text-[rgb(var(--text))]`}>
            {safeTrim(title) ? title : "Your title…"}
          </div>
          {safeTrim(subtitle) ? (
            <div className={`${subtitleClass} text-[rgb(var(--muted))]`}>{subtitle}</div>
          ) : (
            <div className={`${subtitleClass} text-[rgb(var(--muted))] opacity-60`}>Your subtitle…</div>
          )}
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
                title: safeTrim(title),
                subtitle: safeTrim(subtitle),
                avatar: null,
                title_size: titleSize ?? "lg",
                subtitle_size: subtitleSize ?? "md",
                align: (align as any) ?? "center",
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

function LinksEditor({
  block,
  onSave,
}: {
  block: BlockRow;
  onSave: (next: LinksContent) => Promise<void>;
}) {
  const initial = (block.content ?? {}) as LinksContent;

  const [items, setItems] = useState<Array<{ title: string; url: string; align?: "left" | "center" | "right" }>>(
    (initial.items ?? []).map((x) => ({
      title: x.title ?? "",
      url: x.url ?? "",
      align: (x as any).align,
    })),
  );

  const [align, setAlign] = useState<"left" | "center" | "right">((initial.align as any) ?? "center");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = (block.content ?? {}) as LinksContent;
    setItems(
      (c.items ?? []).map((x) => ({
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

  const AlignButton = ({ value, label }: { value: "left" | "center" | "right"; label: string }) => {
    const active = align === value;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setAlign(value);
        }}
        className={clsx(
          "rounded-xl border px-3 py-2 text-xs font-medium transition",
          active
            ? "border-white/30 bg-white/15 text-white"
            : "border-white/10 bg-black/20 text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        {label}
      </button>
    );
  };

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
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, align: value } : x)));
                        }}
                        className={clsx(
                          "rounded-xl px-3 py-1 text-xs transition border",
                          active
                            ? "bg-white/15 border-white/20 text-white"
                            : "bg-transparent border-white/10 text-white/70 hover:bg-white/10",
                        )}
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
                  className={clsx(
                    "w-full rounded-2xl border bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20",
                    empty || urlOk ? "border-white/10" : "border-red-500/50",
                  )}
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

function ImageEditor({
  block,
  onSave,
}: {
  block: BlockRow;
  onSave: (next: ImageContent) => Promise<void>;
}) {
  const initial = (block.content ?? {}) as ImageContent;

  const [url, setUrl] = useState<string>(initial.url ?? "");
  const [alt, setAlt] = useState<string>(initial.alt ?? "");
  const [shape, setShape] = useState<ImageContent["shape"]>((initial.shape as any) ?? "circle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = (block.content ?? {}) as ImageContent;
    setUrl(c.url ?? "");
    setAlt(c.alt ?? "");
    setShape((c.shape as any) ?? "circle");
  }, [block.id, block.content]);

  const urlOk = !safeTrim(url) ? false : isValidHttpUrl(url);

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
          className={clsx(
            "w-full rounded-2xl border bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20",
            urlOk ? "border-white/10" : "border-red-500/50",
          )}
        />
        {!urlOk && safeTrim(url) && (
          <div className="text-xs text-red-300 mt-2">URL must be http(s). Example: https://images.unsplash.com/...</div>
        )}
      </label>

      <Input label="Alt text" value={alt} onChange={setAlt} placeholder="Describe the image (optional)" />

      <label className="block">
        <div className="text-sm text-white/80 mb-2">Shape</div>
        <select
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          value={shape ?? "circle"}
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
              alt={alt || "Image preview"}
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
            if (!isValidHttpUrl(url)) return;

            setSaving(true);
            try {
              await onSave({
                url: normalizeUrl(url),
                alt: safeTrim(alt),
                shape: shape ?? "circle",
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

function TextEditor({
  block,
  onSave,
}: {
  block: BlockRow;
  onSave: (next: TextContent) => Promise<void>;
}) {
  const initial = (block.content ?? {}) as TextContent;

  const [text, setText] = useState<string>(initial.text ?? "");
  const [size, setSize] = useState<TextContent["size"]>(initial.size ?? "md");
  const [align, setAlign] = useState<TextContent["align"]>(initial.align ?? "left");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = (block.content ?? {}) as TextContent;
    setText(c.text ?? "");
    setSize((c.size as any) ?? "md");
    setAlign((c.align as any) ?? "left");
  }, [block.id, block.content]);

  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/50">Text block</div>

      <Textarea label="Text" value={text} onChange={setText} placeholder="Write something..." rows={6} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <div className="text-sm text-white/80 mb-2">Text size</div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            value={size ?? "md"}
            onChange={(e) => setSize(e.target.value as any)}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm text-white/80 mb-2">Align</div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            value={align ?? "left"}
            onChange={(e) => setAlign(e.target.value as any)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
      </div>

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
        <div className="text-xs text-white/50">Preview</div>
        <div className={`${sizeClass} ${alignClass} text-[rgb(var(--text))] whitespace-pre-wrap`}>
          {safeTrim(text) ? text : "Your text preview…"}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={saving || !safeTrim(text)}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                text: safeTrim(text),
                size: size ?? "md",
                align: (align as any) ?? "left",
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving..." : "Save text"}
        </Button>
      </div>
    </div>
  );
}

/** Left list item (sortable) */
function SortableBlockRow({
  block,
  selected,
  onSelect,
  onToggleVisible,
  onDelete,
  disabled,
}: {
  block: BlockRow;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={clsx(
          "w-full rounded-2xl border px-3 py-3 text-left transition",
          selected
            ? "border-white/25 bg-white/10"
            : "border-white/10 bg-white/5 hover:bg-white/10",
          !block.is_visible && "opacity-70",
        )}
      >
        <div className="flex items-center gap-2">
          {/* drag handle */}
<div
  className="flex items-center justify-center rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-xs text-white/70 cursor-grab active:cursor-grabbing"
  {...attributes}
  {...listeners}
  aria-label="Drag to reorder"
  title="Drag to reorder"
  onClick={(e) => {
    // чтобы клик по ручке не выбирал блок
    e.stopPropagation();
  }}
>
  ⠿
</div>


  
          {/* clickable area to select */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onSelect();
            }}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs rounded-full bg-white/10 px-2 py-1">{block.type}</span>
              {!block.is_visible && <span className="text-xs text-yellow-200/80">hidden</span>}
            </div>
            <div className="text-xs text-white/40 mt-1">pos {block.position}</div>
          </button>
  
          {/* actions */}
          <div className="flex items-center gap-2">
          <IconButton title={block.is_visible ? "Hide" : "Show"} onClick={onToggleVisible} disabled={disabled}>
  {block.is_visible ? "🙈" : "👁️"}
</IconButton>

            <IconButton title="Delete" onClick={onDelete} disabled={disabled}>
              🗑️
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
  
}

/** Preview renderer (center column) */
function PreviewBlock({
  block,
  buttonStyle,
}: {
  block: BlockRow;
  buttonStyle: any;
}) {
  if (!block.is_visible) return null;

  if (block.type === "divider") {
    return (
      <div className="flex justify-center py-4">
        <div className="h-px w-24 bg-[rgb(var(--border))] opacity-60" />
      </div>
    );
  }

  if (block.type === "hero") {
    const c = (block.content ?? {}) as HeroContent;

    const title = safeTrim(c.title ?? "");
    const subtitle = safeTrim(c.subtitle ?? "");
    const align = (c.align ?? "center") as "left" | "center" | "right";

    const titleClass =
      c.title_size === "sm" ? "text-xl" : c.title_size === "md" ? "text-2xl" : "text-3xl";
    const subtitleClass =
      c.subtitle_size === "sm" ? "text-sm" : c.subtitle_size === "lg" ? "text-lg" : "text-base";
    const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

    return (
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
        <div className={clsx("space-y-1", alignClass)}>
          <div className={clsx(titleClass, "font-bold text-[rgb(var(--text))]")}>{title || "Your title"}</div>
          {subtitle ? (
            <div className={clsx(subtitleClass, "text-[rgb(var(--muted))]")}>{subtitle}</div>
          ) : (
            <div className={clsx(subtitleClass, "text-[rgb(var(--muted))] opacity-60")}>Short subtitle</div>
          )}
        </div>
      </div>
    );
  }

  if (block.type === "text") {
    const c = (block.content ?? {}) as TextContent;
    const text = safeTrim(c.text ?? "");
    const sizeClass = c.size === "sm" ? "text-sm" : c.size === "lg" ? "text-lg" : "text-base";
    const alignClass =
      c.align === "center" ? "text-center" : c.align === "right" ? "text-right" : "text-left";

    return (
      <div
        style={{
          background: "var(--card-bg)",
          border: "var(--card-border)",
          boxShadow: "var(--card-shadow)",
          padding: "var(--card-padding)",
          borderRadius: "var(--button-radius)",
        }}
      >
        <div className={clsx(sizeClass, alignClass, "text-[rgb(var(--text))] whitespace-pre-wrap")}>
          {text || "Your text here"}
        </div>
      </div>
    );
  }

  if (block.type === "image") {
    const c = (block.content ?? {}) as ImageContent;
    const url = safeTrim(c.url ?? "");
    const alt = safeTrim(c.alt ?? "");

    const shape = (c.shape ?? "circle") as "circle" | "rounded" | "square";
    const radius = shape === "circle" ? "9999px" : shape === "rounded" ? "24px" : "0px";

    return (
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
        {isValidHttpUrl(url) ? (
          <div className="mx-auto w-full max-w-[360px] aspect-square overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={normalizeUrl(url)}
              alt={alt || "Image"}
              className="h-full w-full object-cover"
              style={{ borderRadius: radius }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">
            Image URL missing / invalid.
          </div>
        )}
      </div>
    );
  }

  if (block.type === "links") {
    const c = (block.content ?? {}) as LinksContent;
    const blockAlign = (c.align ?? "center") as "left" | "center" | "right";

    const items = (c.items ?? [])
      .map((x) => ({
        title: safeTrim(x.title ?? ""),
        url: safeTrim(x.url ?? ""),
        align: (x as any).align as "left" | "center" | "right" | undefined,
      }))
      .filter((x) => x.title && isValidHttpUrl(x.url));

    const alignWrap =
      blockAlign === "left" ? "items-start" : blockAlign === "right" ? "items-end" : "items-center";

    return (
      <div className={clsx("flex flex-col gap-3", alignWrap)}>
        {items.length === 0 ? (
          <div
            style={{
              background: "var(--card-bg)",
              border: "var(--card-border)",
              boxShadow: "var(--card-shadow)",
              padding: "var(--card-padding)",
              borderRadius: "var(--button-radius)",
            }}
            className="text-sm text-[rgb(var(--muted))]"
          >
            Add at least 1 valid button (text + URL).
          </div>
        ) : (
          items.map((it, i) => {
            const per = it.align === "left" || it.align === "right" || it.align === "center" ? it.align : blockAlign;
            const perWrap =
              per === "left" ? "self-start" : per === "right" ? "self-end" : "self-center";

            return (
              <div key={i} className={perWrap}>
                <LinkButton href={normalizeUrl(it.url)} label={it.title} buttonStyle={buttonStyle} />
              </div>
            );
          })
        )}
      </div>
    );
  }

  return null;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteRow | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState<null | "hero" | "links" | "image" | "text" | "divider">(null);
  const [insertMenuIndex, setInsertMenuIndex] = useState<number | null>(null);
  const [inserting, setInserting] = useState<null | { index: number; type: "hero" | "links" | "image" | "text" | "divider" }>(
    null,
  );

  const [colors, setColors] = useState({
    bg_color: "",
    text_color: "",
    muted_color: "",
    border_color: "",
    button_color: "",
    button_text_color: "",
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"block" | "theme">("block");


  async function refreshAll() {
    setError(null);
    setLoading(true);
    try {
      const s = await ensureSiteForUser();
      setSite(s);

      setColors({
        bg_color: s.bg_color ?? "",
        text_color: s.text_color ?? "",
        muted_color: s.muted_color ?? "",
        border_color: s.border_color ?? "",
        button_color: s.button_color ?? "",
        button_text_color: s.button_text_color ?? "",
      });

      const bs = await loadBlocks(s.id);
      setBlocks(bs);

      if (!bs.some((b) => b.type === "hero")) {
        await createBlock(s.id, "hero");
        const bs2 = await loadBlocks(s.id);
        setBlocks(bs2);
      }

      const latest = await loadBlocks(s.id);
      const firstVisible = latest.find((b) => b.is_visible) ?? latest[0];
      setSelectedBlockId((prev) => {
        if (prev && latest.some((b) => b.id === prev)) return prev;
        return firstVisible?.id ?? null;
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const publicUrl = site ? `/${site.slug}` : "/";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function persistOrder(next: BlockRow[]) {
    if (!site) return;
    setBlocks(next);
    await Promise.all(next.map((b, i) => updateBlock(b.id, { position: i + 1 })));
  }

  async function onDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(blocks, oldIndex, newIndex).map((b, idx) => ({ ...b, position: idx + 1 }));

    try {
      await persistOrder(next);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      if (!site) return;
      const bs = await loadBlocks(site.id);
      setBlocks(bs);
    }
  }

  async function insertBlockAt(index: number, type: "hero" | "links" | "image" | "text" | "divider") {
    if (!site) return;
    setError(null);
    setInserting({ index, type });

    try {
      await createBlock(site.id, type);

      const bs = await loadBlocks(site.id);
      setBlocks(bs);

      const last = bs.reduce((acc, cur) => (cur.position > acc.position ? cur : acc), bs[0]);
      const oldIndex = bs.findIndex((b) => b.id === last.id);
      if (oldIndex === -1) return;

      const targetIndex = Math.max(0, Math.min(index, bs.length - 1));
      if (oldIndex === targetIndex) return;

      const next = arrayMove(bs, oldIndex, targetIndex).map((b, idx) => ({ ...b, position: idx + 1 }));

      await persistOrder(next);
      setInsertMenuIndex(null);

      const inserted = next[targetIndex];
      if (inserted?.id) setSelectedBlockId(inserted.id);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      const bs2 = await loadBlocks(site.id);
      setBlocks(bs2);
    } finally {
      setInserting(null);
    }
  }

  async function saveColorField(
    key: "bg_color" | "text_color" | "muted_color" | "border_color" | "button_color" | "button_text_color",
    rawValue: string,
  ) {
    if (!site) return;

    const normalized = normalizeHexOrNull(rawValue);
    if (rawValue && normalized === null) return;

    try {
      await updateSiteTheme(site.id, { [key]: normalized } as any);
      setSite({ ...site, [key]: normalized } as any);
      setColors((prev) => ({ ...prev, [key]: normalized ?? "" }));
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function toggleVisibility(block: BlockRow) {
    if (!site) return;
    setError(null);

    try {
      await updateBlock(block.id, { is_visible: !block.is_visible });
      const bs = await loadBlocks(site.id);
      setBlocks(bs);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function removeBlock(block: BlockRow) {
    if (!site) return;

    const ok = window.confirm("Delete this block? This cannot be undone.");
    if (!ok) return;

    setError(null);

    try {
      await deleteBlock(block.id);

      const bs = await loadBlocks(site.id);
      const normalized = bs.map((b, idx) => ({ ...b, position: idx + 1 }));
      setBlocks(normalized);

      await Promise.all(normalized.map((b) => updateBlock(b.id, { position: b.position })));

      setSelectedBlockId((prev) => {
        if (!prev) return normalized[0]?.id ?? null;
        if (prev === block.id) return normalized[0]?.id ?? null;
        if (!normalized.some((b) => b.id === prev)) return normalized[0]?.id ?? null;
        return prev;
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
      const bs2 = await loadBlocks(site.id);
      setBlocks(bs2);
    }
  }

  const selectedBlock = useMemo(() => blocks.find((b) => b.id === selectedBlockId) ?? null, [blocks, selectedBlockId]);

  const canAct = !!site && !loading && !creating && !inserting;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold">Dashboard</div>
                <span className="hidden sm:inline text-xs rounded-full bg-white/10 px-2 py-1 text-white/70">
                  Mini-site builder (A.1)
                </span>
              </div>
              <div className="text-xs text-white/50 mt-1 truncate">
                Site: <span className="text-white/70">{site?.slug ?? "..."}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={refreshAll} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>

              <Button
                variant="ghost"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/login";
                }}
              >
                Sign out
              </Button>

              <Link href={publicUrl} target="_blank" className="hidden sm:inline-flex">
                <span className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-white/10 hover:bg-white/15 transition">
                  Open public page
                </span>
              </Link>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_380px]">
          {/* LEFT: Blocks list */}
          <Card className="lg:sticky lg:top-[76px] lg:h-[calc(100vh-96px)] lg:overflow-hidden flex flex-col">

            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Blocks</div>
                  <div className="text-xs text-white/50 mt-1">Select a block to edit. Drag to reorder.</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["hero", "links", "image", "text", "divider"] as const).map((t) => (
                  <Button
                    key={t}
                    variant="primary"
                    disabled={!site || loading || !!creating || !!inserting}
                    onClick={async () => {
                      if (!site) return;
                      setCreating(t);
                      try {
                        await createBlock(site.id, t);
                        const bs = await loadBlocks(site.id);
                        setBlocks(bs);
                        const last = bs.reduce((acc, cur) => (cur.position > acc.position ? cur : acc), bs[0]);
                        if (last?.id) setSelectedBlockId(last.id);
                      } catch (e: any) {
                        setError(e?.message ?? String(e));
                      } finally {
                        setCreating(null);
                      }
                    }}
                    className="px-3 py-2 text-xs"
                  >
                    {creating === t ? "Adding..." : `+ ${t}`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-4 lg:h-[calc(100%-92px)] lg:overflow-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    <InsertBlockMenu
                      insertIndex={0}
                      isOpen={insertMenuIndex === 0}
                      onToggle={() => setInsertMenuIndex(insertMenuIndex === 0 ? null : 0)}
                      onInsert={(t) => insertBlockAt(0, t)}
                      disabled={!site || loading || !!creating || !!inserting}
                      inserting={inserting}
                    />

                    {blocks.map((b, idx) => {
                      const insertIndex = idx + 1;

                      return (
                        <div key={b.id} className="space-y-3">
                          <SortableBlockRow
                            block={b}
                            selected={b.id === selectedBlockId}
                            onSelect={() => setSelectedBlockId(b.id)}
                            onToggleVisible={() => toggleVisibility(b)}
                            onDelete={() => removeBlock(b)}
                            disabled={!canAct}
                          />

                          <InsertBlockMenu
                            insertIndex={insertIndex}
                            isOpen={insertMenuIndex === insertIndex}
                            onToggle={() => setInsertMenuIndex(insertMenuIndex === insertIndex ? null : insertIndex)}
                            onInsert={(t) => insertBlockAt(insertIndex, t)}
                            disabled={!site || loading || !!creating || !!inserting}
                            inserting={inserting}
                            showLabel={false}
                            showOnHover
                          />
                        </div>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </Card>

          {/* CENTER: Live preview */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Preview</div>
                <div className="text-xs text-white/50 mt-1">What your public page looks like (live).</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setPreviewCollapsed((v) => !v)} className="px-3 py-2 text-xs">
                  {previewCollapsed ? "Expand" : "Collapse"}
                </Button>

                <Link href={publicUrl} target="_blank" className="inline-flex sm:hidden">
                  <span className="inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/15 transition">
                    Open
                  </span>
                </Link>
              </div>
            </div>

            {!previewCollapsed ? (
              <div className="p-4">
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <SiteShell
                    themeKey={site?.theme_key ?? "midnight"}
                    backgroundStyle={(site?.background_style ?? "solid") as any}
                    buttonStyle={(site?.button_style ?? "solid") as any}
                    fontScale={(site as any)?.font_scale ?? "md"}
                    buttonRadius={(site as any)?.button_radius ?? "2xl"}
                    cardStyle={(site as any)?.card_style ?? "card"}
                    layoutWidth={(site as any)?.layout_width ?? "compact"}
                    themeOverrides={{
                      bg_color: site?.bg_color ?? null,
                      text_color: site?.text_color ?? null,
                      muted_color: site?.muted_color ?? null,
                      border_color: site?.border_color ?? null,
                      button_color: site?.button_color ?? null,
                      button_text_color: site?.button_text_color ?? null,
                    }}
                  >
                    <div className="space-y-4">
                      <BlocksRenderer
                        blocks={(blocks.filter((b) => b.is_visible) as any) ?? []}
                        mode="preview"
                        site={{
                          layout_width: (site as any)?.layout_width ?? "compact",
                          button_style: (site?.button_style ?? "solid") as any,
                        }}
                      />
                    </div>
                  </SiteShell>
                </div>
              </div>
            ) : (
              <div className="p-6 text-sm text-white/50">Preview is collapsed.</div>
            )}
          </Card>

          {/* RIGHT: Inspector (Theme + selected block editor) */}
          <Card className="lg:sticky lg:top-[76px] lg:h-[calc(100vh-96px)] lg:overflow-hidden flex flex-col">
  {/* HEADER — НЕ скроллится */}
  <div className="shrink-0 p-4 border-b border-white/10 bg-black/20">
    <div>
      <div className="text-sm font-semibold">Inspector</div>
      <div className="text-xs text-white/50 mt-1">Edit theme or selected block.</div>
    </div>

    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setInspectorTab("block")}
        className={clsx(
          "rounded-full px-3 py-2 text-xs font-semibold border transition",
          inspectorTab === "block"
            ? "border-white/25 bg-white/10 text-white"
            : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
        )}
      >
        Block
      </button>

      <button
        type="button"
        onClick={() => setInspectorTab("theme")}
        className={clsx(
          "rounded-full px-3 py-2 text-xs font-semibold border transition",
          inspectorTab === "theme"
            ? "border-white/25 bg-white/10 text-white"
            : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
        )}
      >
        Theme
      </button>
    </div>
  </div>

            <div className="p-4 lg:h-[calc(100%-56px)] lg:overflow-auto space-y-4">
              {/* Theme */}
              {/* Theme */}
{inspectorTab === "theme" && (
  <Card className="bg-white/3 shadow-none">

                  <div className="p-4 space-y-4">
                    <div>
                      <div className="text-sm font-semibold">Theme</div>
                      <div className="text-xs text-white/50 mt-1">Styles are saved instantly.</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <div className="text-xs text-white/50 mb-2">Theme</div>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          value={site?.theme_key ?? "midnight"}
                          onChange={async (e) => {
                            if (!site) return;
                            const theme_key = e.target.value;
                            try {
                              await updateSiteTheme(site.id, { theme_key } as any);
                              setSite({ ...site, theme_key });
                            } catch (err: any) {
                              setError(err?.message ?? String(err));
                            }
                          }}
                          disabled={!site || loading}
                        >
                          {THEMES.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <div className="text-xs text-white/50 mb-2">Layout</div>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          value={(site as any)?.layout_width ?? "compact"}
                          onChange={async (e) => {
                            if (!site) return;
                            const layout_width = e.target.value as any;
                            try {
                              await updateSiteTheme(site.id, { layout_width } as any);
                              setSite({ ...(site as any), layout_width } as any);
                            } catch (err: any) {
                              setError(err?.message ?? String(err));
                            }
                          }}
                          disabled={!site || loading}
                        >
                          <option value="compact">Compact</option>
                          <option value="wide">Wide</option>
                          <option value="full">Full</option>
                        </select>
                      </label>

                      <label className="block">
                        <div className="text-xs text-white/50 mb-2">Background</div>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          value={site?.background_style ?? "solid"}
                          onChange={async (e) => {
                            if (!site) return;
                            const background_style = e.target.value;
                            try {
                              await updateSiteTheme(site.id, { background_style } as any);
                              setSite({ ...site, background_style });
                            } catch (err: any) {
                              setError(err?.message ?? String(err));
                            }
                          }}
                          disabled={!site || loading}
                        >
                          <option value="solid">Solid</option>
                          <option value="gradient">Gradient</option>
                          <option value="dots">Dots</option>
                        </select>
                      </label>

                      <label className="block">
                        <div className="text-xs text-white/50 mb-2">Buttons</div>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          value={site?.button_style ?? "solid"}
                          onChange={async (e) => {
                            if (!site) return;
                            const button_style = e.target.value;
                            try {
                              await updateSiteTheme(site.id, { button_style } as any);
                              setSite({ ...site, button_style });
                            } catch (err: any) {
                              setError(err?.message ?? String(err));
                            }
                          }}
                          disabled={!site || loading}
                        >
                          <option value="solid">Solid</option>
                          <option value="outline">Outline</option>
                          <option value="soft">Soft</option>
                        </select>
                      </label>

                      <label className="block">
                        <div className="text-xs text-white/50 mb-2">Font</div>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          value={(site as any)?.font_scale ?? "md"}
                          onChange={async (e) => {
                            if (!site) return;
                            const font_scale = e.target.value;
                            try {
                              await updateSiteTheme(site.id, { font_scale } as any);
                              setSite({ ...(site as any), font_scale } as any);
                            } catch (err: any) {
                              setError(err?.message ?? String(err));
                            }
                          }}
                          disabled={!site || loading}
                        >
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                        </select>
                      </label>

                      <label className="block">
                        <div className="text-xs text-white/50 mb-2">Radius</div>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          value={(site as any)?.button_radius ?? "2xl"}
                          onChange={async (e) => {
                            if (!site) return;
                            const button_radius = e.target.value;
                            try {
                              await updateSiteTheme(site.id, { button_radius } as any);
                              setSite({ ...(site as any), button_radius } as any);
                            } catch (err: any) {
                              setError(err?.message ?? String(err));
                            }
                          }}
                          disabled={!site || loading}
                        >
                          <option value="md">MD</option>
                          <option value="xl">XL</option>
                          <option value="2xl">2XL</option>
                          <option value="full">Full</option>
                        </select>
                      </label>

                      <label className="block">
                        <div className="text-xs text-white/50 mb-2">Card</div>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          value={(site as any)?.card_style ?? "card"}
                          onChange={async (e) => {
                            if (!site) return;
                            const card_style = e.target.value;
                            try {
                              await updateSiteTheme(site.id, { card_style } as any);
                              setSite({ ...(site as any), card_style } as any);
                            } catch (err: any) {
                              setError(err?.message ?? String(err));
                            }
                          }}
                          disabled={!site || loading}
                        >
                          <option value="card">Card</option>
                          <option value="plain">Plain</option>
                        </select>
                      </label>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">Custom colors</div>
                          <div className="text-xs text-white/50 mt-1">Leave empty to use preset theme colors.</div>
                        </div>

                        <Button
                          variant="ghost"
                          disabled={!site || loading}
                          onClick={async () => {
                            if (!site) return;
                            try {
                              await updateSiteTheme(site.id, {
                                bg_color: null,
                                text_color: null,
                                muted_color: null,
                                border_color: null,
                                button_color: null,
                                button_text_color: null,
                              } as any);

                              const nextSite = {
                                ...site,
                                bg_color: null,
                                text_color: null,
                                muted_color: null,
                                border_color: null,
                                button_color: null,
                                button_text_color: null,
                              } as SiteRow;

                              setSite(nextSite);
                              setColors({
                                bg_color: "",
                                text_color: "",
                                muted_color: "",
                                border_color: "",
                                button_color: "",
                                button_text_color: "",
                              });
                            } catch (e: any) {
                              setError(e?.message ?? String(e));
                            }
                          }}
                          className="px-3 py-2 text-xs"
                        >
                          Reset all
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <ColorField
                          label="Background"
                          value={colors.bg_color}
                          onChange={(v) => {
                            setColors((p) => ({ ...p, bg_color: v }));
                            void saveColorField("bg_color", v);
                          }}
                        />
                        <ColorField
                          label="Text"
                          value={colors.text_color}
                          onChange={(v) => {
                            setColors((p) => ({ ...p, text_color: v }));
                            void saveColorField("text_color", v);
                          }}
                        />
                        <ColorField
                          label="Muted text"
                          value={colors.muted_color}
                          onChange={(v) => {
                            setColors((p) => ({ ...p, muted_color: v }));
                            void saveColorField("muted_color", v);
                          }}
                        />
                        <ColorField
                          label="Border"
                          value={colors.border_color}
                          onChange={(v) => {
                            setColors((p) => ({ ...p, border_color: v }));
                            void saveColorField("border_color", v);
                          }}
                        />
                        <ColorField
                          label="Button background"
                          value={colors.button_color}
                          onChange={(v) => {
                            setColors((p) => ({ ...p, button_color: v }));
                            void saveColorField("button_color", v);
                          }}
                        />
                        <ColorField
                          label="Button text"
                          value={colors.button_text_color}
                          onChange={(v) => {
                            setColors((p) => ({ ...p, button_text_color: v }));
                            void saveColorField("button_text_color", v);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Selected block editor */}
              <Card className="bg-white/3 shadow-none">
                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Block editor</div>
                      <div className="text-xs text-white/50 mt-1">
                        {selectedBlock ? (
                          <>
                            Editing:{" "}
                            <span className="text-white/70">
                              {selectedBlock.type} (pos {selectedBlock.position})
                            </span>
                          </>
                        ) : (
                          "Select a block on the left."
                        )}
                      </div>
                    </div>

                    {selectedBlock && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          disabled={!canAct}
                          onClick={() => toggleVisibility(selectedBlock)}
                          className="px-3 py-2 text-xs"
                        >
                          {selectedBlock.is_visible ? "Hide" : "Show"}
                        </Button>
                        <Button
                          variant="danger"
                          disabled={!canAct}
                          onClick={() => removeBlock(selectedBlock)}
                          className="px-3 py-2 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  {!selectedBlock ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                      Click a block in the left panel to edit it here.
                    </div>
                  ) : selectedBlock.type === "hero" ? (
                    <HeroEditor
                      block={selectedBlock}
                      onSave={async (content) => {
                        await updateBlock(selectedBlock.id, { content });
                        const bs = await loadBlocks(site!.id);
                        setBlocks(bs);
                      }}
                    />
                  ) : selectedBlock.type === "links" ? (
                    <LinksEditor
                      block={selectedBlock}
                      onSave={async (content) => {
                        await updateBlock(selectedBlock.id, { content });
                        const bs = await loadBlocks(site!.id);
                        setBlocks(bs);
                      }}
                    />
                  ) : selectedBlock.type === "image" ? (
                    <ImageEditor
                      block={selectedBlock}
                      onSave={async (content) => {
                        await updateBlock(selectedBlock.id, { content });
                        const bs = await loadBlocks(site!.id);
                        setBlocks(bs);
                      }}
                    />
                  ) : selectedBlock.type === "text" ? (
                    <TextEditor
                      block={selectedBlock}
                      onSave={async (content) => {
                        await updateBlock(selectedBlock.id, { content });
                        const bs = await loadBlocks(site!.id);
                        setBlocks(bs);
                      }}
                    />
                  ) : selectedBlock.type === "divider" ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/50 mb-3">Divider block</div>
                      <div className="flex justify-center py-4">
                        <div className="h-px w-24 bg-white/20" />
                      </div>
                      <div className="text-xs text-white/40 mt-2">No settings yet.</div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                      Unknown block type: <span className="text-white/80">{selectedBlock.type}</span>
                    </div>
                  )}
                </div>
              </Card>

              <div className="text-center text-xs text-white/35 pt-2">Powered by Mini-Site Builder</div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
