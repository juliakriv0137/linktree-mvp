"use client";

import * as React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";

import { applyStylePreset, mergeStyle, normalizeBlockStyle } from "@/lib/blocks/style";
import { Card } from "@/components/dashboard/ui/Card";
import { Button } from "@/components/dashboard/ui/Button";
import { IconButton } from "@/components/dashboard/ui/IconButton";
import { ColorField } from "@/components/dashboard/ui/ColorField";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
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
import { ThemeInspector } from "@/components/dashboard/inspector/ThemeInspector";






import {
  HeaderEditor,
  HeroEditor,
  LinksEditor,
  ImageEditor,
  TextEditor,
  DividerEditor,
  ProductsEditor,
} from "@/components/dashboard/editors";





const HEADER_PILL =
  "inline-flex items-center justify-center h-9 px-4 rounded-full " +
  "border border-[rgb(var(--db-border))] text-sm font-semibold " +
  "bg-white text-[rgb(var(--db-text))] transition " +
  "hover:bg-[rgb(var(--db-soft))] hover:text-[rgb(var(--db-text))] " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

/* -------------------------------------------------------------------------------------------------
 * Dashboard UI vars (only for /dashboard)
 * ------------------------------------------------------------------------------------------------- */
const DASHBOARD_UI_VARS: React.CSSProperties = {
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

/* -------------------------------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------------------------------- */
type SiteRow = {
  id: string;
  owner_id: string;
  slug: string;
  name: string | null;
  theme: any;

  theme_key: string;
  background_style: string;
  button_style: string;
  layout_width: "compact" | "wide" | "xwide" | "xxwide" | "full";


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
  page_id: string | null;
  type: string;
  variant?: string | null;
  style?: Record<string, unknown> | null;
  content: any;
  position: number;
  is_visible: boolean;
  anchor_id?: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  site_id: string;
  owner_id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
  currency: string;
  price_cents: number | null;
  compare_at_cents: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type PageRow = {
  id: string;
  site_id: string;
  slug: string | null;
  title: string;
  sort_order: number;
  is_published: boolean;

  nav_anchor: string | null;
  nav_order: number;
  show_in_nav: boolean;

  created_at: string;
  updated_at: string;
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
  Pick<BlockRow, "content" | "is_visible" | "position" | "variant" | "style" | "anchor_id" | "page_id">
>;

/* -------------------------------------------------------------------------------------------------
 * Small helpers
 * ------------------------------------------------------------------------------------------------- */
function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function safeTrim(v: any) {
  return String(v ?? "").trim();
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

/* -------------------------------------------------------------------------------------------------
 * UI atoms (inside the same file so ничего не теряем)
 * ------------------------------------------------------------------------------------------------- */
function FieldRow(props: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3">
      <div className="text-xs font-semibold text-[rgb(var(--db-muted))]">{props.label}</div>
      <div className="min-w-0">
        {props.children}
        {props.hint ? <div className="mt-1 text-[11px] text-[rgb(var(--db-muted))]">{props.hint}</div> : null}
      </div>
    </div>
  );
}

function PaletteColorField(props: {
  label: string;
  value: string; // "" => inherit
  disabled?: boolean;
  onChange: (next: string) => void;
  hint?: string;
}) {
  const raw = String(props.value ?? "");
  const normalized = normalizeHexOrNull(raw);
  const pickerValue = normalized ?? "#000000";

  return (
    <FieldRow label={props.label} hint={props.hint}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={pickerValue}
          disabled={props.disabled}
          onChange={(e) => props.onChange((e.target as HTMLInputElement).value)}
          className="h-10 w-14 rounded-xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-1 disabled:opacity-50"
        />
        <input
          value={raw}
          disabled={props.disabled}
          onChange={(e) => props.onChange((e.target as HTMLInputElement).value)}
          placeholder="#RRGGBB"
          className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent) / 0.30)] disabled:opacity-50"
        />
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => props.onChange("")}
          className="shrink-0 rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-xs font-semibold text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-panel))] disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </FieldRow>
  );
}

function Section({
    title,
    description,
    children,
    defaultOpen = true,
    collapsible = true,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    collapsible?: boolean;
  }) {
    const [open, setOpen] = React.useState<boolean>(defaultOpen);

    // Non-collapsible section (used where we never want collapses, e.g. Inspector)
    if (!collapsible) {
      return (
        <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] overflow-hidden">
          <div className="px-4 py-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{title}</div>
              {description ? <div className="text-xs text-[rgb(var(--db-muted))] mt-1">{description}</div> : null}
            </div>
          </div>
          <div className="px-4 pb-4">{children}</div>
        </div>
      );
    }

    // Collapsible section (details/summary)
    return (
      <details
        open={open}
        onToggle={(e) => {
          const el = e.currentTarget as HTMLDetailsElement;
          setOpen(el.open);
        }}
        className="group rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] overflow-hidden"
      >
        <summary className="cursor-pointer list-none select-none px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">{title}</div>
            {description ? <div className="text-xs text-[rgb(var(--db-muted))] mt-1">{description}</div> : null}
          </div>
          <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] text-xs text-[rgb(var(--db-muted))] group-open:rotate-180 transition">
            ▾
          </span>
        </summary>
        <div className="px-4 pb-4">{children}</div>
      </details>
    );
  }


/* -------------------------------------------------------------------------------------------------
 * Supabase / data ops
 * ------------------------------------------------------------------------------------------------- */
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

