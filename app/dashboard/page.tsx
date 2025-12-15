"use client";

import * as React from "react";
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
import { CSS } from "@dnd-kit/utilities";

import { BlocksRenderer } from "@/components/blocks/BlocksRenderer";
import InsertBlockMenu, { type BlockType } from "@/components/InsertBlockMenu";
import { THEMES } from "@/lib/themes";
import { SiteShell } from "@/components/site/SiteShell";
import { LinkButton } from "@/components/site/LinkButton";
import { supabase } from "@/lib/supabaseClient";

import {
  HeaderEditor,
  HeroEditor,
  LinksEditor,
  ImageEditor,
  TextEditor,
  DividerEditor,
} from "@/components/dashboard/editors";

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
  vertical_align?: "top" | "center" | "bottom";

  // split hero extras
  image_side?: "left" | "right";
  image_size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

  // background hero extras
  bg_overlay?: "soft" | "medium" | "strong";
  bg_radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  bg_height?: "sm" | "md" | "lg" | "xl";

  // image ratio
  image_ratio?: "auto" | "square" | "4:3" | "16:9" | "3:4" | "9:16";

  // buttons (optional)
  primary_button_title?: string;
  primary_button_url?: string;
  secondary_button_title?: string;
  secondary_button_url?: string;
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

type BlockPatch = Partial<Pick<BlockRow, "content" | "is_visible" | "position" | "variant" | "style">>;

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

