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
  // compact = linktree-like (narrow)
  if (layout === "compact" || !layout) {
    return "mx-auto w-full max-w-md px-4 py-10";
  }

  // wide = centered page (wider)
  if (layout === "wide") {
    return "mx-auto w-full max-w-3xl px-6 sm:px-10 py-10";
  }

  // full = truly full width (widest)
  return "w-full max-w-none px-4 sm:px-10 lg:px-16 py-10";
}


function fontScaleToCss(fontScale: SiteRow["font_scale"]) {
  if (fontScale === "sm") return "0.95rem";
  if (fontScale === "lg") return "1.08rem";
  return "1rem";
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

  const containerClass = layoutToContainerClasses(s.layout_width ?? "compact");
  const fontSize = fontScaleToCss(s.font_scale ?? "md");

  return (
    <SiteShell
      themeKey={s.theme_key ?? "midnight"}
      backgroundStyle={(s.background_style ?? "solid") as any}
      buttonStyle={(s.button_style ?? "solid") as any}
      fontScale={(s.font_scale ?? "md") as any}
      buttonRadius={(s.button_radius ?? "2xl") as any}
      cardStyle={(s.card_style ?? "card") as any}
      themeOverrides={{
        bg_color: s.bg_color ?? null,
        text_color: s.text_color ?? null,
        muted_color: s.muted_color ?? null,
        border_color: s.border_color ?? null,
        button_color: s.button_color ?? null,
        button_text_color: s.button_text_color ?? null,
      }}
    >
      {/* ✅ Fallback font scale: если SiteShell вдруг не применил */}
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
                    (b.content?.title_size as "sm" | "md" | "lg" | undefined) ??
                    "lg";
                  const subtitleSize =
                    (b.content?.subtitle_size as "sm" | "md" | "lg" | undefined) ??
                    "md";
                  const align =
                    (b.content?.align as
                      | "left"
                      | "center"
                      | "right"
                      | undefined) ?? "center";

                  const titleClass =
                    titleSize === "sm"
                      ? "text-xl"
                      : titleSize === "md"
                        ? "text-2xl"
                        : "text-3xl";

                  const subtitleClass =
                    subtitleSize === "sm"
                      ? "text-sm"
                      : subtitleSize === "lg"
                        ? "text-lg"
                        : "text-base";

                  const alignClass =
                    align === "left"
                      ? "text-left"
                      : align === "right"
                        ? "text-right"
                        : "text-center";

                  return (
                    <div key={b.id} className={`${alignClass} space-y-2`}>
                      <div className={`${titleClass} font-bold text-[rgb(var(--text))]`}>
                        {title}
                      </div>
                      {subtitle ? (
                        <div className={`${subtitleClass} text-[rgb(var(--muted))]`}>
                          {subtitle}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                if (b.type === "image") {
                  const url = normalizeUrl(b.content?.url);
                  const alt = safeTrim(b.content?.alt) || "Image";
                  const shape = (b.content?.shape as "circle" | "rounded" | "square") ?? "circle";

                  const radius =
                    shape === "circle" ? "9999px" : shape === "rounded" ? "24px" : "0px";

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

                  const size =
                    (b.content?.size as "sm" | "md" | "lg" | undefined) ?? "md";
                  const align =
                    (b.content?.align as
                      | "left"
                      | "center"
                      | "right"
                      | undefined) ?? "left";

                  const sizeClass =
                    size === "sm"
                      ? "text-sm"
                      : size === "lg"
                        ? "text-lg"
                        : "text-base";

                  const alignClass =
                    align === "center"
                      ? "text-center"
                      : align === "right"
                        ? "text-right"
                        : "text-left";

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
                    }))
                    .filter((x: any) => x.title && x.url);

                  if (!items.length) return null;

                  return (
                    <div key={b.id} className="flex flex-col gap-3">
                      {items.map((it: any, i: number) => (
                        <LinkButton
                          key={`${b.id}-${i}`}
                          href={it.url}
                          label={it.title}
                          buttonStyle={(s.button_style ?? "solid") as any}
                        />
                      ))}
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
