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

function linksBlockWidthClass(layoutWidth: "compact" | "wide" | "full") {
  return layoutWidth === "full"
    ? "mx-auto w-full max-w-5xl"
    : layoutWidth === "wide"
      ? "mx-auto w-full max-w-4xl"
      : "mx-auto w-full max-w-md";
}

function buttonRowWidthClass(layoutWidth: "compact" | "wide" | "full") {
  return layoutWidth === "compact" ? "w-[280px] max-w-full" : "w-[320px] max-w-full";
}

/**
 * ВАЖНО:
 * Возвращаем ТОЛЬКО ширину.
 * Высоту будет считать aspectRatio.
 */
function heroImageSizeClass(size: string) {
  switch (size) {
    case "xs":
      return "w-28";
    case "sm":
      return "w-40";
    case "md":
      return "w-56";
    case "lg":
      return "w-72";
    case "xl":
      return "w-96";
    case "2xl":
      return "w-[28rem]"; // 448px
    default:
      return "w-56";
  }
}

function heroAspectRatioStyle(ratio: string): React.CSSProperties | undefined {
  switch (ratio) {
    case "square":
      return { aspectRatio: "1 / 1" };
    case "4:3":
      return { aspectRatio: "4 / 3" };
    case "16:9":
      return { aspectRatio: "16 / 9" };
    case "3:4":
      return { aspectRatio: "3 / 4" };
    case "9:16":
      return { aspectRatio: "9 / 16" };
    case "auto":
    default:
      return undefined;
  }
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
      const variant = (block as any).variant ?? "default";

      const title = safeTrim(c?.title) || " ";
      const subtitle = safeTrim(c?.subtitle);

      const primaryTitle = safeTrim((c as any)?.primary_button_title ?? "");
      const primaryUrl = safeTrim((c as any)?.primary_button_url ?? "");
      const secondaryTitle = safeTrim((c as any)?.secondary_button_title ?? "");
      const secondaryUrl = safeTrim((c as any)?.secondary_button_url ?? "");

      const hasPrimary = !!primaryTitle && !!primaryUrl;
      const hasSecondary = !!secondaryTitle && !!secondaryUrl;

      const titleSize = (c?.title_size ?? "lg") as "sm" | "md" | "lg";
      const subtitleSize = (c?.subtitle_size ?? "md") as "sm" | "md" | "lg";

      const titleClass =
        titleSize === "sm" ? "text-xl" : titleSize === "md" ? "text-2xl" : "text-3xl";
      const subtitleClass =
        subtitleSize === "sm" ? "text-sm" : subtitleSize === "lg" ? "text-lg" : "text-base";

      // split extras
      const imageSide = ((c as any)?.image_side ?? "right") as "left" | "right";
      const imageSize = String((c as any)?.image_size ?? "md");
      const imageRatio = String((c as any)?.image_ratio ?? "square");

      const imgBoxWClass = heroImageSizeClass(imageSize);
      const ratioStyle = heroAspectRatioStyle(imageRatio);

      if (variant === "split") {
        const textCol = (
          <div className="space-y-4 min-w-0">
            <div className="space-y-3 min-w-0">
              <div className={`${titleClass} font-bold text-[rgb(var(--text))] leading-tight`}>
                {title}
              </div>

              {subtitle ? (
                <div
                  className={`${subtitleClass} text-[rgb(var(--muted))] leading-relaxed min-w-0 whitespace-pre-wrap`}
                  style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                >
                  {subtitle}
                </div>
              ) : null}
            </div>

            {hasPrimary || hasSecondary ? (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {hasPrimary ? (
                  <a
                    href={normalizeUrl(primaryUrl)}
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold bg-[rgb(var(--primary))] text-[rgb(var(--button-text))] hover:opacity-90 transition"
                    style={{ borderRadius: "var(--button-radius)" as any }}
                  >
                    {primaryTitle}
                  </a>
                ) : null}

                {hasSecondary ? (
                  <a
                    href={normalizeUrl(secondaryUrl)}
                    className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold border border-white/15 bg-white/5 text-[rgb(var(--text))] hover:bg-white/10 transition"
                    style={{ borderRadius: "var(--button-radius)" as any }}
                  >
                    {secondaryTitle}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        );

        const imgUrl = safeTrim((c as any)?.avatar);

        const imgCol = imgUrl ? (
          <div className="flex justify-center md:justify-end min-w-0">
            {/* ВАЖНО: не задаём высоту. Только width + aspectRatio */}
            <div
              className={`${imgBoxWClass} overflow-hidden rounded-2xl bg-white/5`}
              style={{
                ...(ratioStyle ?? {}),
                borderRadius: "var(--button-radius)" as any,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={normalizeUrl(imgUrl)}
                alt="Hero image"
                className={
                  ratioStyle
                    ? "w-full h-full object-cover"
                    : "w-full h-auto object-contain"
                }
              />
            </div>
          </div>
        ) : null;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center min-w-0">
            {imageSide === "left" ? (
              <>
                {imgCol}
                {textCol}
              </>
            ) : (
              <>
                {textCol}
                {imgCol}
              </>
            )}
          </div>
        );
      }

      // default hero
      const align = (c?.align ?? "center") as "left" | "center" | "right";
      const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

      return (
        <div className={`${alignClass} space-y-2 min-w-0`}>
          <div className={`${titleClass} font-bold text-[rgb(var(--text))] leading-tight`}>{title}</div>

          {subtitle ? (
            <div
              className={`${subtitleClass} text-[rgb(var(--muted))] leading-relaxed min-w-0 whitespace-pre-wrap`}
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              {subtitle}
            </div>
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

      const radius = shape === "circle" ? "9999px" : shape === "rounded" ? "24px" : "0px";

      if (!url) return null;

      return (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt} className="h-28 w-28 object-cover" style={{ borderRadius: radius }} />
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
      const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

      return (
        <div
          className={`${sizeClass} ${alignClass} text-[rgb(var(--text))] whitespace-pre-wrap min-w-0`}
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
        >
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

export default BlockRegistry;
