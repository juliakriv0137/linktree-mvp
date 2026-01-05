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
  page_id: string | null;

  type: "header" | "hero" | "links" | "image" | "text" | "divider" | "products";

  variant?: string | null;
  style?: Record<string, unknown> | null;
  content: any;

  position: number;
  is_visible: boolean;

  anchor_id?: string | null;
};

function layoutToContainerClasses(layout: "compact" | "wide" | "full" | null | undefined) {
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
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ page?: string; preview?: string }>;
}) {
  const { username } = await params;
  const sp = (await searchParams) ?? {};
  const pageSlugRaw = (sp.page ?? "").trim();
  const pageSlug = pageSlugRaw.length ? pageSlugRaw : null; // null = Home

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  // 1) site by slug
  const { data: site, error: siteErr } = await supabase.from("sites").select("*").eq("slug", username).maybeSingle();

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

  // 3) blocks (ВАЖНО: грузим ВСЕ блоки сайта, чтобы взять global header (page_id = null))
  const { data: allBlocks, error: blocksErr } = await supabase
    .from("site_blocks")
    .select("*")
    .eq("site_id", s.id)
    .order("position", { ascending: true });

  if (blocksErr) throw blocksErr;

  const all = (allBlocks ?? []) as BlockRow[];

  // global header (один на весь сайт): type='header' AND page_id IS NULL
  const globalHeader = all.find((b) => b.type === "header" && (b.page_id ?? null) === null) ?? null;

  // blocks конкретной страницы (header исключаем, чтобы не было дубля)
  const pageBlocks = all.filter((b) => b.type !== "header" && b.page_id === (page as any).id);

  // visibility
  const visibleHeader = globalHeader && globalHeader.is_visible ? globalHeader : null;
  const visiblePageBlocks = pageBlocks.filter((b) => b.is_visible);

  // full-bleed header rule: site_blocks.style.full_bleed = true (только для header)
  const headerStyle =
    visibleHeader && visibleHeader.style && typeof visibleHeader.style === "object" ? (visibleHeader.style as any) : {};
  const isFullBleedHeader = !!visibleHeader && headerStyle?.full_bleed === true;

  // если header НЕ full-bleed — рендерим его в составе основной колонки/контейнера
  const blocksInsideContainer = [
    ...(visibleHeader && !isFullBleedHeader ? [visibleHeader] : []),
    ...visiblePageBlocks,
  ];

  // если header full-bleed — рендерим отдельно сверху
  const headerBlock = isFullBleedHeader && visibleHeader ? [visibleHeader] : [];

  // Map DB blocks (position/is_visible) -> renderer blocks (sort_order/is_hidden)
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

  const layoutWidth = (s.layout_width ?? "compact") as "compact" | "wide" | "full";
  const containerClass = layoutToContainerClasses(layoutWidth);
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
                  blocks={blocksInsideContainerForRenderer}
                  mode="public"
                  site={{
                    layout_width: layoutWidth,
                    button_style: (s.button_style ?? "solid") as any,
                  }}
                />

                <div className="pt-2 text-center text-xs text-white/35">Powered by Mini-Site Builder</div>
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
                  layout_width: layoutWidth,
                  button_style: (s.button_style ?? "solid") as any,
                }}
              />

              <div className="pt-2 text-center text-xs text-white/35">Powered by Mini-Site Builder</div>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
