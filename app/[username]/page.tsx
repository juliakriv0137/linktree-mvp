import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { SiteShell } from "@/components/site/SiteShell";
import { LinkButton } from "@/components/site/LinkButton";




type PageProps = {
  params: { username: string };
};

type SiteRow = {
  id: string;
  slug: string;
  name: string | null;
  theme_key: string;
  button_style: string;
  background_style: string;
};

type BlockRow = {
  id: string;
  site_id: string;
  type: string;
  content: any;
  position: number;
  is_visible: boolean;
};

export default async function PublicPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  // 1) Получаем сайт по username (slug)
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("slug", username)
    .single<SiteRow>();

  if (!site) return notFound();

  // 2) Получаем блоки сайта
  const { data: rawBlocks } = await supabase
    .from("site_blocks")
    .select("*")
    .eq("site_id", site.id)
    .eq("is_visible", true)
    .order("position") as { data: BlockRow[] | null };

  const blocks = rawBlocks ?? [];

  // ✅ FIX: показываем только первый links-блок (даже если в БД их несколько)
  const firstLinks = blocks.find((b) => b.type === "links");
  const filteredBlocks = blocks.filter((b) => b.type !== "links");

  return (
    <SiteShell
      themeKey={site.theme_key}
      backgroundStyle={site.background_style as any}
      buttonStyle={(site as any).button_style}
      fontScale={(site as any).font_scale ?? "md"}
      buttonRadius={(site as any).button_radius ?? "2xl"}
      cardStyle={(site as any).card_style ?? "card"}
    >
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
          {filteredBlocks.map((block) => {
            switch (block.type) {
              case "hero": {
                const title = block.content?.title ?? site.name ?? site.slug;
                const subtitle = block.content?.subtitle ?? "";
                const letter = String(title).trim()?.[0]?.toUpperCase() ?? "?";
  
                return (
                  <section key={block.id} className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-full bg-neutral-800 mb-4 flex items-center justify-center text-xl">
                      {letter}
                    </div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    {!!subtitle && (
                      <p className="text-neutral-400 mt-2">{subtitle}</p>
                    )}
                  </section>
                );
              }
  
              case "text": {
                const text = block.content?.text ?? "";
                if (!text) return null;
                return (
                  <section
                    key={block.id}
                    className="text-center text-neutral-200 whitespace-pre-wrap"
                  >
                    {text}
                  </section>
                );
              }
  
              case "image": {
                const url = block.content?.url ?? "";
                if (!url) return null;
                const alt = block.content?.alt ?? "";
                const shape = block.content?.shape ?? "circle";
                const cls =
                  shape === "circle"
                    ? "h-24 w-24 rounded-full object-cover border border-white/10"
                    : shape === "rounded"
                    ? "h-24 w-24 rounded-2xl object-cover border border-white/10"
                    : "h-24 w-24 rounded-none object-cover border border-white/10";
  
                return (
                  <section key={block.id} className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={alt} className={cls} />
                  </section>
                );
              }
  
              case "divider": {
                return (
                  <div key={block.id} className="my-4 flex justify-center">
                    <div className="h-px w-24 bg-white/20" />
                  </div>
                );
              }
  
              default:
                return null;
            }
          })}
  
          {/* ✅ Links (один блок) */}
          {firstLinks && (
            <section className="space-y-3 pt-2">
              {(firstLinks.content?.items ?? []).map(
                (item: { title?: string; url?: string }, idx: number) => {
                  const title = item?.title ?? `Link ${idx + 1}`;
                  const url = item?.url ?? "#";
                  return (
                    <LinkButton
                      key={idx}
                      href={url}
                      label={title}
                      buttonStyle={(site as any).button_style}
                    />
                  );
                }
              )}
            </section>
          )}
  
          <footer className="text-center text-xs text-neutral-500 pt-6">
            Powered by Mini-Site Builder
          </footer>
        </div>
      </div>
    </SiteShell>
  );
}