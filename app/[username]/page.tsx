import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import { env } from "@/lib/env";
import { SiteShell } from "@/components/site/SiteShell";
import { BlocksRenderer } from "@/components/blocks/BlocksRenderer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LayoutWidth = "compact" | "wide" | "xwide" | "xxwide" | "full";

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

  layout_width?: LayoutWidth | null;

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
  page_id: string | null;

  type: "header" | "hero" | "links" | "image" | "text" | "divider" | "products";

  variant?: string | null;
  style?: Record<string, unknown> | null;
  content: any;

  position: number;
  is_visible: boolean;

  anchor_id?: string | null;
};

function layoutToContainerPadding(layout: LayoutWidth | null | undefined) {
  const l = (layout ?? "compact") as LayoutWidth;

  // max-width / clamp уже делает SiteShell.
  // Здесь — только паддинги/вертикальные отступы “chrome”-контейнера.
  if (l === "full") return "w-full px-6 sm:px-10 lg:px-14 py-12";
  if (l === "wide" || l === "xwide" || l === "xxwide") return "w-full px-6 sm:px-10 lg:px-14 py-12";
  return "w-full px-4 py-10";
}

function fontScaleToCss(fontScale: SiteRow["font_scale"]) {
  if (fontScale === "sm") return "0.95rem";
  if (fontScale === "lg") return "1.08rem";
  return "1rem";
}

export default async function PublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ page?: string; preview?: string }>;
}) {
  noStore();

  const { username } = await params;
  const sp = (await searchParams) ?? {};
  const pageSlugRaw = (sp.page ?? "").trim();
  const pageSlug = pageSlugRaw.length ? pageSlugRaw : null; // null = Home

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

  // 2) page (Home = slug is null)
  const { data: page, error: pageErr } = await supabase
    .from("site_pages")
    .select("*")
    .eq("site_id", s.id)
    .is("slug", pageSlug)
    .maybeSingle();

  if (pageErr) throw pageErr;
  if (!page) return notFound();

  const pageId = (page as any).id as string;

  // 3A) global header отдельно (page_id IS NULL)
  const { data: headerRows, error: headerErr } = await supabase
    .from("site_blocks")
    .select("*")
    .eq("site_id", s.id)
    .eq("type", "header")
    .is("page_id", null)
    .order("position", { ascending: true })
    .limit(1);

  if (headerErr) throw headerErr;

  const globalHeader = (headerRows?.[0] ?? null) as BlockRow | null;

  // 3B) blocks для текущей страницы отдельно (без header)
  const { data: pageRows, error: blocksErr } = await supabase
    .from("site_blocks")
    .select("*")
    .eq("site_id", s.id)
    .eq("page_id", pageId)
    .neq("type", "header")
    .order("position", { ascending: true });

  if (blocksErr) throw blocksErr;

  const pageBlocks = (pageRows ?? []) as BlockRow[];

  // visibility
  const visibleHeader = globalHeader && globalHeader.is_visible ? globalHeader : null;
  const visiblePageBlocks = pageBlocks.filter((b) => b.is_visible);

  // full-bleed header rule: site_blocks.style.full_bleed = true (только для header)
  const headerStyle =
    visibleHeader && visibleHeader.style && typeof visibleHeader.style === "object"
      ? (visibleHeader.style as any)
      : {};
  const isFullBleedHeader = !!visibleHeader && headerStyle?.full_bleed === true;

  // если header НЕ full-bleed — рендерим его в составе основной колонки/контейнера
  const blocksInsideContainer = [
    ...(visibleHeader && !isFullBleedHeader ? [visibleHeader] : []),
    ...visiblePageBlocks,
  ];

  // если header full-bleed — рендерим отдельно сверху
  const headerBlock = isFullBleedHeader && visibleHeader ? [visibleHeader] : [];

  // Map DB blocks -> renderer blocks
  const mapToRendererBlock = (b: BlockRow) => ({
    id: b.id,
    site_id: b.site_id,
    type: b.type,
    variant: b.variant ?? null,
    style: (b.style ?? null) as any,
    content: (b.content ?? {}) as any,
    anchor_id: b.anchor_id ?? null,
    sort_order: b.position ?? 0,
    is_hidden: !b.is_visible,
  });

  const headerBlockForRenderer = headerBlock.map(mapToRendererBlock);
  const blocksInsideContainerForRenderer = blocksInsideContainer.map(mapToRendererBlock);

  const layoutWidth = (s.layout_width ?? "compact") as LayoutWidth;
  const containerPadding = layoutToContainerPadding(layoutWidth);
  const fontSize = fontScaleToCss(s.font_scale ?? "md");

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
              blocks={headerBlockForRenderer}
              mode="public"
              site={{
                layout_width: layoutWidth as any,
                button_style: (s.button_style ?? "solid") as any,
              }}
            />
          </div>
        ) : null}

        {hasChrome ? (
          <div className={containerPadding}>
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
                  blocks={blocksInsideContainerForRenderer}
                  mode="public"
                  site={{
                    layout_width: layoutWidth as any,
                    button_style: (s.button_style ?? "solid") as any,
                  }}
                />

                <div className="pt-2 text-center text-xs text-[rgb(var(--muted))] opacity-70">
                  Powered by Mini-Site Builder
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="space-y-6">
              <BlocksRenderer
                blocks={blocksInsideContainerForRenderer}
                mode="public"
                site={{
                  layout_width: layoutWidth as any,
                  button_style: (s.button_style ?? "solid") as any,
                }}
              />

              <div className="pt-2 text-center text-xs text-[rgb(var(--muted))] opacity-70">
                Powered by Mini-Site Builder
              </div>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
