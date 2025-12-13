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

  // 2) blocks
  const { data: blocks, error: blocksErr } = await supabase
    .from("site_blocks")
    .select("*")
    .eq("site_id", site.id)
    .order("position", { ascending: true });

  if (blocksErr) throw blocksErr;

  const visibleBlocks = (blocks ?? []).filter((b: BlockRow) => b.is_visible);

  return (
    <SiteShell
      themeKey={(site as SiteRow).theme_key ?? "midnight"}
      backgroundStyle={((site as SiteRow).background_style ?? "solid") as any}
      buttonStyle={((site as SiteRow).button_style ?? "solid") as any}
      fontScale={((site as SiteRow).font_scale ?? "md") as any}
      buttonRadius={((site as SiteRow).button_radius ?? "2xl") as any}
      cardStyle={((site as SiteRow).card_style ?? "card") as any}
      themeOverrides={{
        bg_color: (site as SiteRow).bg_color ?? null,
        text_color: (site as SiteRow).text_color ?? null,
        muted_color: (site as SiteRow).muted_color ?? null,
        border_color: (site as SiteRow).border_color ?? null,
        button_color: (site as SiteRow).button_color ?? null,
        button_text_color: (site as SiteRow).button_text_color ?? null,
      }}
    >
      <div className="mx-auto w-full max-w-md px-4 py-10">
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

                return (
                  <div key={b.id} className="text-center space-y-2">
                    <div className="text-3xl font-bold text-[rgb(var(--text))]">
                      {title}
                    </div>
                    {subtitle ? (
                      <div className="text-sm text-[rgb(var(--muted))]">
                        {subtitle}
                      </div>
                    ) : null}
                  </div>
                );
              }

              if (b.type === "image") {
                const url = normalizeUrl(b.content?.url);
                const alt = safeTrim(b.content?.alt) || "Image";
                const shape = b.content?.shape as "circle" | "rounded" | "square";
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

                return (
                  <div
                    key={b.id}
                    className="text-base text-[rgb(var(--text))] whitespace-pre-wrap"
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

                if (items.length === 0) return null;

                return (
                  <div key={b.id} className="flex flex-col gap-3">
                    {items.map((it: any, i: number) => (
                      <LinkButton
                        key={`${b.id}-${i}`}
                        href={it.url}
                        label={it.title}
                        buttonStyle={((site as SiteRow).button_style ?? "solid") as any}
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
    </SiteShell>
  );
}
