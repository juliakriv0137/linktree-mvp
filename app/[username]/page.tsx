import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { SiteShell } from "@/components/site/SiteShell";
import { LinkButton } from "@/components/site/LinkButton";

type SiteRow = {
  id: string;
  slug: string;
  name: string | null;

  theme_key: string;
  background_style: string;
  button_style: string;

  font_scale?: "sm" | "md" | "lg";
  button_radius?: "md" | "xl" | "2xl" | "full";
  card_style?: "plain" | "card";

  layout_width?: "compact" | "wide" | "full";

  bg_color?: string | null;
  text_color?: string | null;
  muted_color?: string | null;
  border_color?: string | null;
  button_color?: string | null;
  button_text_color?: string | null;
};

type BlockRow = {
  id: string;
  site_id: string;
  type: "hero" | "links" | "image" | "text" | "divider";
  content: any;
  position: number;
  is_visible: boolean;
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

function layoutToContainerClasses(
  layout: "compact" | "wide" | "full" | null | undefined,
) {
  if (layout === "full") {
    return "mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-14 py-12";
  }
  if (layout === "wide") {
    return "mx-auto w-full max-w-6xl px-6 sm:px-10 lg:px-14 py-12";
  }
  return "mx-auto w-full max-w-lg px-4 py-10";
}

function fontScaleToCss(fontScale: SiteRow["font_scale"]) {
  if (fontScale === "sm") return "0.95rem";
  if (fontScale === "lg") return "1.08rem";
  return "1rem";
}

function justifyClassFromAlign(align: "left" | "center" | "right") {
  return align === "left"
    ? "justify-start"
    : align === "right"
      ? "justify-end"
      : "justify-center";
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  // 1) site by slug
  const { data: site, error: siteErr } = await supabase
    .from("sites")
    .select("*")
    .eq("slug", username)
    .maybeSingle();

  if (siteErr) throw siteErr;
  if (!site) return notFound();

  const s = site as SiteRow;

  // 2) blocks
  const { data: blocks, error: blocksErr } = await supabase
    .from("site_blocks")
    .select("*")
    .eq("site_id", s.id)
    .order("position", { ascending: true });

  if (blocksErr) throw blocksErr;

  const visibleBlocks = (blocks ?? []).filter((b: BlockRow) => b.is_visible);

  const layoutWidth = (s.layout_width ?? "compact") as "compact" | "wide" | "full";
  const containerClass = layoutToContainerClasses(layoutWidth);
  const fontSize = fontScaleToCss(s.font_scale ?? "md");

  // “блок links” как у сайта: ограничиваем максимальную ширину области,
  // относительно которой работает left/center/right
  const linksBlockWidthClass =
  layoutWidth === "full"
    ? "mx-auto w-full max-w-5xl"
    : layoutWidth === "wide"
      ? "mx-auto w-full max-w-4xl"
      : "mx-auto w-full max-w-md";


  // Ширина “карточки кнопки” (LinkButton внутри = w-full)
  // В wide/full делаем “сайтовую” ширину; в compact — на всю ширину контейнера
  const buttonRowWidthClass =
  layoutWidth === "full" || layoutWidth === "wide" ? "w-[320px] max-w-full" : "w-full";


  return (
    <SiteShell
      themeKey={s.theme_key ?? "midnight"}
      backgroundStyle={(s.background_style ?? "solid") as any}
      buttonStyle={(s.button_style ?? "solid") as any}
      fontScale={(s.font_scale ?? "md") as any}
      buttonRadius={(s.button_radius ?? "2xl") as any}
      cardStyle={(s.card_style ?? "card") as any}
      layoutWidth={layoutWidth}
      themeOverrides={{
        bg_color: s.bg_color ?? null,
        text_color: s.text_color ?? null,
        muted_color: s.muted_color ?? null,
        border_color: s.border_color ?? null,
        button_color: s.button_color ?? null,
        button_text_color: s.button_text_color ?? null,
      }}
    >
      {/* Fallback font scale */}
      <div style={{ fontSize }}>
        <div className={containerClass}>
          <div
            style={{
              background: "var(--card-bg)",
              border: "var(--card-border)",
              boxShadow: "var(--card-shadow)",
              padding: "var(--card-padding)",
              borderRadius: "var(--button-radius)",
            }}
          >
            <div className="space-y-6">
              {visibleBlocks.map((b: BlockRow) => {
                if (b.type === "divider") {
                  return (
                    <div key={b.id} className="flex justify-center py-2">
                      <div className="h-px w-24 bg-white/20" />
                    </div>
                  );
                }

                if (b.type === "hero") {
                  const title = safeTrim(b.content?.title) || " ";
                  const subtitle = safeTrim(b.content?.subtitle);

                  const titleSize =
                    (b.content?.title_size as "sm" | "md" | "lg" | undefined) ?? "lg";
                  const subtitleSize =
                    (b.content?.subtitle_size as "sm" | "md" | "lg" | undefined) ??
                    "md";
                  const align =
                    (b.content?.align as "left" | "center" | "right" | undefined) ??
                    "center";

                  const titleClass =
                    titleSize === "sm" ? "text-xl" : titleSize === "md" ? "text-2xl" : "text-3xl";

                  const subtitleClass =
                    subtitleSize === "sm"
                      ? "text-sm"
                      : subtitleSize === "lg"
                        ? "text-lg"
                        : "text-base";

                  const alignClass =
                    align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";

                  return (
                    <div key={b.id} className={`${alignClass} space-y-2`}>
                      <div className={`${titleClass} font-bold text-[rgb(var(--text))]`}>{title}</div>
                      {subtitle ? (
                        <div className={`${subtitleClass} text-[rgb(var(--muted))]`}>{subtitle}</div>
                      ) : null}
                    </div>
                  );
                }

                if (b.type === "image") {
                  const url = normalizeUrl(b.content?.url);
                  const alt = safeTrim(b.content?.alt) || "Image";
                  const shape = (b.content?.shape as "circle" | "rounded" | "square") ?? "circle";

                  const radius = shape === "circle" ? "9999px" : shape === "rounded" ? "24px" : "0px";

                  if (!url) return null;

                  return (
                    <div key={b.id} className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={alt}
                        className="h-28 w-28 object-cover"
                        style={{ borderRadius: radius }}
                      />
                    </div>
                  );
                }

                if (b.type === "text") {
                  const text = safeTrim(b.content?.text);
                  if (!text) return null;

                  const size = (b.content?.size as "sm" | "md" | "lg" | undefined) ?? "md";
                  const align =
                    (b.content?.align as "left" | "center" | "right" | undefined) ?? "left";

                  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";

                  const alignClass =
                    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

                  return (
                    <div
                      key={b.id}
                      className={`${sizeClass} ${alignClass} text-[rgb(var(--text))] whitespace-pre-wrap`}
                    >
                      {text}
                    </div>
                  );
                }

                if (b.type === "links") {
                  const itemsRaw = Array.isArray(b.content?.items) ? b.content.items : [];
                  const items = itemsRaw
                    .map((x: any) => ({
                      title: safeTrim(x?.title),
                      url: normalizeUrl(x?.url),
                      // поддерживаем и вариант "align на блоке", и вариант "align в каждой кнопке"
                      // (если у тебя в items уже есть align — он будет работать)
                      align: (x?.align as "left" | "center" | "right" | undefined) ?? null,
                    }))
                    .filter((x: any) => x.title && x.url);

                  if (!items.length) return null;

                  const blockAlign =
                    (b.content?.align as "left" | "center" | "right" | undefined) ?? "center";

                  return (
                    <div key={b.id} className="w-full">
                      {/* ограничиваем ширину “области блока links” как у сайта */}
                      <div className={linksBlockWidthClass}>
                        <div className="space-y-4">
                          {items.map((it: any, i: number) => {
                            const a = (it.align as "left" | "center" | "right" | null) ?? blockAlign;
                            const justifyClass = justifyClassFromAlign(a);

                            return (
                              <div key={`${b.id}-${i}`} className={`flex w-full ${justifyClass}`}>
                                <div className={buttonRowWidthClass}>
                                  <LinkButton
                                    href={it.url}
                                    label={it.title}
                                    buttonStyle={(s.button_style ?? "solid") as any}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              <div className="pt-2 text-center text-xs text-white/35">
                Powered by Mini-Site Builder
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