async function createBlock(
  siteId: string,
  pageId: string,
  type: "header" | "hero" | "links" | "image" | "text" | "divider" | "products",
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
              : type === "products"
                ? ({
                    title: "Products",
                    subtitle: "Pick what you like",
                    source: "all",
                    show_prices: true,
                    show_images: true,
                  } as any)
                : ({
                    items: [{ title: "Telegram", url: "https://t.me/yourname", align: "center" }],
                    align: "center",
                  } satisfies LinksContent);

  const insertRow: any = {
    site_id: siteId,
    page_id: type === "header" ? null : pageId,
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

/* -------------------------------------------------------------------------------------------------
 * Sortable block row
 * ------------------------------------------------------------------------------------------------- */
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
              {block.page_id === null && block.type === "header" ? (
                <span className="text-[11px] text-[rgb(var(--db-muted))]">global</span>
              ) : null}
            </div>
            <div className="text-xs text-[rgb(var(--db-muted))] mt-1">
              pos {block.position}
              {block.anchor_id ? (
                <>
                  {" · "}#{block.anchor_id}
                </>
              ) : null}
            </div>
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

/* -------------------------------------------------------------------------------------------------
 * Dashboard
 * ------------------------------------------------------------------------------------------------- */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteRow | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pages
  const [pages, setPages] = useState<PageRow[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Left: block list actions
  const [creating, setCreating] = useState<null | BlockType>(null);
  const [insertMenuIndex, setInsertMenuIndex] = useState<number | null>(null);
  const [inserting, setInserting] = useState<null | { index: number; type: BlockType }>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Inspector
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [blockTab, setBlockTab] = useState<"content" | "style" | "advanced">("content");
  const [anchorDraft, setAnchorDraft] = useState("");

  // Site settings
  const [colors, setColors] = useState({
    bg_color: "",
    text_color: "",
    muted_color: "",
    border_color: "",
    button_color: "",
    button_text_color: "",
  });

  // Preview
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewNonce, setPreviewNonce] = useState(0);

  // Dashboard top tab (Blocks / Products)
  const [dashboardTab, setDashboardTab] = React.useState<"blocks" | "products">("blocks");

  // Products
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsErr, setProductsErr] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [productDraft, setProductDraft] = React.useState<{
    title: string;
    price_cents: number | null;
    sort_order: number;
    is_active: boolean;
    subtitle: string;
    external_url: string;
    image_url: string;
  }>({
    title: "",
    price_cents: null,
    sort_order: 100,
    is_active: true,
    subtitle: "",
    external_url: "",
    image_url: "",
  });

  // Page settings drafts
  const selectedPage = useMemo(() => pages.find((p) => p.id === selectedPageId) ?? null, [pages, selectedPageId]);
  const [pageTitleDraft, setPageTitleDraft] = useState("");
  const [pageAnchorDraft, setPageAnchorDraft] = useState("");
  const [pageShowInNavDraft, setPageShowInNavDraft] = useState(true);

  useEffect(() => {
    setPageTitleDraft(selectedPage?.title ?? "");
    setPageAnchorDraft(selectedPage?.nav_anchor ?? "");
    setPageShowInNavDraft(Boolean(selectedPage?.show_in_nav ?? true));
  }, [selectedPageId, selectedPage?.title, selectedPage?.nav_anchor, selectedPage?.show_in_nav]);

  const publicUrl = site ? `/${site.slug}` : "/";

  const canAct = !!site && !loading && !creating && !inserting;

  const byPos = useCallback(
    (a: any, b: any) =>
      (Number(a.position ?? 0) - Number(b.position ?? 0)) || String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")),
    [],
  );

  const blocksForPage = useMemo(() => {
    const globalHeader = blocks
      .filter((b: any) => b.type === "header" && (b.page_id ?? null) === null)
      .slice()
      .sort(byPos);

    if (!selectedPageId) return globalHeader;

    const pageBlocks = blocks
      .filter((b: any) => b.page_id === selectedPageId && b.type !== "header")
      .slice()
      .sort(byPos);

    return [...globalHeader, ...pageBlocks];
  }, [blocks, selectedPageId, byPos]);

  const selectedBlock = useMemo(() => blocksForPage.find((b) => b.id === selectedBlockId) ?? null, [blocksForPage, selectedBlockId]);

  // Keep inspector state aligned with selection
  useEffect(() => {
    setAnchorDraft(selectedBlock?.anchor_id ?? "");
    setBlockTab("content");
  }, [selectedBlockId, selectedBlock?.anchor_id]);

  // When switching page: clear selection (you wanted this behavior)
  useEffect(() => {
    setSelectedBlockId(null);
  }, [selectedPageId]);

  /* ---------------------------------------------
   * DB actions (block/theme/page/products)
   * --------------------------------------------- */
  const updateBlock = useCallback(
    async (blockId: string, patch: BlockPatch) => {
      if (!site) throw new Error("No site loaded");

      const updates: any = {};
      if ("content" in patch) updates.content = (patch as any).content;
      if ("variant" in patch) updates.variant = (patch as any).variant;
      if ("style" in patch) updates.style = (patch as any).style;
      if ("page_id" in patch) updates.page_id = (patch as any).page_id;
      if ("anchor_id" in patch) updates.anchor_id = (patch as any).anchor_id;
      if ("position" in patch) updates.position = (patch as any).position;
      if ("is_visible" in patch) updates.is_visible = (patch as any).is_visible;

      if (Object.keys(updates).length === 0) return;

      // optimistic
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? ({ ...b, ...updates } as any) : b)));

      const { error } = await supabase.from("site_blocks").update(updates).eq("id", blockId);
      if (error) throw error;
    },
    [site],
  );

  const reloadBlocksAfterSave = useCallback(async () => {
    if (!site) return;
    const bs = await loadBlocks(site.id);
    setBlocks(bs);
  }, [site]);

  const saveSelectedBlockPatch = useCallback(
    async (patch: { content?: any; variant?: any; style?: any; anchor_id?: string }) => {
      if (!selectedBlock || !site) return;
      try {
        setError(null);
        await updateBlock(selectedBlock.id, patch as any);
        await reloadBlocksAfterSave();
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    },
    [selectedBlock, site, updateBlock, reloadBlocksAfterSave],
  );

  const saveSelectedBlockContent = useCallback(
    async (content: any) => {
      await saveSelectedBlockPatch({ content });
    },
    [saveSelectedBlockPatch],
  );

  const saveBlockStyle = useCallback(
    async (blockId: string, nextStyle: any) => {
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
    },
    [site, updateBlock],
  );

  const onApplyStylePreset = useCallback(
    async (presetKey: string) => {
      if (!selectedBlock) return;
      const blockId = selectedBlock.id;
      const cur = ((selectedBlock as any).style ?? {}) as any;
      const next = applyStylePreset(cur, presetKey as any);
      await saveBlockStyle(blockId, next);
    },
    [selectedBlock, saveBlockStyle],
  );

  const onPatchBlockStyle = useCallback(
    async (patch: any) => {
      if (!selectedBlock) return;
      const blockId = selectedBlock.id;
      const cur = ((selectedBlock as any).style ?? {}) as any;
      const next = mergeStyle(cur, patch);
      await saveBlockStyle(blockId, next);
    },
    [selectedBlock, saveBlockStyle],
  );

  const getStyleView = useCallback(() => {
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
  }, [selectedBlock]);

  const saveColorField = useCallback(
    async (
      key: "bg_color" | "text_color" | "muted_color" | "border_color" | "button_color" | "button_text_color",
      rawValue: string,
    ) => {
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
    },
    [site],
  );

  const toggleVisibility = useCallback(
    async (block: BlockRow) => {
      if (!site) return;
      setError(null);
      try {
        await updateBlock(block.id, { is_visible: !block.is_visible });
        const bs = await loadBlocks(site.id);
        setBlocks(bs);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    },
    [site, updateBlock],
  );

  const removeBlock = useCallback(
    async (block: BlockRow) => {
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
    },
    [site, updateBlock],
  );

  const insertBlockAt = useCallback(
    async (index: number, type: BlockType) => {
      if (!site) return;
      setError(null);
      setInserting({ index, type });

      try {
        if (!selectedPageId) throw new Error("No page selected");
        await createBlock(site.id, selectedPageId, type as any);

        const bs = await loadBlocks(site.id);
        setBlocks(bs);

        // blocks for current page (incl global header)
        const globalHeader = bs.filter((b: any) => b.type === "header" && (b.page_id ?? null) === null);
        const pageBlocks = bs.filter((b: any) => b.page_id === selectedPageId && b.type !== "header");
        const pageList = [...globalHeader, ...pageBlocks];

        // inserted: latest among pageBlocks
        const insertedCandidate = [...pageBlocks].sort((a, b) => (b.position - a.position) || b.created_at.localeCompare(a.created_at))[0];
        if (!insertedCandidate) return;

        const oldIndex = pageList.findIndex((b) => b.id === insertedCandidate.id);
        if (oldIndex === -1) return;

        const targetIndex = Math.max(0, Math.min(index, pageList.length - 1));
        if (oldIndex === targetIndex) {
          setInsertMenuIndex(null);
          setSelectedBlockId(insertedCandidate.id);
          return;
        }

        const moved = arrayMove(pageList, oldIndex, targetIndex).map((b, idx) => ({ ...b, position: idx + 1 }));
        const movedIds = new Set(moved.map((b) => b.id));

        const nextAll = bs.map((b) => (movedIds.has(b.id) ? (moved.find((x) => x.id === b.id) as any) : b));
        setBlocks(nextAll);

        await Promise.all(moved.map((b) => updateBlock(b.id, { position: b.position })));

        setInsertMenuIndex(null);
        setSelectedBlockId(insertedCandidate.id);
      } catch (e: any) {
        setError(e?.message ?? String(e));
        const bs2 = await loadBlocks(site.id);
        setBlocks(bs2);
      } finally {
        setInserting(null);
      }
    },
    [site, selectedPageId, updateBlock],
  );

  const onDragEnd = useCallback(
    async (event: any) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = blocksForPage.findIndex((b) => b.id === active.id);
      const newIndex = blocksForPage.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const moved = arrayMove(blocksForPage, oldIndex, newIndex).map((b, idx) => ({ ...b, position: idx + 1 }));

      // replace only moved ids in global blocks
      const movedIds = new Set(moved.map((b) => b.id));
      const nextAll = blocks.map((b) => (movedIds.has(b.id) ? (moved.find((x) => x.id === b.id) as any) : b));

      try {
        setBlocks(nextAll);
        await Promise.all(moved.map((b) => updateBlock(b.id, { position: b.position })));
      } catch (e: any) {
        setError(e?.message ?? String(e));
        if (!site) return;
        const bs = await loadBlocks(site.id);
        setBlocks(bs);
      }
    },
    [blocksForPage, blocks, updateBlock, site],
  );

  function normalizeNavAnchor(raw: string) {
    return normalizeAnchorId(raw);
  }

  const saveSelectedPage = useCallback(async () => {
    if (!site || !selectedPageId) return;

    const nextTitle = safeTrim(pageTitleDraft) || (selectedPage?.slug === null ? "Home" : "Page");
    const nextAnchorRaw = safeTrim(pageAnchorDraft);
    const nextAnchor = nextAnchorRaw ? normalizeNavAnchor(nextAnchorRaw) : null;

    try {
      setError(null);

      const patch: any = {
        title: nextTitle,
        nav_anchor: nextAnchor,
        show_in_nav: Boolean(pageShowInNavDraft),
      };

      const { data, error } = await supabase.from("site_pages").update(patch).eq("id", selectedPageId).select("*").single();
      if (error) throw error;

      const updated = data as PageRow;
      setPages((prev) =>
        prev
          .map((p) => (p.id === updated.id ? updated : p))
          .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
      );
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }, [site, selectedPageId, pageTitleDraft, pageAnchorDraft, pageShowInNavDraft, selectedPage?.slug]);

  const createPage = useCallback(async () => {
    if (!site) return;

    const nextNum = pages.length + 1;
    const baseSlug = `page-${nextNum}`;

    let slug = baseSlug;
    let i = nextNum;
    const hasSlug = (s: string) => pages.some((p) => (p.slug ?? "").toLowerCase() === s.toLowerCase());
    while (hasSlug(slug)) {
      i += 1;
      slug = `page-${i}`;
    }

    const sort_order = Math.max(0, ...pages.map((p) => p.sort_order ?? 0)) + 1;

    const { data, error } = await supabase
      .from("site_pages")
      .insert({ site_id: site.id, slug, title: `Page ${i}`, sort_order, is_published: true })
      .select("*")
      .single();

    if (error) throw error;

    const created = data as PageRow;
    setPages((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)));
    setSelectedPageId(created.id);
    setSelectedBlockId(null);
  }, [site, pages]);

  const deleteSelectedPage = useCallback(async () => {
    if (!site || !selectedPage) return;

    if (selectedPage.slug === null) {
      setError("Home page cannot be deleted.");
      return;
    }

    const nonHome = pages.filter((p) => p.slug !== null);
    if (nonHome.length <= 1) {
      setError("You cannot delete the last page.");
      return;
    }

    const ok = window.confirm(`Delete page "${selectedPage.title}"? Blocks on this page will be deleted too.`);
    if (!ok) return;

    try {
      setError(null);

      const { error: delBlocksErr } = await supabase
        .from("site_blocks")
        .delete()
        .eq("site_id", site.id)
        .eq("page_id", selectedPage.id);
      if (delBlocksErr) throw delBlocksErr;

      const { error: delPageErr } = await supabase.from("site_pages").delete().eq("id", selectedPage.id);
      if (delPageErr) throw delPageErr;

      setPages((prev) => prev.filter((p) => p.id !== selectedPage.id));
      setBlocks((prev) => prev.filter((b) => b.page_id !== selectedPage.id));

      const home = pages.find((p) => p.slug === null) ?? pages[0] ?? null;
      setSelectedPageId(home?.id ?? null);
      setSelectedBlockId(null);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }, [site, selectedPage, pages]);

  /* ---------------------------------------------
   * Products
   * --------------------------------------------- */
  const loadProducts = useCallback(async (siteId: string) => {
    setProductsLoading(true);
    setProductsErr(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("site_id", siteId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data ?? []) as any);
    } catch (e: any) {
      setProductsErr(e?.message ?? "Products load error");
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const createProduct = useCallback(async () => {
    if (!site?.id) return;
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("products").insert({
        site_id: site.id,
        owner_id: user.id,
        title: "New product",
        currency: "USD",
        is_active: true,
        sort_order: 100,
      });
      if (error) throw error;

      await loadProducts(site.id);
    } catch (e: any) {
      setProductsErr(e?.message ?? "Create product error");
    }
  }, [site, loadProducts]);

  const saveProduct = useCallback(
    async (productId: string) => {
      if (!site) return;

      setProductsLoading(true);
      setProductsErr(null);

      try {
        const patch: any = {
          title: productDraft.title.trim() || "Untitled product",
          subtitle: productDraft.subtitle.trim() || null,
          price_cents: productDraft.price_cents,
          sort_order: Number.isFinite(productDraft.sort_order) ? productDraft.sort_order : 100,
          is_active: Boolean(productDraft.is_active),
          external_url: productDraft.external_url.trim() || null,
          image_url: productDraft.image_url.trim() || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("products").update(patch).eq("id", productId).eq("site_id", site.id);
        if (error) throw error;

        await loadProducts(site.id);
        setEditingProductId(null);
      } catch (e: any) {
        setProductsErr(e?.message ?? "Save error");
      } finally {
        setProductsLoading(false);
      }
    },
    [site, productDraft, loadProducts],
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      if (!site) return;

      const ok = confirm("Delete this product? This action cannot be undone.");
      if (!ok) return;

      setProductsLoading(true);
      setProductsErr(null);

      try {
        const { error } = await supabase.from("products").delete().eq("id", productId).eq("site_id", site.id);
        if (error) throw error;

        await loadProducts(site.id);
        setEditingProductId(null);
      } catch (e: any) {
        setProductsErr(e?.message ?? "Delete error");
      } finally {
        setProductsLoading(false);
      }
    },
    [site, loadProducts],
  );

  /* ---------------------------------------------
   * Header style helpers (style.header)
   * --------------------------------------------- */
  const headerStyleObj = useMemo(() => {
    if (!selectedBlock || selectedBlock.type !== "header") return null;
    const style = ((selectedBlock as any).style ?? {}) as any;
    return (style?.header ?? {}) as any;
  }, [selectedBlock]);

  const patchHeaderStyle = useCallback(
    (patch: Record<string, any>) => {
      if (!selectedBlock || selectedBlock.type !== "header") return;
      const style = ((selectedBlock as any).style ?? {}) as any;
      const header = (style?.header ?? {}) as any;
      const nextHeader = { ...header, ...patch };
      onPatchBlockStyle({ header: nextHeader });
    },
    [selectedBlock, onPatchBlockStyle],
  );

  const readHeaderColor = useCallback(
    (key: string) => String((headerStyleObj as any)?.[key] ?? ""),
    [headerStyleObj],
  );

  const setHeaderColor = useCallback(
    (key: string, raw: string) => {
      if (!raw) {
        patchHeaderStyle({ [key]: null });
        return;
      }
      const normalized = normalizeHexOrNull(raw);
      if (normalized === null) return;
      patchHeaderStyle({ [key]: normalized });
    },
    [patchHeaderStyle],
  );

  const readHeaderEnum = useCallback(
    (key: string, fallback: string) => {
      const v = String((headerStyleObj as any)?.[key] ?? "").trim();
      return v || fallback;
    },
    [headerStyleObj],
  );

  /* ---------------------------------------------
   * Initial load / refreshAll
   * --------------------------------------------- */
  const refreshAll = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const s = await ensureSiteForUser();
      setSite(s);

      const { data: pagesData, error: pagesErr } = await supabase
        .from("site_pages")
        .select("*")
        .eq("site_id", s.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      let pageId: string | null = null;

      if (!pagesErr && pagesData) {
        setPages(pagesData as any);
        const home = (pagesData as any[]).find((p) => p.slug === null) ?? (pagesData as any[])[0];
        pageId = home?.id ?? null;
        setSelectedPageId((prev) => prev ?? pageId);
      }

      setColors({
        bg_color: s.bg_color ?? "",
        text_color: s.text_color ?? "",
        muted_color: s.muted_color ?? "",
        border_color: s.border_color ?? "",
        button_color: s.button_color ?? "",
        button_text_color: s.button_text_color ?? "",
      });

      let bs = await loadBlocks(s.id);
      await loadProducts(s.id);

      // one-time: promote first header to global if no global header exists
      const hasGlobalHeader = bs.some((b: any) => b.type === "header" && (b.page_id ?? null) === null);
      if (!hasGlobalHeader) {
        const firstAnyHeader = bs.find((b: any) => b.type === "header");
        if (firstAnyHeader) {
          await supabase.from("site_blocks").update({ page_id: null }).eq("id", firstAnyHeader.id);
          bs = await loadBlocks(s.id);
        }
      }

      // ensure at least a hero exists somewhere (your previous behavior)
      if (!bs.some((b) => b.type === "hero")) {
        if (!pageId) throw new Error("No page selected");
        await createBlock(s.id, pageId, "hero");
        bs = await loadBlocks(s.id);
      }

      setBlocks(bs);

      const firstVisible = bs.find((b) => b.is_visible) ?? bs[0];
      setSelectedBlockId((prev) => {
        if (prev && bs.some((b) => b.id === prev)) return prev;
        return firstVisible?.id ?? null;
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------------------------------------------
   * Render helpers
   * ------------------------------------------------------------------------------------------------- */
  const SitePreview = useMemo(() => {
    const shellProps = {
      ["data-preview" as any]: "true",
      themeKey: site?.theme_key ?? "midnight",
      backgroundStyle: (site?.background_style ?? "solid") as any,
      buttonStyle: (site?.button_style ?? "solid") as any,
      fontScale: (site as any)?.font_scale ?? "md",
      buttonRadius: (site as any)?.button_radius ?? "2xl",
      cardStyle: (site as any)?.card_style ?? "card",
      layoutWidth: (site as any)?.layout_width ?? "compact",
      themeOverrides: {
        bg_color: site?.bg_color ?? null,
        text_color: site?.text_color ?? null,
        muted_color: site?.muted_color ?? null,
        border_color: site?.border_color ?? null,
        button_color: site?.button_color ?? null,
        button_text_color: site?.button_text_color ?? null,
      },
    };

    const blocksVisible = (blocksForPage.filter((b) => b.is_visible) as any) ?? [];

    return (
      <SiteShell {...(shellProps as any)}>
        <div className="space-y-4">
          {dashboardTab === "blocks" ? (
            <BlocksRenderer
              blocks={blocksVisible}
              mode="preview"
              site={{
                layout_width: (site as any)?.layout_width ?? "compact",
                button_style: (site?.button_style ?? "solid") as any,
              }}
            />
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="mt-1 text-sm text-[rgb(var(--db-muted))]">
                    {productsLoading ? "Loading..." : `${products.length} products`}
                  </div>
                </div>
                <Button onClick={createProduct}>Create product</Button>
              </div>

              {productsErr ? <div className="mt-3 text-sm text-red-600">{productsErr}</div> : null}

              <div className="mt-4 space-y-2">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-[rgb(var(--db-border))] bg-white p-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[rgb(var(--db-text))] truncate">{p.title}</div>
                      <div className="mt-0.5 text-xs text-[rgb(var(--db-muted))]">
                        {p.price_cents != null ? `${p.currency} ${(p.price_cents / 100).toFixed(2)}` : "No price"}
                        {" · "}sort {p.sort_order}
                        {" · "}
                        {p.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setEditingProductId(p.id);
                          setProductDraft({
                            title: String(p.title ?? ""),
                            price_cents: p.price_cents ?? null,
                            sort_order: Number(p.sort_order ?? 100),
                            is_active: Boolean(p.is_active ?? true),
                            subtitle: String(p.subtitle ?? ""),
                            external_url: String(p.external_url ?? ""),
                            image_url: String(p.image_url ?? ""),
                          });
                        }}
                        className="bg-white text-[rgb(var(--db-text))] border border-[rgb(var(--db-border))] hover:bg-[rgb(var(--db-soft))]"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}

                {!productsLoading && products.length === 0 && !productsErr ? (
                  <div className="text-sm text-[rgb(var(--db-muted))]">No products yet.</div>
                ) : null}
              </div>

              {editingProductId ? (
                <div className="mt-4 rounded-2xl border border-[rgb(var(--db-border))] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Edit product</div>
                      <div className="mt-1 text-xs text-[rgb(var(--db-muted))]">{editingProductId}</div>
                    </div>
                    <Button
                      onClick={() => setEditingProductId(null)}
                      className="bg-white text-[rgb(var(--db-text))] border border-[rgb(var(--db-border))] hover:bg-[rgb(var(--db-soft))]"
                    >
                      Close
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div>
                      <div className="text-xs font-semibold text-[rgb(var(--db-text))]">Title</div>
                      <input
                        value={productDraft.title}
                        onChange={(e) => setProductDraft((d) => ({ ...d, title: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[rgb(var(--db-border))] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--db-ring))]"
                        placeholder="Product title"
                      />
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-[rgb(var(--db-text))]">Subtitle</div>
                      <input
                        value={productDraft.subtitle}
                        onChange={(e) => setProductDraft((d) => ({ ...d, subtitle: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[rgb(var(--db-border))] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--db-ring))]"
                        placeholder="Short subtitle (optional)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-semibold text-[rgb(var(--db-text))]">Price (USD)</div>
                        <input
                          value={productDraft.price_cents === null ? "" : (productDraft.price_cents / 100).toFixed(2)}
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            if (!raw) {
                              setProductDraft((d) => ({ ...d, price_cents: null }));
                              return;
                            }
                            const n = Number(raw.replace(",", "."));
                            if (Number.isFinite(n)) {
                              setProductDraft((d) => ({ ...d, price_cents: Math.round(n * 100) }));
                            }
                          }}
                          className="mt-1 w-full rounded-xl border border-[rgb(var(--db-border))] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--db-ring))]"
                          placeholder="19.99"
                          inputMode="decimal"
                        />
                        <div className="mt-1 text-[11px] text-[rgb(var(--db-muted))]">Leave empty for “No price”.</div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-[rgb(var(--db-text))]">Sort order</div>
                        <input
                          value={String(productDraft.sort_order)}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (Number.isFinite(n)) setProductDraft((d) => ({ ...d, sort_order: n }));
                          }}
                          className="mt-1 w-full rounded-xl border border-[rgb(var(--db-border))] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--db-ring))]"
                          placeholder="100"
                          inputMode="numeric"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-[rgb(var(--db-text))]">
                      <input
                        type="checkbox"
                        checked={productDraft.is_active}
                        onChange={(e) => setProductDraft((d) => ({ ...d, is_active: e.target.checked }))}
                      />
                      Active
                    </label>

                    <div>
                      <div className="text-xs font-semibold text-[rgb(var(--db-text))]">External URL</div>
                      <input
                        value={productDraft.external_url}
                        onChange={(e) => setProductDraft((d) => ({ ...d, external_url: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[rgb(var(--db-border))] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--db-ring))]"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-[rgb(var(--db-text))]">Image URL</div>
                      <input
                        value={productDraft.image_url}
                        onChange={(e) => setProductDraft((d) => ({ ...d, image_url: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[rgb(var(--db-border))] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--db-ring))]"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Button onClick={() => editingProductId && deleteProduct(editingProductId)} className="bg-white text-red-600 border border-red-300 hover:bg-red-50">
                        Delete
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setEditingProductId(null)}
                          className="bg-white text-[rgb(var(--db-text))] border border-[rgb(var(--db-border))]"
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => editingProductId && saveProduct(editingProductId)}>Save</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </SiteShell>
    );
  }, [
    site,
    blocksForPage,
    dashboardTab,
    productsLoading,
    products.length,
    productsErr,
    products,
    editingProductId,
    productDraft,
    createProduct,
    deleteProduct,
    saveProduct,
  ]);

  /* -------------------------------------------------------------------------------------------------
   * Top bar UI
   * ------------------------------------------------------------------------------------------------- */
  return (
    <main
      className="dashboard-ui min-h-screen bg-[rgb(var(--db-bg))] text-[rgb(var(--db-text))]"
      style={{ ...(DASHBOARD_THEME_VARS as any), ...(DASHBOARD_UI_VARS as any) }}
    >
      <div className="sticky top-0 z-[5000] border-b border-[rgb(var(--db-border))] bg-[rgb(var(--db-bg))]">
        <div className="mx-auto max-w-[1400px] px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
          <div className="flex items-center gap-2">
  <div className="text-lg font-bold mr-1">Dashboard</div>

  <span className="hidden sm:inline text-xs rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-2 py-1 text-[rgb(var(--db-muted))]">
    Mini-site builder
  </span>

  <Button variant="pill" onClick={refreshAll} disabled={loading}>
  {loading ? "Loading..." : "Refresh"}
</Button>


<Button
  variant="pill"
  onClick={async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }}
>
  Sign out
</Button>

</div>


  <div className="text-xs text-[rgb(var(--db-muted))] mt-1 truncate">
    Site: <span className="text-[rgb(var(--db-text))]">{site?.slug ?? "..."}</span>
  </div>
</div>


            <div className="flex items-center gap-2">
            <Button
  variant="pill"
  onClick={() => setDashboardTab("blocks")}
  className={dashboardTab === "blocks" ? "bg-[rgb(var(--db-soft))]" : undefined}
>
  Blocks
</Button>

<Button
  variant="pill"
  onClick={() => setDashboardTab("products")}
  className={dashboardTab === "products" ? "bg-[rgb(var(--db-soft))]" : undefined}
>
  Products
</Button>


              
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-between lg:justify-end">
              {/* Page selector (kept for quick access) */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-[rgb(var(--db-muted))]">Page</span>
                <select
                  className="w-[150px] h-9 rounded-full border border-[rgb(var(--db-border))] bg-white px-3 text-sm font-semibold text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.25)]"
                  value={selectedPageId ?? ""}
                  onChange={(e) => setSelectedPageId((e.target as HTMLSelectElement).value)}
                  disabled={!site || loading}
                >
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.slug === null ? "Home" : `/${p.slug}`} — {p.title}
                    </option>
                  ))}
                </select>

                <Button
  variant="pill"
  disabled={!canAct}
  onClick={async () => {
    try {
      await createPage();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }}
>
  + Page
</Button>

</div>

{/* Actions */}
<div className="flex items-center gap-2">
 

  


                <DbDetails>
                <DbSummaryButton className={HEADER_PILL}>
  Site settings
</DbSummaryButton>


                  <DbPopoverPanel
                    className={clsx(
                      "fixed right-4 top-[72px] z-[6000] w-[520px] max-w-[92vw]",
                      "rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] shadow-[0_24px_60px_rgba(15,23,42,0.18)]",
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Site settings</div>
                        <div className="text-xs text-[rgb(var(--db-muted))] mt-1">Layout + theme. Colors are optional overrides.</div>
                      </div>

                      <Link href={publicUrl} target="_blank" className="shrink-0">
                        <span className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-xs font-semibold text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-panel))] transition">
                          Open page ↗
                        </span>
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-4">
  <ThemeInspector
    site={site}
    canAct={canAct}
    themeKeys={Object.keys(THEMES)}
    colors={colors}
    setColors={setColors}
    updateSiteTheme={updateSiteTheme}
    setSite={setSite}
    saveColorField={saveColorField}
  />
</div>

  {/* дальше у тебя уже идут карточки Style и Colors (optional) — оставь их как есть */}


  <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-4">
    <div className="text-xs font-semibold text-[rgb(var(--db-muted))] mb-3">Style</div>

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

  </DbPopoverPanel>
                </DbDetails>

                <Link href={publicUrl} target="_blank" className="hidden sm:inline-flex">
                  <Button variant="pill">Open public page ↗</Button>
                </Link>

              </div>
            </div>

            {error ? (
              <div className="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>


      {/* BODY */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 min-h-0">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_380px] min-h-0">
          {/* LEFT: Blocks */}
          <Card className="lg:sticky lg:top-[76px] lg:h-[calc(100vh-96px)] lg:overflow-auto flex flex-col min-h-0 overscroll-contain">
            <div className="p-4 border-b border-[rgb(var(--db-border))] shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Blocks</div>
                  <div className="text-xs text-[rgb(var(--db-muted))] mt-1">Select a block to edit. Drag to reorder.</div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <Section title="Page settings" description="Title, nav anchor and visibility" defaultOpen={true}>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[11px] text-[rgb(var(--db-muted))] mb-2">Title</div>
                      <input
                        value={pageTitleDraft}
                        disabled={!canAct}
                        onChange={(e) => setPageTitleDraft((e.target as HTMLInputElement).value)}
                        placeholder="Page title"
                        className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.30)]"
                      />
                    </div>

                    <div>
                      <div className="text-[11px] text-[rgb(var(--db-muted))] mb-2">Menu anchor (nav_anchor)</div>
                      <input
                        value={pageAnchorDraft}
                        disabled={!canAct}
                        onChange={(e) => setPageAnchorDraft((e.target as HTMLInputElement).value)}
                        placeholder="home / about / pricing"
                        className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.30)]"
                      />
                      <div className="mt-1 text-[11px] text-[rgb(var(--db-muted))]">
                        Используем в меню. Пусто = не показывать как якорь.
                      </div>
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2">
                      <div className="text-xs font-semibold text-[rgb(var(--db-text))]">Show in nav</div>
                      <input
                        type="checkbox"
                        disabled={!canAct}
                        checked={Boolean(pageShowInNavDraft)}
                        onChange={(e) => setPageShowInNavDraft((e.target as HTMLInputElement).checked)}
                      />
                    </label>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" className="px-3 py-2 text-xs" disabled={!canAct || !selectedPageId} onClick={saveSelectedPage}>
                        Save page
                      </Button>

                      <Button
                        variant="ghost"
                        className="px-3 py-2 text-xs"
                        disabled={!canAct || !selectedPage || selectedPage.slug === null}
                        onClick={deleteSelectedPage}
                      >
                        Delete page
                      </Button>
                    </div>
                  </div>
                </Section>

                <Section title="Add blocks" description="Quick add common block types" defaultOpen={true}>
                  <div className="flex flex-wrap gap-2">
                    {(["header", "hero", "links", "image", "text", "divider", "products"] as const).map((t) => {
                      const isBusy = creating === (t as any);

                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={!site || loading || !!creating || !!inserting}
                          onClick={async () => {
                            if (!site) return;
                            setCreating(t as any);
                            try {
                              if (!selectedPageId) throw new Error("No page selected");
                              await createBlock(site.id, selectedPageId, t as any);

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

                  <div className="mt-3 text-[11px] text-[rgb(var(--db-muted))]">
                    “Header” is global (page_id = null). Other blocks attach to the selected page.
                  </div>
                </Section>
              </div>
            </div>

            <div className="p-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={blocksForPage.map((b) => b.id)} strategy={verticalListSortingStrategy}>
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

                    {blocksForPage.map((b, idx) => {
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



          {/* CENTER: Preview */}
          <Card>
            <div className="p-4 border-b border-[rgb(var(--db-border))] flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Preview</div>
                <div className="text-xs text-[rgb(var(--db-muted))] mt-1">Live preview with current settings.</div>
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

                <Button variant="ghost" onClick={() => setPreviewCollapsed((v) => !v)} className="px-3 py-2 text-xs">
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
              <div className="p-4" key={previewNonce}>
                <div
                  className={clsx(
                    "relative isolate z-0 mx-auto overflow-hidden rounded-2xl border border-[rgb(var(--db-border))]",
                    previewDevice === "mobile" ? "w-[390px] max-w-full" : "w-full",
                  )}
                >
                  {previewDevice === "mobile" ? (
                    <div className="h-[760px] w-[390px] max-w-full overflow-hidden rounded-2xl border border-[rgb(var(--db-border))]">
                      <div className="h-full w-full overflow-auto">{SitePreview}</div>
                    </div>
                  ) : (
                    <div className="min-h-[720px]">{SitePreview}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-sm text-[rgb(var(--db-muted))]">Preview is collapsed.</div>
            )}
          </Card>

          {/* RIGHT: Inspector */}
          <Card className="lg:sticky lg:top-[76px] lg:h-[calc(100vh-96px)] lg:overflow-auto">
            <div className="p-4 border-b border-[rgb(var(--db-border))]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Inspector</div>
                  <div className="text-xs text-[rgb(var(--db-muted))] mt-1">Selected block settings</div>
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
                  {/* Tab switch */}
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

                  {/* ADVANCED */}
                  {blockTab === "advanced" ? (
                    <Section title="Block identity" description="IDs and anchors" defaultOpen={true}>
                      <div className="space-y-3">
                        <div className="text-xs text-[rgb(var(--db-muted))]">
                          <div>
                            <span className="font-semibold text-[rgb(var(--db-text))]">{selectedBlock.type}</span>{" "}
                            <span className="text-[rgb(var(--db-muted))]">· id</span>{" "}
                            <span className="font-mono text-[rgb(var(--db-text))]">{selectedBlock.id}</span>
                          </div>
                        </div>

                        <label className="block">
                          <div className="text-xs text-[rgb(var(--db-muted))] mb-2">anchor_id (optional)</div>
                          <input
                            value={anchorDraft}
                            disabled={!canAct}
                            onChange={(e) => setAnchorDraft(e.target.value)}
                            placeholder="e.g. about / pricing / faq"
                            className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))] placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent) / 0.30)]"
                          />
                          <div className="text-xs text-[rgb(var(--db-muted))] mt-2">
                            Use in links as <span className="font-mono text-[rgb(var(--db-text))]">#anchor</span> (e.g.{" "}
                            <span className="font-mono text-[rgb(var(--db-text))]">/#about</span>).
                          </div>
                        </label>

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
                    </Section>
                  ) : null}

                  {/* STYLE */}
                  {blockTab === "style" ? (
                    <div className="space-y-4">
                      {/* Header style */}
                      {selectedBlock.type === "header" ? (
                        <Section title="Header style" description="Layout + colors (stored in site_blocks.style.header)" defaultOpen={true}>
                          <div className="space-y-4">
                            <div>
                              <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Variant</div>
                              <select
                                disabled={!canAct}
                                className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent) / 0.30)] disabled:opacity-50"
                                value={(((selectedBlock as any).variant ?? "default") as any) === "centered" ? "centered" : "default"}
                                onChange={(e) => saveSelectedBlockPatch({ variant: (e.target as HTMLSelectElement).value as any })}
                              >
                                <option value="default">Default</option>
                                <option value="centered">Centered</option>
                              </select>
                              <div className="text-xs text-[rgb(var(--db-muted))] mt-2">Variant — компоновка блока (site_blocks.variant).</div>
                            </div>

                            <div className="flex items-center justify-between rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2">
                              <div className="text-sm font-medium">Full width (edge-to-edge)</div>
                              <input
                                disabled={!canAct}
                                type="checkbox"
                                checked={Boolean(((selectedBlock as any)?.style as any)?.full_bleed)}
                                onChange={(e) => onPatchBlockStyle({ full_bleed: (e.target as HTMLInputElement).checked })}
                              />
                            </div>

                            <div className="space-y-3">
                              <PaletteColorField label="Header bg" value={readHeaderColor("bg_color")} disabled={!canAct} onChange={(v) => setHeaderColor("bg_color", v)} />
                              <PaletteColorField label="Text" value={readHeaderColor("text_color")} disabled={!canAct} onChange={(v) => setHeaderColor("text_color", v)} />
                              <PaletteColorField label="Links" value={readHeaderColor("link_color")} disabled={!canAct} onChange={(v) => setHeaderColor("link_color", v)} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="block">
                                <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Brand size</div>
                                <select
                                  className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))]"
                                  value={readHeaderEnum("brand_size", "md")}
                                  disabled={!canAct}
                                  onChange={(e) => patchHeaderStyle({ brand_size: (e.target as HTMLSelectElement).value })}
                                >
                                  <option value="sm">Small</option>
                                  <option value="md">Medium</option>
                                  <option value="lg">Large</option>
                                </select>
                              </label>

                              <label className="block">
                                <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Links size</div>
                                <select
                                  className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))]"
                                  value={readHeaderEnum("links_size", "md")}
                                  disabled={!canAct}
                                  onChange={(e) => patchHeaderStyle({ links_size: (e.target as HTMLSelectElement).value })}
                                >
                                  <option value="sm">Small</option>
                                  <option value="md">Medium</option>
                                  <option value="lg">Large</option>
                                </select>
                              </label>

                              <label className="block sm:col-span-2">
                                <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Logo size</div>
                                <select
                                  className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))]"
                                  value={readHeaderEnum("logo_size", "md")}
                                  disabled={!canAct}
                                  onChange={(e) => patchHeaderStyle({ logo_size: (e.target as HTMLSelectElement).value })}
                                >
                                  <option value="sm">Small</option>
                                  <option value="md">Medium</option>
                                  <option value="lg">Large</option>
                                </select>
                              </label>
                            </div>

                            <div className="space-y-3">
                              <div className="text-sm font-semibold">CTA colors</div>
                              <PaletteColorField label="CTA bg" value={readHeaderColor("cta_bg_color")} disabled={!canAct} onChange={(v) => setHeaderColor("cta_bg_color", v)} />
                              <PaletteColorField label="CTA text" value={readHeaderColor("cta_text_color")} disabled={!canAct} onChange={(v) => setHeaderColor("cta_text_color", v)} />
                              <PaletteColorField
                                label="CTA border"
                                value={readHeaderColor("cta_border_color")}
                                disabled={!canAct}
                                onChange={(v) => setHeaderColor("cta_border_color", v)}
                              />
                            </div>
                          </div>
                        </Section>
                      ) : null}

                      {/* Image style */}
                      {selectedBlock.type === "image" ? (
                        <Section title="Image style" description="Stored in site_blocks.style.image" defaultOpen={true}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block">
                              <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Size</div>
                              <select
                                className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))]"
                                value={String((((selectedBlock as any)?.style as any)?.image as any)?.size ?? "md")}
                                disabled={!canAct}
                                onChange={(e) => {
                                  const cur = ((((selectedBlock as any)?.style ?? {}) as any).image ?? {}) as any;
                                  onPatchBlockStyle({ image: { ...cur, size: (e.target as HTMLSelectElement).value } });
                                }}
                              >
                                <option value="xs">XS</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="xl">XL</option>
                                <option value="2xl">2XL</option>
                                <option value="3xl">3XL</option>
                                <option value="full">Full width</option>
                              </select>
                            </label>

                            <label className="block">
                              <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Image radius</div>
                              <select
                                className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))]"
                                value={String((((selectedBlock as any)?.style as any)?.image as any)?.radius ?? "none")}
                                disabled={!canAct}
                                onChange={(e) => {
                                  const cur = ((((selectedBlock as any)?.style ?? {}) as any).image ?? {}) as any;
                                  onPatchBlockStyle({ image: { ...cur, radius: (e.target as HTMLSelectElement).value } });
                                }}
                              >
                                <option value="none">None</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="xl">XL</option>
                                <option value="2xl">2XL</option>
                                <option value="full">Full</option>
                              </select>
                            </label>

                            <label className="block">
                              <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Aspect ratio</div>
                              <select
                                className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))]"
                                value={String((((selectedBlock as any)?.style as any)?.image as any)?.ratio ?? "")}
                                disabled={!canAct}
                                onChange={(e) => {
                                  const cur = ((((selectedBlock as any)?.style ?? {}) as any).image ?? {}) as any;
                                  onPatchBlockStyle({ image: { ...cur, ratio: (e.target as HTMLSelectElement).value } });
                                }}
                              >
                                <option value="">Default</option>
                                <option value="1:1">1:1 (Square)</option>
                                <option value="4:5">4:5</option>
                                <option value="3:4">3:4</option>
                                <option value="4:3">4:3</option>
                                <option value="3:2">3:2</option>
                                <option value="16:9">16:9</option>
                                <option value="21:9">21:9</option>
                              </select>
                            </label>

                            <label className="block">
                              <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Align</div>
                              <select
                                className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm text-[rgb(var(--db-text))]"
                                value={String((((selectedBlock as any)?.style as any)?.image as any)?.align ?? "center")}
                                disabled={!canAct}
                                onChange={(e) => {
                                  const cur = ((((selectedBlock as any)?.style ?? {}) as any).image ?? {}) as any;
                                  onPatchBlockStyle({ image: { ...cur, align: (e.target as HTMLSelectElement).value } });
                                }}
                              >
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                              </select>
                            </label>
                          </div>
                        </Section>
                      ) : null}

                      {/* Generic block style */}
                      <Section title="Block style" description="Applies to this block (BlockFrame / normalizeBlockStyle)" defaultOpen={true}>
                        <div className="space-y-3">
                          <div>
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
                                onChange={(e) => onPatchBlockStyle({ padding: (e.target as HTMLSelectElement).value })}
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
                                  const v =
                                    (e.target as HTMLSelectElement).value === "compact"
                                      ? "content"
                                      : (e.target as HTMLSelectElement).value;
                                  onPatchBlockStyle({ width: v });
                                }}
                              >
                                <option value="compact">Compact</option>
