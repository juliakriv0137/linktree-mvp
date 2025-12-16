import * as React from "react";
import { BlockRegistry } from "@/lib/blocks/registry";

export type SiteBlockRow = {
  id: string;
  site_id: string;
  type: string;
  variant?: string | null;
  style?: Record<string, unknown> | null;
  content: Record<string, unknown> | null;
  anchor_id?: string | null;
  sort_order: number;
  is_hidden?: boolean | null;
};

export type BlocksRendererSiteCtx = {
  layout_width?: "compact" | "wide" | "full" | string | null;
  button_style?: "solid" | "outline" | "soft" | string | null;
};

export type BlocksRendererProps = {
  blocks: SiteBlockRow[];
  mode: "public" | "preview";
  site?: BlocksRendererSiteCtx;
};
function normalizeAnchorId(raw?: string | null) {
  if (!raw) return undefined;
  let s = String(raw).trim();
  if (!s) return undefined;
  if (s.startsWith("#")) s = s.slice(1).trim();
  if (!s) return undefined;
  // Keep it HTML-id friendly: letters/numbers/_/- ; convert spaces to "-"
  s = s.replace(/\s+/g, "-").replace(/[^A-Za-z0-9_-]/g, "");
  return s || undefined;
}

export function BlocksRenderer({ blocks, mode, site }: BlocksRendererProps) {
  const sorted = React.useMemo(() => {
    return [...blocks]
      .filter((b) => !b.is_hidden)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [blocks]);

  return (
    <>
      {sorted.map((block) => {
        const entry = BlockRegistry[block.type];
        if (!entry) {
          return (
            <div key={block.id} className="rounded-xl border p-3 text-sm opacity-70">
              Unknown block type: <span className="font-mono">{block.type}</span>
            </div>
          );
        }

        const Comp = entry.render;

        const anchorId = normalizeAnchorId(block.anchor_id);

return (
  <section
    id={anchorId}
    data-anchor-id={anchorId}
    key={block.id}
    className="scroll-mt-24"
  >
    <Comp block={block} mode={mode} site={site} />
  </section>
);

      })}
    </>
  );
}
