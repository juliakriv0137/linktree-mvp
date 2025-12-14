import * as React from "react";
import type { SiteBlockRow } from "@/components/blocks/BlocksRenderer";
import { LinkButton } from "@/components/site/LinkButton";

type RenderProps = {
  block: SiteBlockRow;
  mode: "public" | "preview";
  site?: {
    layout_width?: "compact" | "wide" | "full" | string | null;
    button_style?: "solid" | "outline" | "soft" | string | null;
  };
};

export type BlockEntry = {
  title: string;
  render: (props: RenderProps) => React.ReactElement | null;
};

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function normalizeUrl(raw: any) {
  const v = safeTrim(raw);
  if (!v) return "";
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

function justifyClassFromAlign(align: "left" | "center" | "right") {
  return align === "left"
    ? "justify-start"
    : align === "right"
      ? "justify-end"
      : "justify-center";
}

function linksBlockWidthClass(layoutWidth: "compact" | "wide" | "full") {
  return layoutWidth === "full"
    ? "mx-auto w-full max-w-5xl"
    : layoutWidth === "wide"
      ? "mx-auto w-full max-w-4xl"
      : "mx-auto w-full max-w-md";
}

function buttonRowWidthClass(layoutWidth: "compact" | "wide" | "full") {
  return layoutWidth === "compact"
    ? "w-[280px] max-w-full"
    : "w-[320px] max-w-full";
}

export const BlockRegistry: Record<string, BlockEntry> = {
  divider: {
    title: "Divider",
    render: () => (
      <div className="flex justify-center py-2">
        <div className="h-px w-24 bg-white/20" />
      </div>
    ),
  },

  hero: {
    title: "Hero",
    render: ({ block }) => {
      const c = asObj(block.content);

      const title = safeTrim(c?.title) || " ";
      const subtitle = safeTrim(c?.subtitle);

      const titleSize = (c?.title_size as "sm" | "md" | "lg" | undefined) ?? "lg";
      const subtitleSize = (c?.subtitle_size as "sm" | "md" | "lg" | undefined) ?? "md";
      const align = (c?.align as "left" | "center" | "right" | undefined) ?? "center";

      const titleClass =
        titleSize === "sm" ? "text-xl" : titleSize === "md" ? "text-2xl" : "text-3xl";

      const subtitleClass =
        subtitleSize === "sm" ? "text-sm" : subtitleSize === "lg" ? "text-lg" : "text-base";

      const alignClass =
        align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

      return (
        <div className={`${alignClass} space-y-2`}>
          <div className={`${titleClass} font-bold text-[rgb(var(--text))]`}>{title}</div>
          {subtitle ? (
            <div className={`${subtitleClass} text-[rgb(var(--muted))]`}>{subtitle}</div>
          ) : null}
        </div>
      );
    },
  },

  image: {
    title: "Image",
    render: ({ block }) => {
      const c = asObj(block.content);

      const url = normalizeUrl(c?.url);
      const alt = safeTrim(c?.alt) || "Image";
      const shape = (c?.shape as "circle" | "rounded" | "square" | undefined) ?? "circle";

      const radius =
        shape === "circle" ? "9999px" : shape === "rounded" ? "24px" : "0px";

      if (!url) return null;

      return (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt}
            className="h-28 w-28 object-cover"
            style={{ borderRadius: radius }}
          />
        </div>
      );
    },
  },

  text: {
    title: "Text",
    render: ({ block }) => {
      const c = asObj(block.content);

      const text = safeTrim(c?.text);
      if (!text) return null;

      const size = (c?.size as "sm" | "md" | "lg" | undefined) ?? "md";
      const align = (c?.align as "left" | "center" | "right" | undefined) ?? "left";

      const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";

      const alignClass =
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

      return (
        <div className={`${sizeClass} ${alignClass} text-[rgb(var(--text))] whitespace-pre-wrap`}>
          {text}
        </div>
      );
    },
  },

  links: {
    title: "Links",
    render: ({ block, site }) => {
      const c = asObj(block.content);

      const layoutWidth = ((site?.layout_width ?? "compact") as any) as "compact" | "wide" | "full";
      const blockWidth = linksBlockWidthClass(layoutWidth);
      const rowWidth = buttonRowWidthClass(layoutWidth);

      const itemsRaw = Array.isArray(c?.items) ? c.items : [];
      const items = itemsRaw
        .map((x: any) => ({
          title: safeTrim(x?.title),
          url: normalizeUrl(x?.url),
          align: (x?.align as "left" | "center" | "right" | undefined) ?? null,
        }))
        .filter((x: any) => x.title && x.url);

      if (!items.length) return null;

      const blockAlign = (c?.align as "left" | "center" | "right" | undefined) ?? "center";

      const buttonStyle =
        ((site as any)?.button_style as "solid" | "outline" | "soft" | undefined) ?? "solid";

      return (
        <div className="w-full">
          <div className={blockWidth}>
            <div className="space-y-4">
              {items.map((it: any, i: number) => {
                const a = (it.align as "left" | "center" | "right" | null) ?? blockAlign;
                const rowAlignClass = a === "left" ? "mr-auto" : a === "right" ? "ml-auto" : "mx-auto";

                return (
                  <div key={`${block.id}-${i}`} className={`${rowWidth} ${rowAlignClass}`}>
                    <LinkButton href={it.url} label={it.title} buttonStyle={buttonStyle} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    },
  },
};