async function createBlock(siteId: string, type: BlockType) {
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
    type === "header"
      ? ({
          brand_text: "My Site",
          brand_url: "",
          logo_url: "",
          links: [],
          show_cta: false,
          cta_label: "",
          cta_url: "",
        } as any)
      : type === "hero"
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
                  items: [{ title: "Telegram", url: "https://t.me/yourname", align: "center" }],
                  align: "center",
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

async function updateBlock(blockId: string, patch: BlockPatch) {
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
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
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
        disabled ? "cursor-not-allowed opacity-40 border-white/10 bg-white/5" : "border-white/10 bg-white/5 hover:bg-white/10",
      )}
    >
      {children}
    </button>
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
          {!isValid && <div className="text-xs text-red-300 mt-2">Invalid hex. Use #fff or #ffffff.</div>}
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

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
          selected ? "border-white/25 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10",
          !block.is_visible && "opacity-70",
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-xl border border-white/10 bg-black/30 px-2 py-1 text-xs text-white/70 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            ⠿
          </div>

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

/** (legacy) preview helper left here (harmless), but the preview now uses BlocksRenderer */
function PreviewBlock({ block, buttonStyle }: { block: BlockRow; buttonStyle: any }) {
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

    const titleClass = c.title_size === "sm" ? "text-xl" : c.title_size === "md" ? "text-2xl" : "text-3xl";
    const subtitleClass = c.subtitle_size === "sm" ? "text-sm" : c.subtitle_size === "lg" ? "text-lg" : "text-base";
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
        className="space-y-2 min-w-0"
      >
        <div className={clsx("space-y-1", alignClass, "min-w-0")} style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
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
    const alignClass = c.align === "center" ? "text-center" : c.align === "right" ? "text-right" : "text-left";

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
        <div className={clsx(sizeClass, alignClass, "text-[rgb(var(--text))] whitespace-pre-wrap")}>{text || "Your text here"}</div>
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
            <img src={normalizeUrl(url)} alt={alt || "Image"} className="h-full w-full object-cover" style={{ borderRadius: radius }} />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">Image URL missing / invalid.</div>
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

    const alignWrap = blockAlign === "left" ? "items-start" : blockAlign === "right" ? "items-end" : "items-center";

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
            const perWrap = per === "left" ? "self-start" : per === "right" ? "self-end" : "self-center";
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

  const [creating, setCreating] = useState<BlockType | null>(null);
  const [insertMenuIndex, setInsertMenuIndex] = useState<number | null>(null);
  const [inserting, setInserting] = useState<null | { index: number; type: BlockType }>(null);

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

  async function insertBlockAt(index: number, type: BlockType) {
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

  // ✅ ЕДИНЫЙ onSave для всех editors — больше никакого копипаста и рассинхрона сигнатур
  const saveSelectedBlock = async (next: BlockPatch) => {
    if (!selectedBlock || !site) return;
    await updateBlock(selectedBlock.id, next);
    const bs = await loadBlocks(site.id);
    setBlocks(bs);
  };
  type BlockPatch = Partial<Pick<BlockRow, "content" | "is_visible" | "position" | "variant" | "style">>;

  async function reloadBlocksAfterSave() {
    if (!site) return;
    const bs = await loadBlocks(site.id);
    setBlocks(bs);
  }
  
  const saveSelectedBlockContent = async (next: any) => {
    if (!selectedBlock || !site) return;

    const patch =
      next && typeof next === "object" && ("content" in next || "variant" in next || "style" in next)
        ? (next as BlockPatch)
        : ({ content: next } as BlockPatch);

    await updateBlock(selectedBlock.id, patch);
    await reloadBlocksAfterSave();
  };
  
  const saveSelectedHero = async (next: any) => {
    // next ожидаем как патч (например {content, variant} или {content, variant, style})
    if (!selectedBlock || !site) return;
    await updateBlock(selectedBlock.id, next as BlockPatch);
    await reloadBlocksAfterSave();
  };
  
  return (
    <main className="min-h-screen bg-black text-white">
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

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_380px]">
          {/* LEFT */}
          <Card className="lg:sticky lg:top-[76px] lg:h-[calc(100vh-96px)] lg:overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Blocks</div>
                  <div className="text-xs text-white/50 mt-1">Select a block to edit. Drag to reorder.</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["header", "hero", "links", "image", "text", "divider"] as const).map((t) => (
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

          {/* CENTER */}
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

          {/* RIGHT */}
          <Card className="lg:sticky lg:top-[76px] lg:h-[calc(100vh-96px)] lg:overflow-hidden flex flex-col">
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
              {/* THEME TAB */}
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
                        <div className="text-xs text-white/50 mb-2">Cards</div>
                        <select
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          value={(site as any)?.card_style ?? "card"}
                          onChange={async (e) => {
                            if (!site) return;
                            const card_style = e.target.value as any;
                            try {
                              await updateSiteTheme(site.id, { card_style } as any);
                              setSite({ ...(site as any), card_style } as any);
                            } catch (err: any) {
                              setError(err?.message ?? String(err));
                            }
                          }}
                          disabled={!site || loading}
                        >
                          <option value="plain">Plain</option>
                          <option value="card">Card</option>
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

                              setSite({
                                ...site,
                                bg_color: null,
                                text_color: null,
                                muted_color: null,
                                border_color: null,
                                button_color: null,
                                button_text_color: null,
                              } as SiteRow);

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

              {/* BLOCK TAB */}
              {inspectorTab === "block" && (
                <>
                  {!selectedBlock ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">Select a block</div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          disabled={!canAct}
                          onClick={() => toggleVisibility(selectedBlock)}
                          className="px-3 py-2 text-xs"
                        >
                          {selectedBlock.is_visible ? "Toggle visibility" : "Show"}
                        </Button>

                        <Button
                          variant="ghost"
                          disabled={!canAct}
                          onClick={() => removeBlock(selectedBlock)}
                          className="px-3 py-2 text-xs"
                        >
                          Remove
                        </Button>
                      </div>

                      {selectedBlock.type === "header" ? (
  <HeaderEditor block={selectedBlock as any} onSave={saveSelectedBlockContent} />
) : selectedBlock.type === "hero" ? (
  <HeroEditor block={selectedBlock as any} onSave={saveSelectedHero} />
) : selectedBlock.type === "text" ? (
  <TextEditor block={selectedBlock as any} onSave={saveSelectedBlockContent} />
) : selectedBlock.type === "links" ? (
  <LinksEditor block={selectedBlock as any} onSave={saveSelectedBlockContent} />
) : selectedBlock.type === "image" ? (
  <ImageEditor block={selectedBlock as any} onSave={saveSelectedBlockContent} />
) : selectedBlock.type === "divider" ? (
  <DividerEditor block={selectedBlock as any} onSave={saveSelectedBlockContent} />
) : (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
    No editor wired for:{" "}
    <span className="font-mono">{String((selectedBlock as any).type)}</span>
  </div>
)}
                    </>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
