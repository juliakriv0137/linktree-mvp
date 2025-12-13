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

  theme_key: string;
  background_style: string;
  button_style: string;

  font_scale: "sm" | "md" | "lg";
  button_radius: "md" | "xl" | "2xl" | "full";
  card_style: "plain" | "card";

  created_at: string;
};


type BlockRow = {
  id: string;
  site_id: string;
  type: string;
  content: any;
  position: number;
  is_visible: boolean;
  created_at: string;
};

type HeroContent = {
  title?: string;
  subtitle?: string;
  avatar?: string | null;
};

type LinksContent = {
  items?: Array<{ title?: string; url?: string }>;
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
  // if user pasted "t.me/xxx" etc -> add https://
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

async function getAuthedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

async function ensureSiteForUser(): Promise<SiteRow> {
  const uid = await getAuthedUserId();

  // Try to load existing site
  const { data: existing, error: selErr } = await supabase
    .from("sites")
    .select("*")
    .eq("owner_id", uid)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing) return existing as SiteRow;

  // Need a slug -> take from profiles.username
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", uid)
    .single();

  if (profErr) throw profErr;

  const slug = String(profile?.username ?? "").trim();
  if (!slug)
    throw new Error("Profile username is empty; cannot create site slug.");

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
  type: "hero" | "links" | "image" | "text" | "divider",
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
          } as any)
        : type === "text"
          ? ({ text: "Your text here" } as any)
          : type === "divider"
            ? ({ style: "line" } as any)
            : ({
                items: [
                  { title: "Telegram", url: "https://t.me/yourname" },
                  { title: "Instagram", url: "https://instagram.com/yourname" },
                ],
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
  const { error } = await supabase
    .from("site_blocks")
    .update(patch)
    .eq("id", blockId);
  if (error) throw error;
}

async function deleteBlock(blockId: string) {
  const { error } = await supabase
    .from("site_blocks")
    .delete()
    .eq("id", blockId);
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
    >
  >,
) {

  const { error } = await supabase.from("sites").update(patch).eq("id", siteId);
  if (error) throw error;
}

async function moveBlock(
  siteId: string,
  blockId: string,
  direction: "up" | "down",
) {
  const blocks = await loadBlocks(siteId);
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return;

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= blocks.length) return;

  const a = blocks[idx];
  const b = blocks[swapWith];

  // swap positions
  await updateBlock(a.id, { position: b.position });
  await updateBlock(b.id, { position: a.position });
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
      {children}
    </div>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/30";
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-white/90 disabled:opacity-40"
      : variant === "danger"
        ? "bg-red-600 text-white hover:bg-red-500 disabled:opacity-40"
        : "bg-white/10 text-white hover:bg-white/15 disabled:opacity-40";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(base, styles)}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm text-white/80 mb-2">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
      />
    </label>
  );
}

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = (block.content ?? {}) as HeroContent;
    setTitle(c.title ?? "");
    setSubtitle(c.subtitle ?? "");
  }, [block.id, block.content]);

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/50">Hero block</div>

      <Input
        label="Title"
        value={title}
        onChange={setTitle}
        placeholder="Your name / brand"
      />
      <Textarea
        label="Subtitle"
        value={subtitle}
        onChange={setSubtitle}
        placeholder="Short bio / tagline"
      />

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
  const [items, setItems] = useState<Array<{ title: string; url: string }>>(
    (initial.items ?? []).map((x) => ({
      title: x.title ?? "",
      url: x.url ?? "",
    })),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = (block.content ?? {}) as LinksContent;
    setItems(
      (c.items ?? []).map((x) => ({ title: x.title ?? "", url: x.url ?? "" })),
    );
  }, [block.id, block.content]);

  const hasInvalid = useMemo(() => {
    return items.some((x) => !safeTrim(x.title) || !isValidHttpUrl(x.url));
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/50">Links block</div>

      <div className="space-y-3">
        {items.map((it, idx) => {
          const urlOk = !safeTrim(it.url) ? false : isValidHttpUrl(it.url);
          return (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/80">
                  Link #{idx + 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (idx === 0) return;
                      setItems((prev) => {
                        const next = [...prev];
                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                        return next;
                      });
                    }}
                    disabled={idx === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (idx === items.length - 1) return;
                      setItems((prev) => {
                        const next = [...prev];
                        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                        return next;
                      });
                    }}
                    disabled={idx === items.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <Input
                label="Button text"
                value={it.title}
                onChange={(v) =>
                  setItems((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                  )
                }
                placeholder="Telegram / Website / Portfolio..."
              />

              <label className="block">
                <div className="text-sm text-white/80 mb-2">URL</div>
                <input
                  value={it.url}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, url: e.target.value } : x,
                      ),
                    )
                  }
                  placeholder="https://..."
                  className={clsx(
                    "w-full rounded-2xl border bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20",
                    urlOk ? "border-white/10" : "border-red-500/50",
                  )}
                />
                {!urlOk && safeTrim(it.url) && (
                  <div className="text-xs text-red-300 mt-2">
                    URL must be http(s). Example: https://t.me/yourname
                  </div>
                )}
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => setItems((prev) => [...prev, { title: "", url: "" }])}
        >
          + Add link
        </Button>

        <Button
          variant="primary"
          disabled={saving || items.length === 0 || hasInvalid}
          onClick={async () => {
            setSaving(true);
            try {
              const cleaned = items
                .map((x) => ({
                  title: safeTrim(x.title),
                  url: normalizeUrl(x.url),
                }))
                .filter((x) => x.title && x.url);

              await onSave({ items: cleaned });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving..." : "Save links"}
        </Button>
      </div>

      <div className="text-xs text-white/40">
        Tip: можно вставлять{" "}
        <span className="text-white/60">t.me/username</span> — мы добавим
        https:// автоматически.
      </div>
    </div>
  );
}

function ImageEditor({
  block,
  onSave,
}: {
  block: BlockRow;
  onSave: (content: any) => Promise<void>;
}) {
  const [url, setUrl] = useState<string>(block.content?.url ?? "");
  const [alt, setAlt] = useState<string>(block.content?.alt ?? "");
  const [shape, setShape] = useState<string>(block.content?.shape ?? "circle");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1">
          <div className="text-xs text-white/50">Image URL</div>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-white/50">Shape</div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={shape}
            onChange={(e) => setShape(e.target.value)}
          >
            <option value="circle">Circle</option>
            <option value="rounded">Rounded</option>
            <option value="square">Square</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-white/50">Alt text (optional)</div>
        <input
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          placeholder="Describe the image"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="text-xs text-white/50 mb-3">Preview</div>
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizeUrl(url)}
            alt={alt}
            className={
              shape === "circle"
                ? "h-24 w-24 rounded-full object-cover border border-white/10"
                : shape === "rounded"
                  ? "h-24 w-24 rounded-2xl object-cover border border-white/10"
                  : "h-24 w-24 rounded-none object-cover border border-white/10"
            }
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
            }}
          />
        </div>
      </div>

      {!isValidHttpUrl(url) && (
        <div className="text-xs text-yellow-200/80">
          Please enter a valid http(s) URL.
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled={saving || !isValidHttpUrl(url)}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                url: normalizeUrl(url),
                alt: safeTrim(alt),
                shape,
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
  onSave: (content: any) => Promise<void>;
}) {
  const [text, setText] = useState<string>(block.content?.text ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-xs text-white/50">Text</div>
        <textarea
          className="w-full min-h-[140px] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          placeholder="Write something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="text-xs text-white/40">
          Tip: переносы строк сохраняются.
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({ text });
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

function SortableBlockCard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        className="absolute left-3 top-3 z-10 cursor-grab select-none rounded-xl border border-white/10 bg-black/40 px-2 py-1 text-xs text-white/70 hover:bg-black/60 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        title="Drag to reorder"
      >
        ⠿
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteRow | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<null | "hero" | "links" | "image" | "text" | "divider">(null);
  const [insertMenuIndex, setInsertMenuIndex] = useState<number | null>(null);
  const [inserting, setInserting] = useState<null | { index: number; type: "hero" | "links" | "image" | "text" | "divider" }>(null);
  
  async function refreshAll() {
    setError(null);
    setLoading(true);
    try {
      const s = await ensureSiteForUser();
      setSite(s);
      const bs = await loadBlocks(s.id);
      setBlocks(bs);

      // Ensure at least one hero block (nice UX)
      if (!bs.some((b) => b.type === "hero")) {
        await createBlock(s.id, "hero");
        const bs2 = await loadBlocks(s.id);
        setBlocks(bs2);
      }
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  async function persistOrder(next: BlockRow[]) {
    if (!site) return;
    setBlocks(next);
    // persist positions as 1..n
    await Promise.all(
      next.map((b, i) => updateBlock(b.id, { position: i + 1 })),
    );
  }

  async function onDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(blocks, oldIndex, newIndex).map((b, idx) => ({
      ...b,
      position: idx + 1,
    }));
    try {
      await persistOrder(next);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      // fallback reload
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
      // 1) создаём блок стандартно (сейчас createBlock добавляет в конец)
      await createBlock(site.id, type);
  
      // 2) перезагружаем блоки
      const bs = await loadBlocks(site.id);
      setBlocks(bs);
  
      // 3) считаем, что новый блок — последний по position (обычно так и есть)
      const last = bs.reduce((acc, cur) => (cur.position > acc.position ? cur : acc), bs[0]);
      const oldIndex = bs.findIndex((b) => b.id === last.id);
      if (oldIndex === -1) return;
  
      // index — это "вставить ПЕРЕД блоком с этим индексом"
      const targetIndex = Math.max(0, Math.min(index, bs.length - 1));
  
      if (oldIndex === targetIndex) return;
  
      const next = arrayMove(bs, oldIndex, targetIndex).map((b, idx) => ({
        ...b,
        position: idx + 1,
      }));
  
      await persistOrder(next);
      setInsertMenuIndex(null);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      // fallback reload
      const bs2 = await loadBlocks(site.id);
      setBlocks(bs2);
    } finally {
      setInserting(null);
    }
  }
  
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-white/60 mt-2">
              Mini-site builder (A.1): edit blocks with inputs (no JSON).
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
            >
              Sign out
            </Button>
            <Link href={publicUrl} target="_blank" className="inline-flex">
              <span className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-white/10 hover:bg-white/15 transition">
                Open public page
              </span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <Card>
          <div className="p-6 space-y-4">
            <div>
              <div className="text-lg font-semibold">Theme</div>
              <div className="text-sm text-white/50">
                Customize colors, background and button style.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div className="space-y-1">
    <div className="text-xs text-white/50">Theme</div>
    <select
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
      value={site?.theme_key ?? "midnight"}
      onChange={async (e) => {
        if (!site) return;
        const theme_key = e.target.value;
        try {
          await updateSiteTheme(site.id, { theme_key });
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
  </div>

  <div className="space-y-1">
    <div className="text-xs text-white/50">Background</div>
    <select
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
      value={site?.background_style ?? "solid"}
      onChange={async (e) => {
        if (!site) return;
        const background_style = e.target.value;
        try {
          await updateSiteTheme(site.id, { background_style });
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
  </div>

  <div className="space-y-1">
    <div className="text-xs text-white/50">Buttons</div>
    <select
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
      value={site?.button_style ?? "solid"}
      onChange={async (e) => {
        if (!site) return;
        const button_style = e.target.value;
        try {
          await updateSiteTheme(site.id, { button_style });
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
  </div>

  <div className="space-y-1">
    <div className="text-xs text-white/50">Font</div>
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
  </div>

  <div className="space-y-1">
    <div className="text-xs text-white/50">Radius</div>
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
  </div>

  <div className="space-y-1">
    <div className="text-xs text-white/50">Card</div>
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
  </div>
</div>
<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
  <div className="text-xs text-white/50 mb-3">Live preview</div>

  <div className="overflow-hidden rounded-2xl border border-white/10">
  <SiteShell
  themeKey={site?.theme_key ?? "midnight"}
  backgroundStyle={(site?.background_style ?? "solid") as any}
  fontScale={(site as any)?.font_scale ?? "md"}
>

      <div className="space-y-3">
        <div className="text-center">
          <div className="text-xl font-bold text-[rgb(var(--text))]">
            Preview
          </div>
          <div className="text-sm text-[rgb(var(--muted))]">
            Theme + background + button style
          </div>
        </div>

        <LinkButton
          href="#"
          label="Example button"
          buttonStyle={(site?.button_style ?? "solid") as any}
        />
      </div>
    </SiteShell>
  </div>
</div>


            <div className="text-xs text-white/40">
              Changes save instantly. Open your public page to see updates.
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Blocks</div>
                <div className="text-sm text-white/50">
                  Site:{" "}
                  <span className="text-white/70">{site?.slug ?? "..."}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={refreshAll} disabled={loading}>
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                disabled={!site || loading || !!creating}
                onClick={async () => {
                  if (!site) return;
                  setCreating("hero");
                  try {
                    await createBlock(site.id, "hero");
                    const bs = await loadBlocks(site.id);
                    setBlocks(bs);
                  } catch (e: any) {
                    setError(e?.message ?? String(e));
                  } finally {
                    setCreating(null);
                  }
                }}
              >
                {creating === "hero" ? "Adding..." : "+ Hero"}
              </Button>

              <Button
                variant="primary"
                disabled={!site || loading || !!creating}
                onClick={async () => {
                  if (!site) return;
                  setCreating("links");
                  try {
                    await createBlock(site.id, "links");
                    const bs = await loadBlocks(site.id);
                    setBlocks(bs);
                  } catch (e: any) {
                    setError(e?.message ?? String(e));
                  } finally {
                    setCreating(null);
                  }
                }}
              >
                {creating === "links" ? "Adding..." : "+ Links"}
              </Button>

              <Button
                variant="primary"
                disabled={!site || loading || !!creating}
                onClick={async () => {
                  if (!site) return;
                  setCreating("image");
                  try {
                    await createBlock(site.id, "image");
                    const bs = await loadBlocks(site.id);
                    setBlocks(bs);
                  } catch (e: any) {
                    setError(e?.message ?? String(e));
                  } finally {
                    setCreating(null);
                  }
                }}
              >
                {creating === "image" ? "Adding..." : "+ Image"}
              </Button>

              <Button
                variant="primary"
                disabled={!site || loading || !!creating}
                onClick={async () => {
                  if (!site) return;
                  setCreating("text");
                  try {
                    await createBlock(site.id, "text");
                    const bs = await loadBlocks(site.id);
                    setBlocks(bs);
                  } catch (e: any) {
                    setError(e?.message ?? String(e));
                  } finally {
                    setCreating(null);
                  }
                }}
              >
                {creating === "text" ? "Adding..." : "+ Text"}
              </Button>

              <Button
                variant="primary"
                disabled={!site || loading || !!creating}
                onClick={async () => {
                  if (!site) return;
                  setCreating("divider");
                  try {
                    await createBlock(site.id, "divider");
                    const bs = await loadBlocks(site.id);
                    setBlocks(bs);
                  } catch (e: any) {
                    setError(e?.message ?? String(e));
                  } finally {
                    setCreating(null);
                  }
                }}
              >
                {creating === "divider" ? "Adding..." : "+ Divider"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {/* Insert at very top */}
              <InsertBlockMenu
  insertIndex={0}
  isOpen={insertMenuIndex === 0}
  onToggle={() => setInsertMenuIndex(insertMenuIndex === 0 ? null : 0)}
  onInsert={(t) => insertBlockAt(0, t)}
  disabled={!site || loading || !!creating || !!inserting}
  inserting={inserting}
/>

{blocks.map((b, idx) => {
  const isHero = b.type === "hero";
  const isLinks = b.type === "links";
  const isText = b.type === "text";
  const isImage = b.type === "image";
  const isDivider = b.type === "divider";

  // Insert index "before next block" (idx+1)
  const insertIndex = idx + 1;

  return (
    <div key={b.id} className="space-y-3">
      <SortableBlockCard id={b.id}>
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs rounded-full bg-white/10 px-3 py-1">
                  {b.type}
                </span>
                <span className="text-xs text-white/40">pos {b.position}</span>
                {!b.is_visible && (
                  <span className="text-xs text-yellow-200/80">hidden</span>
                )}
              </div>
            </div>

            {isHero && (
              <HeroEditor
                block={b}
                onSave={async (content) => {
                  await updateBlock(b.id, { content });
                  const bs = await loadBlocks(site!.id);
                  setBlocks(bs);
                }}
              />
            )}

            {isLinks && (
              <LinksEditor
                block={b}
                onSave={async (content) => {
                  await updateBlock(b.id, { content });
                  const bs = await loadBlocks(site!.id);
                  setBlocks(bs);
                }}
              />
            )}

            {isImage && (
              <ImageEditor
                block={b}
                onSave={async (content) => {
                  await updateBlock(b.id, { content });
                  const bs = await loadBlocks(site!.id);
                  setBlocks(bs);
                }}
              />
            )}

            {isText && (
              <TextEditor
                block={b}
                onSave={async (content) => {
                  await updateBlock(b.id, { content });
                  const bs = await loadBlocks(site!.id);
                  setBlocks(bs);
                }}
              />
            )}

            {isDivider && (
              <div className="flex justify-center py-4">
                <div className="h-px w-24 bg-white/20" />
              </div>
            )}
          </div>
        </Card>
      </SortableBlockCard>

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

            </SortableContext>
          </DndContext>
        </div>

        <div className="text-center text-xs text-white/35 pt-2">
          Powered by Mini-Site Builder
        </div>
      </div>
    </main>
  );
}
