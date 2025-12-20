import * as React from "react";
import type { SiteBlockRow } from "@/components/blocks/BlocksRenderer";
import { LinkButton } from "@/components/site/LinkButton";
import { HeaderBlockClient } from "@/components/site/HeaderBlockClient";

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

type ButtonStyle = "solid" | "outline" | "soft";

/* ---------------- helpers ---------------- */

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function normalizeUrl(raw: any) {
  const v = safeTrim(raw);
  if (!v) return "";
  if (v.startsWith("#")) return v; // anchors
  if (v.startsWith("/")) return v; // relative
  if (/^(mailto:|tel:|sms:)/i.test(v)) return v; // non-http
  if (/^https?:\/\//i.test(v)) return v; // absolute
  return `https://${v}`; // domain -> https
}

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

function normalizeAlign(v: any): "left" | "center" | "right" {
  return v === "left" || v === "center" || v === "right" ? v : "left";
}

function coerceButtonStyle(v: any): ButtonStyle {
  return v === "solid" || v === "outline" || v === "soft" ? v : "solid";
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
 * ВАЖНО: возвращаем ТОЛЬКО ширину.
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
      return "w-[28rem]";
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
    default:
      return undefined;
  }
}

function heroRadiusValue(radius: string) {
  switch (String(radius || "").toLowerCase()) {
    case "none":
      return "0px";
    case "sm":
      return "12px";
    case "md":
      return "16px";
    case "lg":
      return "20px";
    case "xl":
      return "24px";
    case "2xl":
      return "32px";
    case "full":
      return "9999px";
    default:
      return "var(--radius,15px)";
  }
}

/* ---------------- registry ---------------- */