<option value="wide">Wide</option>
<option value="xwide">Extra wide</option>
<option value="max">Max</option>
<option value="full">Full</option>

                              </select>
                            </label>

                            <label className="block">
                              <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Background</div>
                              <select
                                className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm"
                                value={getStyleView().background}
                                disabled={!canAct}
                                onChange={(e) => onPatchBlockStyle({ background: (e.target as HTMLSelectElement).value })}
                              >
                                <option value="none">None</option>
                                <option value="soft">Soft</option>
                                <option value="panel">Panel</option>
                                <option value="accent">Accent</option>
                              </select>
                            </label>

                            <label className="block">
                              <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Align</div>
                              <select
                                className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm"
                                value={getStyleView().align}
                                disabled={!canAct}
                                onChange={(e) => onPatchBlockStyle({ align: (e.target as HTMLSelectElement).value })}
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
                                onChange={(e) => onPatchBlockStyle({ radius: (e.target as HTMLSelectElement).value })}
                              >
                                <option value="none">None</option>
                                <option value="md">MD</option>
                                <option value="xl">XL</option>
                                <option value="2xl">2XL</option>
                                <option value="full">Full</option>
                              </select>
                            </label>

                            <label className="block">
                              <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Border</div>
                              <select
                                className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] px-3 py-2 text-sm"
                                value={getStyleView().border}
                                disabled={!canAct}
                                onChange={(e) => onPatchBlockStyle({ border: (e.target as HTMLSelectElement).value })}
                              >
                                <option value="none">None</option>
                                <option value="subtle">Subtle</option>
                                <option value="strong">Strong</option>
                              </select>
                            </label>
                          </div>
                        </div>
                      </Section>
                    </div>
                  ) : null}

                  {/* CONTENT */}
                  {blockTab === "content" ? (
                    <div className="space-y-4">
                      <Section title="Content" description={`Edit content for: ${selectedBlock.type}`} defaultOpen={true}>
                        {/* Editors are kept exactly, but moved behind a clean section */}
                        {selectedBlock.type === "header" ? (
                          <HeaderEditor block={selectedBlock as any} onSave={(content: any) => saveSelectedBlockContent(content)} />
                        ) : selectedBlock.type === "hero" ? (
                          <HeroEditor block={selectedBlock as any} onSave={(next: any) => saveSelectedBlockPatch(next)} />
                        ) : selectedBlock.type === "links" ? (
                          <LinksEditor block={selectedBlock as any} onSave={(content: any) => saveSelectedBlockContent(content)} />
                        ) : selectedBlock.type === "image" ? (
                          <ImageEditor block={selectedBlock as any} onSave={(content: any) => saveSelectedBlockContent(content)} />
                        ) : selectedBlock.type === "text" ? (
                          <TextEditor block={selectedBlock as any} onSave={(content: any) => saveSelectedBlockContent(content)} />
                        ) : selectedBlock.type === "divider" ? (
                          <DividerEditor block={selectedBlock as any} onSave={(content: any) => saveSelectedBlockContent(content)} />
                        ) : selectedBlock.type === "products" ? (
                          <ProductsEditor
                            value={(selectedBlock.content ?? {}) as any}
                            onSave={async (next) => {
                              await saveSelectedBlockContent(next);
                            }}
                          />
                        )
                         : (
                          <div className="text-sm text-[rgb(var(--db-muted))]">No editor for this block type yet.</div>
                        )}
                      </Section>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
