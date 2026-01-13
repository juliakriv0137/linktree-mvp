"use client";

import * as React from "react";
import { BlockFrame } from "@/components/blocks/BlockFrame";
import { BlockRegistry } from "@/lib/blocks/registry";

export type LayoutWidth = "compact" | "wide" | "full" | "xwide" | "max";
export type Mode = "public" | "preview";

/**
 * Важно: этот тип импортят редакторы/registry.
 * Держим его экспортом, чтобы не ловить "no exported member".
 */
export type SiteBlockRow = {
  id: string;
  type: string;

  sort?: number | null;
  order?: number | null;

  page_id?: string | null;

  hidden?: boolean | null;

  anchor_id?: string | null;

  variant?: string | null;

  content?: any;
  style?: any;

  [key: string]: any;
};

export type BlocksRendererSiteCtx = {
  layout_width?: LayoutWidth;
  button_style?: string | null;
};

export type RenderProps = {
  block: SiteBlockRow;
  mode: Mode;
  site?: {
    layout_width?: LayoutWidth;
    button_style?: string | null;
  };
};

type BlocksRendererProps = {
  blocks: SiteBlockRow[];
  mode?: Mode;

  /**
   * Сюда часто прилетает "сырой" site из БД (layout_width: string | null)
   * Мы его нормализуем в BlocksRendererSiteCtx.
   */
  site?: {
    layout_width?: string | null;
    button_style?: string | null;
  };
};

function normalizeLayoutWidth(v: string | null | undefined): LayoutWidth | undefined {
  if (!v) return undefined;
  if (v === "compact" || v === "wide" || v === "full" || v === "xwide" || v === "max") return v;
  return undefined;
}

/**
 * Локальная нормализация anchor_id без зависимостей от lib/blocks/anchor.
 * Делаем безопасный id для якорей.
 */
function normalizeAnchorId(v: string | null | undefined): string | undefined {
  if (!v) return undefined;

  const s = String(v).trim();
  if (!s) return undefined;

  // lower + spaces to dash
  let out = s.toLowerCase().replace(/\s+/g, "-");

  // оставляем только латиницу/цифры/дефис/подчёркивание
  out = out.replace(/[^a-z0-9\-_]/g, "");

  // убираем повторяющиеся дефисы
  out = out.replace(/-+/g, "-").replace(/_+/g, "_");

  // убираем дефисы по краям
  out = out.replace(/^-+/, "").replace(/-+$/, "");

  if (!out) return undefined;
  return out;
}

export function BlocksRenderer({ blocks, mode = "public", site }: BlocksRendererProps) {
  const sorted = React.useMemo(() => {
    const arr = Array.isArray(blocks) ? [...blocks] : [];

    arr.sort((a, b) => {
      const ao =
        typeof a?.sort === "number"
          ? a.sort
          : typeof a?.order === "number"
            ? a.order
            : 0;

      const bo =
        typeof b?.sort === "number"
          ? b.sort
          : typeof b?.order === "number"
            ? b.order
            : 0;

      return ao - bo;
    });

    return arr;
  }, [blocks]);

  const siteCtx = React.useMemo<BlocksRendererSiteCtx | undefined>(() => {
    if (!site) return undefined;
    return {
      layout_width: normalizeLayoutWidth(site.layout_width),
      button_style: site.button_style ?? null,
    };
  }, [site]);

  return (
    <>
      {sorted.map((block) => {
        const entry = (BlockRegistry as any)[block.type];

        if (!entry) {
          return (
            <div
              key={block.id}
              className="border p-3 text-sm opacity-70"
              style={{ borderRadius: "var(--radius)" }}
            >
              Unknown block type: <span className="font-mono">{String(block.type)}</span>
            </div>
          );
        }

        const Comp = entry.render as React.ComponentType<RenderProps>;
        const anchorId = normalizeAnchorId(block.anchor_id);

        return (
          <BlockFrame key={block.id} block={block} anchorId={anchorId}>
            <Comp block={block} mode={mode} site={siteCtx} />
          </BlockFrame>
        );
      })}
    </>
  );
}
