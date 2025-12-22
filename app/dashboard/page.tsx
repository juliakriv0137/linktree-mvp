"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { applyStylePreset, mergeStyle, normalizeBlockStyle } from "@/lib/blocks/style";
import { Card } from "@/components/dashboard/ui/Card";
import { Button } from "@/components/dashboard/ui/Button";
import { IconButton } from "@/components/dashboard/ui/IconButton";
import { ColorField } from "@/components/dashboard/ui/ColorField";
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
import { supabase } from "@/lib/supabaseClient";

import { DASHBOARD_THEME_VARS } from "@/lib/dashboard/theme";
import { DbSelect } from "@/components/dashboard/ui/DbSelect";
import { DbSummaryButton } from "@/components/dashboard/ui/DbSummaryButton";
import { DbPopoverPanel } from "@/components/dashboard/ui/DbPopoverPanel";
import { DbDetails } from "@/components/dashboard/ui/DbDetails";
import {
  HeaderEditor,
  HeroEditor,
  LinksEditor,
  ImageEditor,
  TextEditor,
  DividerEditor,
} from "@/components/dashboard/editors";

const DASHBOARD_UI_VARS: React.CSSProperties = {
  // Light SaaS dashboard look. Only for /dashboard UI.
  ["--db-bg" as any]: "246 249 252",
  ["--db-panel" as any]: "255 255 255",
  ["--db-soft" as any]: "241 245 249",
  ["--db-border" as any]: "203 213 225",
  ["--db-border-strong" as any]: "148 163 184",
  ["--db-text" as any]: "15 23 42",
  ["--db-muted" as any]: "100 116 139",
  ["--db-accent" as any]: "45 212 191",
  ["--db-accent-weak" as any]: "204 251 241",
  ["--db-ring" as any]: "45 212 191",
  ["--db-radius" as any]: "18px",
};

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
  anchor_id?: string | null;
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

  image_side?: "left" | "right";
  image_size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

  bg_overlay?: "soft" | "medium" | "strong";
  bg_radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  bg_height?: "sm" | "md" | "lg" | "xl";

  image_ratio?: "auto" | "square" | "4:3" | "16:9" | "3:4" | "9:16";

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

type BlockPatch = Partial<
  Pick<BlockRow, "content" | "is_visible" | "position" | "variant" | "style" | "anchor_id">
>;

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safeTrim(v: string) {
  return (v ?? "").trim();
}

