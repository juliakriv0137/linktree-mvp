"use client";

import * as React from "react";
import { Button } from "@/components/dashboard/ui/Button";

export type ProductsContent = {
  title?: string | null;
  subtitle?: string | null;

  layout?: "grid" | "list";
  columns?: 1 | 2 | 3;
  limit?: number;

  show_price?: boolean;
  show_description?: boolean;
  description_max_chars?: number;

  show_button?: boolean;
  button_label?: string | null;
  open_in_new_tab?: boolean;

  image_ratio?: "4/3" | "1/1" | "16/9" | "3/4";
  image_fit?: "cover" | "contain";

  header_align?: "left" | "center" | "right";

  // ✅ NEW
  grid_max_width?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  card_size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  gap?: 2 | 3 | 4 | 5 | 6 | 8;
  card_padding?: "sm" | "md" | "lg";
  image_radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
};

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function clampNumber(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

const labelCls = "text-[11px] font-semibold text-[rgb(var(--db-muted))] mb-2";
const fieldBase =
  "w-full rounded-2xl border border-[rgb(var(--db-border))] bg-white px-3 py-2 text-sm text-[rgb(var(--db-text))] " +
  "placeholder:text-[rgb(var(--db-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.25)]";

export default function ProductsEditor(props: {
  value: ProductsContent;
  saving?: boolean;
  onSave: (next: ProductsContent) => Promise<void> | void;
}) {
  const saving = Boolean(props.saving);
  const initial = props.value ?? {};

  const [title, setTitle] = React.useState<string>(safeTrim(initial.title) || "Products");
  const [subtitle, setSubtitle] = React.useState<string>(safeTrim(initial.subtitle));

  const [layout, setLayout] = React.useState<"grid" | "list">((initial.layout as any) === "list" ? "list" : "grid");
  const [columns, setColumns] = React.useState<1 | 2 | 3>(
    initial.columns === 1 || initial.columns === 2 || initial.columns === 3 ? initial.columns : 2,
  );
  const [limit, setLimit] = React.useState<number>(clampNumber(initial.limit, 1, 200, 60));

  const [showPrice, setShowPrice] = React.useState<boolean>(initial.show_price !== false);
  const [showDescription, setShowDescription] = React.useState<boolean>(initial.show_description !== false);
  const [descMax, setDescMax] = React.useState<number>(clampNumber(initial.description_max_chars, 20, 500, 140));

  const [showButton, setShowButton] = React.useState<boolean>(initial.show_button !== false);
  const [buttonLabel, setButtonLabel] = React.useState<string>(safeTrim(initial.button_label) || "View product");
  const [newTab, setNewTab] = React.useState<boolean>(Boolean(initial.open_in_new_tab));

  const [imageRatio, setImageRatio] = React.useState<ProductsContent["image_ratio"]>((initial.image_ratio as any) || "4/3");
  const [imageFit, setImageFit] = React.useState<"cover" | "contain">((initial.image_fit as any) === "contain" ? "contain" : "cover");

  const [headerAlign, setHeaderAlign] = React.useState<"left" | "center" | "right">(
    (initial.header_align as any) === "left" || (initial.header_align as any) === "right" ? (initial.header_align as any) : "center",
  );

  // ✅ NEW sizing
  const [gridMaxWidth, setGridMaxWidth] = React.useState<NonNullable<ProductsContent["grid_max_width"]>>(
    (initial.grid_max_width as any) || "lg",
  );
  const [cardSize, setCardSize] = React.useState<NonNullable<ProductsContent["card_size"]>>((initial.card_size as any) || "md");
  const [gap, setGap] = React.useState<NonNullable<ProductsContent["gap"]>>((initial.gap as any) || 4);
  const [cardPadding, setCardPadding] = React.useState<NonNullable<ProductsContent["card_padding"]>>(
    (initial.card_padding as any) || "md",
  );
  const [imageRadius, setImageRadius] = React.useState<NonNullable<ProductsContent["image_radius"]>>(
    (initial.image_radius as any) || "2xl",
  );

  async function handleSave() {
    const next: ProductsContent = {
      title: safeTrim(title) || "Products",
      subtitle: safeTrim(subtitle) || null,

      layout,
      columns: layout === "grid" ? columns : 1,
      limit: clampNumber(limit, 1, 200, 60),

      show_price: Boolean(showPrice),
      show_description: Boolean(showDescription),
      description_max_chars: clampNumber(descMax, 20, 500, 140),

      show_button: Boolean(showButton),
      button_label: safeTrim(buttonLabel) || "View product",
      open_in_new_tab: Boolean(newTab),

      image_ratio: imageRatio || "4/3",
      image_fit: imageFit,

      header_align: headerAlign,

      // ✅ NEW
      grid_max_width: gridMaxWidth,
      card_size: cardSize,
      gap,
      card_padding: cardPadding,
      image_radius: imageRadius,
    };

    await props.onSave(next);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Products block</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2">
            <div className={labelCls}>Title</div>
            <input className={fieldBase} value={title} onChange={(e) => setTitle(e.target.value)} disabled={saving} />
          </label>

          <label className="block sm:col-span-2">
            <div className={labelCls}>Subtitle</div>
            <input className={fieldBase} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Optional" disabled={saving} />
          </label>

          <label className="block">
            <div className={labelCls}>Layout</div>
            <select className={fieldBase} value={layout} onChange={(e) => setLayout(e.target.value as any)} disabled={saving}>
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </label>

          <label className="block">
            <div className={labelCls}>Columns (grid)</div>
            <select
              className={fieldBase}
              value={String(columns)}
              onChange={(e) => setColumns(Number(e.target.value) as any)}
              disabled={saving || layout !== "grid"}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </label>

          <label className="block">
            <div className={labelCls}>Limit</div>
            <input
              className={fieldBase}
              value={String(limit)}
              onChange={(e) => setLimit(clampNumber(e.target.value, 1, 200, 60))}
              inputMode="numeric"
              disabled={saving}
            />
          </label>

          <label className="block">
            <div className={labelCls}>Header align</div>
            <select className={fieldBase} value={headerAlign} onChange={(e) => setHeaderAlign(e.target.value as any)} disabled={saving}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>

          <label className="block">
            <div className={labelCls}>Image ratio</div>
            <select className={fieldBase} value={imageRatio || "4/3"} onChange={(e) => setImageRatio(e.target.value as any)} disabled={saving}>
              <option value="4/3">4:3</option>
              <option value="1/1">1:1</option>
              <option value="16/9">16:9</option>
              <option value="3/4">3:4</option>
            </select>
          </label>

          <label className="block">
            <div className={labelCls}>Image fit</div>
            <select className={fieldBase} value={imageFit} onChange={(e) => setImageFit(e.target.value as any)} disabled={saving}>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </label>
        </div>
      </div>

      {/* ✅ NEW: sizing section */}
      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Sizing</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <div className={labelCls}>Block max width</div>
            <select className={fieldBase} value={gridMaxWidth} onChange={(e) => setGridMaxWidth(e.target.value as any)} disabled={saving}>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">XL</option>
              <option value="2xl">2XL</option>
              <option value="full">Full</option>
            </select>
          </label>

          <label className="block">
            <div className={labelCls}>Card size</div>
            <select className={fieldBase} value={cardSize} onChange={(e) => setCardSize(e.target.value as any)} disabled={saving}>
              <option value="xs">XS</option>
              <option value="sm">S</option>
              <option value="md">M</option>
              <option value="lg">L</option>
              <option value="xl">XL</option>
              <option value="2xl">2XL</option>
            </select>
          </label>

          <label className="block">
            <div className={labelCls}>Gap</div>
            <select className={fieldBase} value={String(gap)} onChange={(e) => setGap(Number(e.target.value) as any)} disabled={saving}>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="8">8</option>
            </select>
          </label>

          <label className="block">
            <div className={labelCls}>Card padding</div>
            <select className={fieldBase} value={cardPadding} onChange={(e) => setCardPadding(e.target.value as any)} disabled={saving}>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </label>

          <label className="block sm:col-span-2">
            <div className={labelCls}>Image radius</div>
            <select className={fieldBase} value={imageRadius} onChange={(e) => setImageRadius(e.target.value as any)} disabled={saving}>
              <option value="none">None</option>
              <option value="sm">SM</option>
              <option value="md">MD</option>
              <option value="lg">LG</option>
              <option value="xl">XL</option>
              <option value="2xl">2XL</option>
              <option value="full">Full</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Visibility</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-[rgb(var(--db-text))]">
            <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} disabled={saving} />
            Show price
          </label>

          <label className="flex items-center gap-2 text-sm text-[rgb(var(--db-text))]">
            <input
              type="checkbox"
              checked={showDescription}
              onChange={(e) => setShowDescription(e.target.checked)}
              disabled={saving}
            />
            Show description
          </label>

          <label className="block sm:col-span-2">
            <div className={labelCls}>Description max chars</div>
            <input
              className={fieldBase}
              value={String(descMax)}
              onChange={(e) => setDescMax(clampNumber(e.target.value, 20, 500, 140))}
              inputMode="numeric"
              disabled={saving || !showDescription}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-3">
        <div className="text-sm font-semibold text-[rgb(var(--db-text))]">Button</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-[rgb(var(--db-text))]">
            <input type="checkbox" checked={showButton} onChange={(e) => setShowButton(e.target.checked)} disabled={saving} />
            Show button
          </label>

          <label className="flex items-center gap-2 text-sm text-[rgb(var(--db-text))]">
            <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} disabled={saving} />
            Open in new tab
          </label>

          <label className="block sm:col-span-2">
            <div className={labelCls}>Button label</div>
            <input
              className={fieldBase}
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
              disabled={saving || !showButton}
            />
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
