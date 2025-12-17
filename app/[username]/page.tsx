import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { SiteShell } from "@/components/site/SiteShell";
import { BlocksRenderer } from "@/components/blocks/BlocksRenderer";

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
  type: "header" | "hero" | "links" | "image" | "text" | "divider";
  variant?: string | null;
  style?: Record<string, unknown> | null;
  content: any;
  position: number;
  is_visible: boolean;
};

function layoutToContainerClasses(
  layout: "compact" | "wide" | "full" | null | undefined,
) {
  if (layout === "full") {
    // Full should feel like a real full-width website: no max-width clamp.
    return "w-full px-6 sm:px-10 lg:px-14 py-12";
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

  const firstBlock = (visibleBlocks as any[])[0] as any | undefined;

  // System rule: full-bleed is an explicit block style (no one-off hacks).
  // Enable by setting site_blocks.style.full_bleed = true for the Header block.
  const headerStyle = (firstBlock?.style && typeof firstBlock.style === "object") ? (firstBlock.style as any) : {};
  const isFullBleedHeader = firstBlock?.type === "header" && headerStyle?.full_bleed === true;

  const headerBlock = isFullBleedHeader ? [firstBlock] : [];
  const restBlocks = isFullBleedHeader ? (visibleBlocks as any[]).slice(1) : (visibleBlocks as any[]);

  const hasChrome = layoutWidth !== "full";
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
        {isFullBleedHeader ? (
          <div className="w-full">
            <BlocksRenderer
              blocks={(headerBlock as any) ?? []}
              mode="public"
              site={{
                layout_width: layoutWidth,
                button_style: (s.button_style ?? "solid") as any,
              }}
            />
          </div>
        ) : null}

        {hasChrome ? (
          <div className={containerClass}>
            <div
              style={{
                background: "var(--card-bg)",
                border: "var(--card-border)",
                boxShadow: "var(--card-shadow)",
                padding: "var(--card-padding)",
                borderRadius: "var(--radius)",
              }}
            >
              <div className="space-y-6">
                <BlocksRenderer
                  blocks={(restBlocks as any) ?? []}
                  mode="public"
                  site={{
                    layout_width: layoutWidth,
                    button_style: (s.button_style ?? "solid") as any,
                  }}
                />

                <div className="pt-2 text-center text-xs text-white/35">
                  Powered by Mini-Site Builder
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="space-y-6">
              <BlocksRenderer
                blocks={(restBlocks as any) ?? []}
                mode="public"
                site={{
                  layout_width: layoutWidth,
                  button_style: (s.button_style ?? "solid") as any,
                }}
              />

              <div className="pt-2 text-center text-xs text-white/35">
                Powered by Mini-Site Builder
              </div>
            </div>
          </div>
        )}

      </div>
    </SiteShell>
  );
}