function normalizeAnchorId(raw: string) {
  let v = safeTrim(raw).toLowerCase();
  v = v.replace(/^#+/, "");
  v = v.replace(/[\s_]+/g, "-");
  v = v.replace(/[^a-z0-9-]/g, "");
  v = v.replace(/-+/g, "-");
  v = v.replace(/^-+|-+$/g, "");
  return v;
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

function themeLabelFromKey(key: string) {
  const t: any = (THEMES as any)?.[key];
  return String(t?.label ?? t?.name ?? key);
}

function fontScaleLabel(v: SiteRow["font_scale"]) {
  if (v === "sm") return "Small";
  if (v === "lg") return "Large";
  return "Normal";
}

function radiusLabel(v: SiteRow["button_radius"]) {
  if (v === "md") return "12px";
  if (v === "xl") return "18px";
  if (v === "2xl") return "28px";
  return "Pill";
}

function widthLabel(v: SiteRow["layout_width"]) {
  if (v === "wide") return "Wide";
  if (v === "full") return "Full";
  return "Compact";
}

function bgStyleLabel(v: string) {
  if (v === "gradient") return "Gradient";
  return "Solid";
}

function buttonStyleLabel(v: string) {
  if (v === "outline") return "Outline";
  return "Solid";
}

function cardStyleLabel(v: SiteRow["card_style"]) {
  if (v === "plain") return "Plain";
  return "Card";
}

function FieldRow(props: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3">
      <div className="text-xs font-semibold text-[rgb(var(--db-muted))]">{props.label}</div>
      <div className="min-w-0">
        {props.children}
        {props.hint ? (
          <div className="mt-1 text-[11px] text-[rgb(var(--db-muted))]">{props.hint}</div>
        ) : null}
      </div>
    </div>
  );
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

async function createBlock(
  siteId: string,
  type: "header" | "hero" | "links" | "image" | "text" | "divider",
) {
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
          brand_url: "/",
          links: [
            { label: "About", url: "https://example.com" },
            { label: "Contact", url: "https://example.com" },
          ],
          show_cta: false,
          cta_label: "Buy",
          cta_url: "https://example.com",
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

  const insertRow: any = {
    site_id: siteId,
    type,
    content: defaultContent,
    position: nextPos,
    is_visible: true,
  };

  if (type === "header") insertRow.variant = "default";

  const { error } = await supabase.from("site_blocks").insert(insertRow);
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
            ? "border-[rgb(var(--db-accent) / 0.55)] bg-[rgb(var(--db-accent) / 0.14)] shadow-sm"
            : "border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] hover:bg-[rgb(var(--db-soft))]",
          !block.is_visible && "opacity-70",
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-2 py-1 text-xs text-[rgb(var(--db-muted))] cursor-grab active:cursor-grabbing"
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
              <span className="text-xs rounded-full border border-[rgb(var(--db-accent) / 0.35)] bg-[rgb(var(--db-accent) / 0.12)] px-2 py-1 text-[rgb(var(--db-text))]">
                {block.type}
              </span>

              {!block.is_visible && <span className="text-xs text-red-400/80">hidden</span>}
            </div>
            <div className="text-xs text-[rgb(var(--db-muted))] mt-1">pos {block.position}</div>
          </button>

          <div className="flex items-center gap-2">
            <IconButton
              title={block.is_visible ? "Hide" : "Show"}
              onClick={onToggleVisible}
              disabled={disabled}
            >
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteRow | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState<null | BlockType>(null);
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
  const [anchorDraft, setAnchorDraft] = useState("");
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewNonce, setPreviewNonce] = useState(0);

  const [blockTab, setBlockTab] = useState<"content" | "style" | "advanced">("content");

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  );

  const publicUrl = site ? `/${site.slug}` : "/";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const canAct = !!site && !loading && !creating && !inserting;

  async function updateBlock(blockId: string, patch: BlockPatch) {
    if (!site) throw new Error("No site loaded");

    const updates: any = {};
    if ("content" in patch) updates.content = (patch as any).content;
    if ("variant" in patch) updates.variant = (patch as any).variant;
    if ("style" in patch) updates.style = (patch as any).style;
    if ("anchor_id" in patch) updates.anchor_id = (patch as any).anchor_id;
    if ("position" in patch) updates.position = (patch as any).position;
    if ("is_visible" in patch) updates.is_visible = (patch as any).is_visible;

    if (Object.keys(updates).length === 0) return;

    setBlocks((prev) => prev.map((b) => (b.id === blockId ? ({ ...b, ...updates } as any) : b)));

    const { error } = await supabase.from("site_blocks").update(updates).eq("id", blockId);
    if (error) throw error;
  }

  async function saveBlockStyle(blockId: string, nextStyle: any) {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, style: nextStyle } : b)));
    try {
      await updateBlock(blockId, { style: nextStyle } as any);
    } catch (err: any) {
      setError(err?.message ?? String(err));
      if (site) {
        const bs = await loadBlocks(site.id);
        setBlocks(bs);
      }
    }
  }

  async function onApplyStylePreset(presetKey: string) {
    if (!selectedBlock) return;
    const blockId = selectedBlock.id;
    const cur = ((selectedBlock as any).style ?? {}) as any;
    const next = applyStylePreset(cur, presetKey as any);
    await saveBlockStyle(blockId, next);
  }

  async function onPatchBlockStyle(patch: any) {
    if (!selectedBlock) return;
    const blockId = selectedBlock.id;
    const cur = ((selectedBlock as any).style ?? {}) as any;
    const next = mergeStyle(cur, patch);
    await saveBlockStyle(blockId, next);
  }

  function getStyleView() {
    const raw = ((selectedBlock as any)?.style ?? {}) as any;
    const n = normalizeBlockStyle(raw);
    const d: any = { ...n, ...(n as any).desktop };
    const uiWidth = d.width === "content" ? "compact" : (d.width ?? "full");

    return {
      padding: String(d.padding ?? "none"),
      width: String(uiWidth),
      background: String(d.background ?? "none"),
      align: String(d.align ?? "left"),
      radius: String(d.radius ?? "2xl"),
      border: String(d.border ?? "subtle"),
    };
  }

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

      let bs = await loadBlocks(s.id);

      if (!bs.some((b) => b.type === "hero")) {
        await createBlock(s.id, "hero");
        bs = await loadBlocks(s.id);
      }

      setBlocks(bs);

      const firstVisible = bs.find((b) => b.is_visible) ?? bs[0];
      setSelectedBlockId((prev: string | null) => {
        if (prev && bs.some((b) => b.id === prev)) return prev;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAnchorDraft(selectedBlock?.anchor_id ?? "");
    setBlockTab("content");
  }, [selectedBlockId, selectedBlock?.anchor_id]);

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

    const next = arrayMove(blocks, oldIndex, newIndex).map((b) => ({ ...b }));
    const normalized = next.map((b, idx) => ({ ...b, position: idx + 1 }));

    try {
      await persistOrder(normalized);
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

      const next = arrayMove(bs, oldIndex, targetIndex).map((b, idx) => ({
        ...b,
        position: idx + 1,
      }));

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
    key:
      | "bg_color"
      | "text_color"
      | "muted_color"
      | "border_color"
      | "button_color"
      | "button_text_color",
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

      setSelectedBlockId((prev: string | null) => {
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

  async function reloadBlocksAfterSave() {
    if (!site) return;
    const bs = await loadBlocks(site.id);
    setBlocks(bs);
  }

  const saveSelectedBlockContent = async (content: any) => {
    if (!selectedBlock || !site) return;
    try {
      setError(null);
      await updateBlock(selectedBlock.id, { content });
      await reloadBlocksAfterSave();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  const saveSelectedBlockPatch = async (patch: {
    content?: any;
    variant?: any;
    style?: any;
    anchor_id?: string;
  }) => {
    if (!selectedBlock || !site) return;
    try {
      setError(null);
      await updateBlock(selectedBlock.id, patch as any);
      await reloadBlocksAfterSave();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  const saveSelectedHero = async (next: { content?: any; variant?: string }) => {
    if (!selectedBlock || !site) return;

    try {
      setError(null);

      const patch: { content?: any; variant?: string } = {};
      if (next.content !== undefined) patch.content = next.content;
      if (typeof next.variant === "string") patch.variant = next.variant;

      await saveSelectedBlockPatch(patch);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  const themeKeys = Object.keys(THEMES ?? {}) as string[];

  return (
    <main
      className="dashboard-ui min-h-screen bg-[rgb(var(--db-bg))] text-[rgb(var(--db-text))]"
      style={{ ...(DASHBOARD_THEME_VARS as any), ...(DASHBOARD_UI_VARS as any) }}
    >
      {/* ✅ NEW: красивый топ-бар без огромной “капсулы” */}
      <div className="sticky top-0 z-[5000] border-b border-[rgb(var(--db-border))] bg-[rgb(var(--db-bg))]">
        <div className="mx-auto max-w-[1400px] px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: title */}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold">Dashboard</div>
                <span className="hidden sm:inline text-xs rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-2 py-1 text-[rgb(var(--db-muted))]">
                  Mini-site builder (A.1)
                </span>
              </div>
              <div className="text-xs text-[rgb(var(--db-muted))] mt-1 truncate">
                Site: <span className="text-[rgb(var(--db-text))]">{site?.slug ?? "..."}</span>
              </div>
            </div>

            {/* Right: actions + settings */}
            <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
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

                {/* ✅ One neat button -> opens settings panel */}
                <DbDetails>
                  <DbSummaryButton>Site settings</DbSummaryButton>

                  <DbPopoverPanel
  className="fixed right-4 top-[72px] z-[2000] w-[520px] max-w-[92vw]"
  onClick={(e) => e.stopPropagation()}
>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Site settings</div>
                        <div className="text-xs text-[rgb(var(--db-muted))] mt-1">
                          Layout + theme. Colors are optional overrides.
                        </div>
                      </div>

                      <Link href={publicUrl} target="_blank" className="shrink-0">
                        <span className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-xs font-semibold text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-panel))] transition">
                          Open page ↗
                        </span>
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-4">
                        <div className="text-xs font-semibold text-[rgb(var(--db-muted))] mb-3">
                          Layout
                        </div>

                        <div className="space-y-3">
                          <FieldRow label="Theme">
                            <DbSelect
                              value={site?.theme_key ?? "midnight"}
                              disabled={!canAct}
                              onChange={async (e) => {
                                if (!site) return;
                                const theme_key = (e.target as HTMLSelectElement).value;
                                try {
                                  setError(null);
                                  await updateSiteTheme(site.id, { theme_key } as any);
                                  setSite({ ...site, theme_key } as any);
                                } catch (err: any) {
                                  setError(err?.message ?? String(err));
                                }
                              }}
                            >
                              {(themeKeys.length ? themeKeys : ["midnight"]).map((k) => (
                                <option key={k} value={k}>
                                  {themeLabelFromKey(k)}
                                </option>
                              ))}
                            </DbSelect>
                          </FieldRow>

                          <FieldRow label="Width">
                            <DbSelect
                              value={(site?.layout_width ?? "compact") as any}
                              disabled={!canAct}
                              onChange={async (e) => {
                                if (!site) return;
                                const layout_width = (e.target as HTMLSelectElement).value as any;
                                try {
                                  setError(null);
                                  await updateSiteTheme(site.id, { layout_width } as any);
                                  setSite({ ...site, layout_width } as any);
                                } catch (err: any) {
                                  setError(err?.message ?? String(err));
                                }
                              }}
                            >
                              <option value="compact">{widthLabel("compact")}</option>
                              <option value="wide">{widthLabel("wide")}</option>
                              <option value="full">{widthLabel("full")}</option>
                            </DbSelect>
                          </FieldRow>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-4">
                        <div className="text-xs font-semibold text-[rgb(var(--db-muted))] mb-3">
                          Style
                        </div>

                        <div className="space-y-3">
                          <FieldRow label="Background">
                            <DbSelect
                              value={(site?.background_style ?? "solid") as any}
                              disabled={!canAct}
                              onChange={async (e) => {
                                if (!site) return;
                                const background_style = (e.target as HTMLSelectElement).value as any;
                                try {
                                  setError(null);
                                  await updateSiteTheme(site.id, { background_style } as any);
                                  setSite({ ...site, background_style } as any);
                                } catch (err: any) {
                                  setError(err?.message ?? String(err));
                                }
                              }}
                            >
                              <option value="solid">{bgStyleLabel("solid")}</option>
                              <option value="gradient">{bgStyleLabel("gradient")}</option>
                            </DbSelect>
                          </FieldRow>

                          <FieldRow label="Buttons">
                            <DbSelect
                              value={(site?.button_style ?? "solid") as any}
                              disabled={!canAct}
                              onChange={async (e) => {
                                if (!site) return;
                                const button_style = (e.target as HTMLSelectElement).value as any;
                                try {
                                  setError(null);
                                  await updateSiteTheme(site.id, { button_style } as any);
                                  setSite({ ...site, button_style } as any);
                                } catch (err: any) {
                                  setError(err?.message ?? String(err));
                                }
                              }}
                            >
                              <option value="solid">{buttonStyleLabel("solid")}</option>
                              <option value="outline">{buttonStyleLabel("outline")}</option>
                            </DbSelect>
                          </FieldRow>

                          <FieldRow label="Text">
                            <DbSelect
                              value={(site?.font_scale ?? "md") as any}
                              disabled={!canAct}
                              onChange={async (e) => {
                                if (!site) return;
                                const font_scale = (e.target as HTMLSelectElement).value as any;
                                try {
                                  setError(null);
                                  await updateSiteTheme(site.id, { font_scale } as any);
                                  setSite({ ...site, font_scale } as any);
                                } catch (err: any) {
                                  setError(err?.message ?? String(err));
                                }
                              }}
                            >
                              <option value="sm">{fontScaleLabel("sm")}</option>
                              <option value="md">{fontScaleLabel("md")}</option>
                              <option value="lg">{fontScaleLabel("lg")}</option>
                            </DbSelect>
                          </FieldRow>

                          <FieldRow label="Radius">
                            <DbSelect
                              value={(site?.button_radius ?? "2xl") as any}
                              disabled={!canAct}
                              onChange={async (e) => {
                                if (!site) return;
                                const button_radius = (e.target as HTMLSelectElement).value as any;
                                try {
                                  setError(null);
                                  await updateSiteTheme(site.id, { button_radius } as any);
                                  setSite({ ...site, button_radius } as any);
                                } catch (err: any) {
                                  setError(err?.message ?? String(err));
                                }
                              }}
                            >
                              <option value="md">{radiusLabel("md")}</option>
                              <option value="xl">{radiusLabel("xl")}</option>
                              <option value="2xl">{radiusLabel("2xl")}</option>
                              <option value="full">{radiusLabel("full")}</option>
                            </DbSelect>
                          </FieldRow>

                          <FieldRow label="Cards">
                            <DbSelect
                              value={(site?.card_style ?? "card") as any}
                              disabled={!canAct}
                              onChange={async (e) => {
                                if (!site) return;
                                const card_style = (e.target as HTMLSelectElement).value as any;
                                try {
                                  setError(null);
                                  await updateSiteTheme(site.id, { card_style } as any);
                                  setSite({ ...site, card_style } as any);
                                } catch (err: any) {
                                  setError(err?.message ?? String(err));
                                }
                              }}
                            >
                              <option value="plain">{cardStyleLabel("plain")}</option>
                              <option value="card">{cardStyleLabel("card")}</option>
                            </DbSelect>
                          </FieldRow>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold text-[rgb(var(--db-muted))]">
                              Colors (optional)
                            </div>
                            <div className="text-[11px] text-[rgb(var(--db-muted))] mt-1">
                              Leave empty to use theme defaults.
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-xs font-semibold text-[rgb(var(--db-muted))] hover:text-[rgb(var(--db-text))]"
                            onClick={() => {
                              setColors({
                                bg_color: "",
                                text_color: "",
                                muted_color: "",
                                border_color: "",
                                button_color: "",
                                button_text_color: "",
                              });
                              if (site) {
                                void (async () => {
                                  try {
                                    setError(null);
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
                                    } as any);
                                  } catch (err: any) {
                                    setError(err?.message ?? String(err));
                                  }
                                })();
                              }
                            }}
                          >
                            Reset
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <ColorField
                            label="Background"
                            value={colors.bg_color}
                            onChange={(v) => {
                              setColors((p) => ({ ...p, bg_color: v }));
                              saveColorField("bg_color", v);
                            }}
                          />
                          <ColorField
                            label="Text"
                            value={colors.text_color}
                            onChange={(v) => {
                              setColors((p) => ({ ...p, text_color: v }));
                              saveColorField("text_color", v);
                            }}
                          />
                          <ColorField
                            label="Muted"
                            value={colors.muted_color}
                            onChange={(v) => {
                              setColors((p) => ({ ...p, muted_color: v }));
                              saveColorField("muted_color", v);
                            }}
                          />
                          <ColorField
                            label="Border"
                            value={colors.border_color}
                            onChange={(v) => {
                              setColors((p) => ({ ...p, border_color: v }));
                              saveColorField("border_color", v);
                            }}
                          />
                          <ColorField
                            label="Button"
                            value={colors.button_color}
                            onChange={(v) => {
                              setColors((p) => ({ ...p, button_color: v }));
                              saveColorField("button_color", v);
                            }}
                          />
                          <ColorField
                            label="Button text"
                            value={colors.button_text_color}
                            onChange={(v) => {
                              setColors((p) => ({ ...p, button_text_color: v }));
                              saveColorField("button_text_color", v);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </DbPopoverPanel>
                </DbDetails>
              </div>

              <Link href={publicUrl} target="_blank" className="hidden sm:inline-flex">
                <span className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-[rgb(var(--db-soft))] hover:bg-[rgb(var(--db-panel))] transition border border-[rgb(var(--db-border))]">
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

      {/* body */}
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_380px]">
          {/* LEFT */}
          <Card className="lg:sticky lg:top-[76px] lg:h-[calc(100vh-96px)] lg:overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[rgb(var(--db-border))]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Blocks</div>
                  <div className="text-xs text-[rgb(var(--db-muted))] mt-1">
                    Select a block to edit. Drag to reorder.
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["header", "hero", "links", "image", "text", "divider"] as const).map((t) => {
                  const isBusy = creating === t;

                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={!site || loading || !!creating || !!inserting}
                      onClick={async () => {
                        if (!site) return;
                        setCreating(t);
                        try {
                          await createBlock(site.id, t);
                          const bs = await loadBlocks(site.id);
                          setBlocks(bs);
                          const last = bs.reduce(
                            (acc, cur) => (cur.position > acc.position ? cur : acc),
                            bs[0],
                          );
                          if (last?.id) setSelectedBlockId(last.id);
                        } catch (e: any) {
                          setError(e?.message ?? String(e));
                        } finally {
                          setCreating(null);
                        }
                      }}
                      className={clsx(
                        "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition",
                        "border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] text-[rgb(var(--db-text))] shadow-sm",
                        "hover:bg-[rgb(var(--db-soft))] hover:border-[rgb(var(--db-accent)/0.55)]",
                        "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        isBusy && "border-[rgb(var(--db-accent)/0.65)] bg-[rgb(var(--db-accent)/0.12)]",
                      )}
                      title={`Add ${t} block`}
                    >
                      <span className="text-sm leading-none">＋</span>
                      <span className="capitalize">{isBusy ? "Adding..." : t}</span>
                    </button>
                  );
                })}
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
                      showLabel={true}
                      showOnHover={false}
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
                            disabled={canAct ? false : true}
                          />

                          <InsertBlockMenu
                            insertIndex={insertIndex}
                            isOpen={insertMenuIndex === insertIndex}
                            onToggle={() =>
                              setInsertMenuIndex(insertMenuIndex === insertIndex ? null : insertIndex)
                            }
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
          <Card>
            <div className="p-4 border-b border-[rgb(var(--db-border))] flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Preview</div>
                <div className="text-xs text-[rgb(var(--db-muted))] mt-1">
                  What your public page looks like (live).
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDevice("desktop");
                      setPreviewNonce(Date.now());
                    }}
                    className={clsx(
                      "rounded-full px-3 py-2 text-xs font-semibold transition border",
                      "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
                      previewDevice === "desktop"
                        ? "border-[rgb(var(--db-accent)/0.55)] bg-[rgb(var(--db-accent-weak))] text-[rgb(var(--db-text))]"
                        : "border-transparent bg-transparent text-[rgb(var(--db-muted))] hover:text-[rgb(var(--db-text))] hover:border-[rgb(var(--db-border))] hover:bg-[rgb(var(--db-soft))]",
                    )}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDevice("mobile");
                      setPreviewNonce(Date.now());
                    }}
                    className={clsx(
                      "rounded-full px-3 py-2 text-xs font-semibold transition border",
                      "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
                      previewDevice === "mobile"
                        ? "border-[rgb(var(--db-accent)/0.55)] bg-[rgb(var(--db-accent-weak))] text-[rgb(var(--db-text))]"
                        : "border-transparent bg-transparent text-[rgb(var(--db-muted))] hover:text-[rgb(var(--db-text))] hover:border-[rgb(var(--db-border))] hover:bg-[rgb(var(--db-soft))]",
                    )}
                  >
                    Mobile
                  </button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setPreviewCollapsed((v) => !v)}
                  className="px-3 py-2 text-xs"
                >
                  {previewCollapsed ? "Expand" : "Collapse"}
                </Button>

                <Link href={publicUrl} target="_blank" className="inline-flex sm:hidden">
                  <span className="inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold bg-[rgb(var(--db-soft))] hover:bg-[rgb(var(--db-panel))] transition border border-[rgb(var(--db-border))]">
                    Open
                  </span>
                </Link>
              </div>
            </div>

            {!previewCollapsed ? (
              <div className="p-4">
                <div
                  className={clsx(
                    "relative isolate z-0 mx-auto overflow-hidden rounded-2xl border border-[rgb(var(--db-border))]",
                    previewDevice === "mobile" ? "w-[390px] max-w-full" : "w-full",
                  )}
                >
                  {previewDevice === "mobile" ? (
                    <iframe
                      title="Mobile preview"
                      src={`${publicUrl}?preview=${previewNonce}`}
                      className="h-[760px] w-[390px] max-w-full rounded-2xl"
                    />
                  ) : (
                    <SiteShell
                        data-preview="true"
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
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-sm text-[rgb(var(--db-muted))]">Preview is collapsed.</div>
            )}
          </Card>

          {/* RIGHT (Inspector) */}
          <Card className="lg:sticky lg:top-[76px] lg:h-[calc(100vh-96px)] lg:overflow-auto">
            <div className="p-4 border-b border-[rgb(var(--db-border))]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Inspector</div>
                  <div className="text-xs text-[rgb(var(--db-muted))] mt-1">
                    Selected block settings
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {!selectedBlock ? (
                <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 text-[rgb(var(--db-text))]">
                  Select a block on the left to edit.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-1">
                    <button
                      type="button"
                      onClick={() => setBlockTab("style")}
                      className={clsx(
                        "rounded-full px-3 py-2 text-xs font-semibold transition border border-transparent",
                        blockTab === "style"
                          ? "bg-[rgb(var(--db-accent) / 0.14)] text-[rgb(var(--db-text))] border border-[rgb(var(--db-accent) / 0.35)]"
                          : "text-[rgb(var(--db-muted))] hover:text-[rgb(var(--db-text))]",
                      )}
                    >
                      Style
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlockTab("content")}
                      className={clsx(
                        "rounded-full px-3 py-2 text-xs font-semibold transition border border-transparent",
                        blockTab === "content"
                          ? "bg-[rgb(var(--db-accent) / 0.14)] text-[rgb(var(--db-text))] border border-[rgb(var(--db-accent) / 0.35)]"
                          : "text-[rgb(var(--db-muted))] hover:text-[rgb(var(--db-text))]",
                      )}
                    >
                      Content
                    </button>

                    <button
                      type="button"
                      onClick={() => setBlockTab("advanced")}
                      className={clsx(
                        "rounded-full px-3 py-2 text-xs font-semibold transition border border-transparent",
                        blockTab === "advanced"
                          ? "bg-[rgb(var(--db-accent) / 0.14)] text-[rgb(var(--db-text))] border border-[rgb(var(--db-accent) / 0.35)]"
                          : "text-[rgb(var(--db-muted))] hover:text-[rgb(var(--db-text))]",
                      )}
                    >
                      Advanced
                    </button>
                  </div>

                  {blockTab === "advanced" && (
                    <Card className="bg-[rgb(var(--db-soft))] shadow-none">
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold">Selected</div>
                            <div className="text-xs text-[rgb(var(--db-muted))] mt-1 truncate">
                              {selectedBlock.type} · id{" "}
                              <span className="font-mono text-[rgb(var(--db-text))]">
                                {selectedBlock.id}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            className="px-3 py-2 text-xs"
                            disabled={!canAct}
                            onClick={async () => {
                              if (!site || !selectedBlock) return;
                              const normalized = normalizeAnchorId(anchorDraft);
                              try {
                                setError(null);
                                await updateBlock(selectedBlock.id, { anchor_id: normalized || null });
                                await reloadBlocksAfterSave();
                                setAnchorDraft(normalized);
                              } catch (err: any) {
                                setError(err?.message ?? String(err));
                              }
                            }}
                          >
                            Save anchor
                          </Button>
                        </div>

                        <label className="block">
                          <div className="text-xs text-[rgb(var(--db-muted))] mb-2">
                            anchor_id (optional)
                          </div>
                          <input
                            value={anchorDraft}
                            disabled={!canAct}
                            onChange={(e) => setAnchorDraft(e.target.value)}
                            placeholder="e.g. about / pricing / faq"
                            className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent) / 0.30)]"
                          />
                          <div className="text-xs text-[rgb(var(--db-muted))] mt-2">
                            Use in links as{" "}
                            <span className="font-mono text-[rgb(var(--db-text))]">#anchor</span>{" "}
                            (e.g. <span className="font-mono text-[rgb(var(--db-text))]">/#about</span>).
                          </div>
                        </label>
                      </div>
                    </Card>
                  )}

                  {blockTab === "style" && (
                    <Card className="bg-[rgb(var(--db-soft))] shadow-none">
                      <div className="p-4 space-y-3">
                        {selectedBlock && (selectedBlock as any).type === "header" ? (
                          <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-3 space-y-3">
                            <div className="text-sm font-semibold">Header style</div>

                            <div>
                              <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Variant</div>
                              <select
                                disabled={!canAct}
                                className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent) / 0.30)] disabled:opacity-50"
                                value={
                                  (((selectedBlock as any).variant ?? "default") as any) === "centered"
                                    ? "centered"
                                    : "default"
                                }
                                onChange={(e) => saveSelectedBlockPatch({ variant: e.target.value as any })}
                              >
                                <option value="default">Default</option>
                                <option value="centered">Centered</option>
                              </select>
                              <div className="text-xs text-[rgb(var(--db-muted))] mt-2">
                                Variant — стиль/компоновка блока (site_blocks.variant).
                              </div>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2">
                              <div className="text-sm font-medium">Full width (edge-to-edge)</div>
                              <input
                                disabled={!canAct}
                                type="checkbox"
                                checked={Boolean(((selectedBlock as any)?.style as any)?.full_bleed)}
                                onChange={(e) => onPatchBlockStyle({ full_bleed: e.target.checked })}
                              />
                            </div>
                            <div className="text-xs text-[rgb(var(--db-muted))]">
                              Делает хедер на всю ширину. Это style (site_blocks.style.full_bleed).
                            </div>
                          </div>
                        ) : null}

                        <div>
                          <div className="text-sm font-semibold">Block style</div>
                          <div className="text-xs text-[rgb(var(--db-muted))] mt-1">
                            Applies to this block (via BlockFrame).
                          </div>
                        </div>

                        <div className="mt-2">
                          <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Presets</div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              ["card", "Card"],
                              ["minimal", "Minimal"],
                              ["wide_section", "Wide section"],
                              ["centered", "Centered"],
                              ["hero_highlight", "Hero highlight"],
                            ].map(([k, label]) => (
                              <button
                                key={String(k)}
                                type="button"
                                disabled={!canAct}
                                className="rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-xs font-semibold text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-panel))] disabled:opacity-40"
                                onClick={() => onApplyStylePreset(String(k))}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="block">
                            <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Padding</div>
                            <select
                              className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm"
                              value={getStyleView().padding}
                              disabled={!canAct}
                              onChange={(e) => onPatchBlockStyle({ padding: e.target.value })}
                            >
                              <option value="none">None</option>
                              <option value="sm">Small</option>
                              <option value="md">Medium</option>
                              <option value="lg">Large</option>
                            </select>
                          </label>

                          <label className="block">
                            <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Width</div>
                            <select
                              className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm"
                              value={getStyleView().width}
                              disabled={!canAct}
                              onChange={(e) => {
                                const v = e.target.value === "compact" ? "content" : e.target.value;
                                onPatchBlockStyle({ width: v });
                              }}
                            >
                              <option value="compact">Compact</option>
                              <option value="wide">Wide</option>
                              <option value="full">Full</option>
                            </select>
                          </label>

                          <label className="block sm:col-span-2">
                            <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Background</div>
                            <select
                              className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm"
                              value={getStyleView().background}
                              disabled={!canAct}
                              onChange={(e) => onPatchBlockStyle({ background: e.target.value })}
                            >
                              <option value="none">None</option>
                              <option value="card">Card</option>
                              <option value="highlight">Highlight</option>
                            </select>
                          </label>

                          <label className="block">
                            <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Align</div>
                            <select
                              className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm"
                              value={getStyleView().align}
                              disabled={!canAct}
                              onChange={(e) => onPatchBlockStyle({ align: e.target.value })}
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </label>

                          <label className="block">
                            <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Radius</div>
                            <select
                              className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm"
                              value={getStyleView().radius}
                              disabled={!canAct}
                              onChange={(e) => onPatchBlockStyle({ radius: e.target.value })}
                            >
                              <option value="none">None</option>
                              <option value="sm">Small</option>
                              <option value="md">Medium</option>
                              <option value="lg">Large</option>
                              <option value="xl">XL</option>
                              <option value="2xl">2XL</option>
                            </select>
                          </label>

                          <label className="block sm:col-span-2">
                            <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Border</div>
                            <select
                              className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm"
                              value={getStyleView().border}
                              disabled={!canAct}
                              onChange={(e) => onPatchBlockStyle({ border: e.target.value })}
                            >
                              <option value="none">None</option>
                              <option value="subtle">Subtle</option>
                              <option value="strong">Strong</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    </Card>
                  )}

                  {blockTab === "content" &&
                    (selectedBlock.type === "header" ? (
                      <HeaderEditor
                        block={selectedBlock as any}
                        onSave={(next) => saveSelectedBlockPatch({ content: next })}
                      />
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
                      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 text-[rgb(var(--db-text))]">
                        No editor wired for:{" "}
                        <span className="font-mono">{String((selectedBlock as any).type)}</span>
                      </div>
                    ))}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