export const BlockRegistry: Record<string, BlockEntry> = {
  divider: {
    title: "Divider",
    render: () => (
      <div className="flex justify-center py-2">
        <div className="h-px w-24 bg-[rgb(var(--divider))] opacity-60" />
      </div>
    ),
  },

  header: {
    title: "Header",
    render: ({ block }) => {
      const c = asObj(block.content);
      const variant = String((block as any).variant ?? "default");

      const brandText = safeTrim(c.brand_text ?? "My Site");
      const brandUrl = normalizeUrl(c.brand_url ?? "");
      const logoUrl = safeTrim(c.logo_url ?? "");

      const links = Array.isArray(c.links) ? c.links : [];
      const items = links
        .map((x: any) => ({ label: safeTrim(x.label), url: normalizeUrl(x.url) }))
        .filter((x: any) => x.label && x.url);

      const showCta = Boolean(c.show_cta);
      const ctaLabel = safeTrim(c.cta_label ?? "");
      const ctaUrl = normalizeUrl(c.cta_url ?? "");

      return (
        <HeaderBlockClient
          variant={variant}
          brandText={brandText}
          brandUrl={brandUrl}
          logoUrl={logoUrl}
          items={items}
          hasCta={showCta && !!ctaLabel && !!ctaUrl}
          ctaLabel={ctaLabel}
          ctaUrl={ctaUrl}
        />
      );
    },
  },

  hero: {
    title: "Hero",
    render: ({ block }) => {
      const c = asObj(block.content);
      const s = asObj((block as any).style);
      const variant = (block as any).variant ?? "default";

      const title = safeTrim(c.title) || " ";
      const subtitle = safeTrim(c.subtitle);

      const primaryTitle = safeTrim(c.primary_button_title);
      const primaryUrl = safeTrim(c.primary_button_url);
      const secondaryTitle = safeTrim(c.secondary_button_title);
      const secondaryUrl = safeTrim(c.secondary_button_url);

      const hasPrimary = !!primaryTitle && !!primaryUrl;
      const hasSecondary = !!secondaryTitle && !!secondaryUrl;

      const titleSize = (c.title_size ?? "lg") as "sm" | "md" | "lg";
      const subtitleSize = (c.subtitle_size ?? "md") as "sm" | "md" | "lg";

      const titleClass = titleSize === "sm" ? "text-xl" : titleSize === "md" ? "text-2xl" : "text-3xl";
      const subtitleClass = subtitleSize === "sm" ? "text-sm" : subtitleSize === "lg" ? "text-lg" : "text-base";

      const imageSide = (c.image_side ?? "right") as "left" | "right";
      const imageSize = String(c.image_size ?? "md");
      const imageRatio = String(c.image_ratio ?? "square");

      const imgBoxWClass = heroImageSizeClass(imageSize);
      const ratioStyle = heroAspectRatioStyle(imageRatio);

      /* ---------- BACKGROUND ---------- */
      if (variant === "background") {
        const bgUrl = safeTrim(c.avatar ?? "");
        const overlay = String(c.bg_overlay ?? "medium");

        const overlayClass =
          overlay === "soft" ? "bg-black/30" : overlay === "strong" ? "bg-black/70" : "bg-black/50";

        const bgHeight = String(c.bg_height ?? "md");
        const bgRadius = String(c.bg_radius ?? "2xl");
        const radius = heroRadiusValue(bgRadius);

        const align = normalizeAlign(c.align ?? "left");
        const verticalAlign = String(c.vertical_align ?? "center") as "top" | "center" | "bottom";

        const verticalAlignClass =
          verticalAlign === "top" ? "justify-start" : verticalAlign === "bottom" ? "justify-end" : "justify-center";

        const textAlignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
        const ctaJustifyClass =
          align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

        const heightClass =
          bgHeight === "sm"
            ? "min-h-[320px] py-10 md:py-14"
            : bgHeight === "lg"
              ? "min-h-[560px] py-24 md:py-32"
              : bgHeight === "xl"
                ? "min-h-[720px] py-28 md:py-40"
                : "min-h-[420px] py-14 md:py-20";

        return (
          <div className="relative overflow-hidden min-w-0 w-full" style={{ borderRadius: radius }}>
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                borderRadius: radius,
                backgroundImage: bgUrl ? `url(${normalizeUrl(bgUrl)})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className={overlayClass + " absolute inset-0"} />

            <div className={`relative ${heightClass} px-6 md:px-10 min-w-0 flex flex-col ${verticalAlignClass}`}>
              <div
                className={`space-y-3 min-w-0 max-w-3xl ${textAlignClass} ${
                  align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : ""
                }`}
              >
                <div className={titleClass + " font-bold text-white leading-tight"}>{title}</div>

                {subtitle ? (
                  <div
                    className={subtitleClass + " text-white/80 leading-relaxed whitespace-pre-wrap min-w-0"}
                    style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                  >
                    {subtitle}
                  </div>
                ) : null}
              </div>

              {hasPrimary || hasSecondary ? (
                <div className={`flex flex-wrap items-center gap-3 pt-6 w-full ${ctaJustifyClass}`}>
                  {hasPrimary ? (
                    <LinkButton href={normalizeUrl(primaryUrl)} label={primaryTitle} buttonStyle="solid" />
                  ) : null}

                  {hasSecondary ? (
                    <LinkButton href={normalizeUrl(secondaryUrl)} label={secondaryTitle} buttonStyle="outline" />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        );
      }

      /* ---------- SPLIT ---------- */
      if (variant === "split") {
        // сначала style.align (если зададим в Style табе), иначе content.align
        const splitAlign = normalizeAlign(s.align ?? c.align);

        const textAlignClass =
          splitAlign === "center" ? "text-center" : splitAlign === "right" ? "text-right" : "text-left";
        const textWrapClass = splitAlign === "center" ? "mx-auto" : splitAlign === "right" ? "ml-auto" : "";
        const splitCtaJustifyClass =
          splitAlign === "center" ? "justify-center" : splitAlign === "right" ? "justify-end" : "justify-start";

        // ✅ Radius: берём из block.style.radius (приоритет), иначе из content.radius, иначе var(--radius)
        const radiusRaw = (s as any)?.radius ?? (c as any)?.radius;
        const radiusValue =
          typeof radiusRaw === "number"
            ? `${radiusRaw}px`
            : typeof radiusRaw === "string" && radiusRaw.trim()
              ? radiusRaw.trim()
              : "var(--radius)";
        const radiusStyle: React.CSSProperties = { borderRadius: radiusValue };

        const textCol = (
          <div className="min-w-0 w-full">
            <div className={`space-y-4 min-w-0 max-w-xl ${textAlignClass} ${textWrapClass}`}>
              <div className={`${titleClass} font-bold text-[rgb(var(--text))] leading-tight`}>{title}</div>

              {subtitle ? (
                <div
                  className={`${subtitleClass} text-[rgb(var(--muted))] leading-relaxed whitespace-pre-wrap min-w-0`}
                  style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                >
                  {subtitle}
                </div>
              ) : null}

              {hasPrimary || hasSecondary ? (
                <div className={`flex flex-wrap items-center gap-3 pt-2 w-full ${splitCtaJustifyClass}`}>
                  {hasPrimary ? (
                    <LinkButton href={normalizeUrl(primaryUrl)} label={primaryTitle} buttonStyle="solid" />
                  ) : null}

                  {hasSecondary ? (
                    <LinkButton href={normalizeUrl(secondaryUrl)} label={secondaryTitle} buttonStyle="outline" />
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        );

        const imgUrl = safeTrim(c.avatar);

        const imgCol = imgUrl ? (
          <div className="flex justify-center md:justify-end min-w-0">
            <div
              className={`${imgBoxWClass} overflow-hidden bg-white/5 border border-white/10`}
              style={{
                ...(ratioStyle ?? {}),
                ...radiusStyle, // ✅ применяем radius именно сюда (а не фиксированный var(--radius,15px))
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={normalizeUrl(imgUrl)}
                alt="Hero image"
                className={ratioStyle ? "w-full h-full object-cover" : "w-full h-auto object-contain"}
              />
            </div>
          </div>
        ) : null;

        const splitVerticalAlign = String(c.vertical_align ?? "center") as "top" | "center" | "bottom";
        const splitItemsAlignClass =
          splitVerticalAlign === "top" ? "items-start" : splitVerticalAlign === "bottom" ? "items-end" : "items-center";

        return (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 min-w-0 ${splitItemsAlignClass}`}>
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

      /* ---------- DEFAULT ---------- */
      const align = normalizeAlign(c.align ?? "center");
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

      const url = normalizeUrl(c.url);
      const alt = safeTrim(c.alt) || "Image";
      const shape = (c.shape as "circle" | "rounded" | "square" | undefined) ?? "circle";
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

      const text = safeTrim(c.text);
      if (!text) return null;

      const size = (c.size as "sm" | "md" | "lg" | undefined) ?? "md";
      const align = normalizeAlign(c.align ?? "left");

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

      const itemsRaw = Array.isArray(c.items) ? c.items : [];
      const items = itemsRaw
        .map((x: any) => ({
          title: safeTrim(x.title),
          url: normalizeUrl(x.url),
          align: (x.align as "left" | "center" | "right" | undefined) ?? null,
        }))
        .filter((x: any) => x.title && x.url);

      if (!items.length) return null;

      const blockAlign = (c.align as "left" | "center" | "right" | undefined) ?? "center";
      const buttonStyle = coerceButtonStyle(site?.button_style);

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
