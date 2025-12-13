import { supabase } from "@/lib/supabaseClient";

export async function getSiteBySlug(slug: string) {
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

export async function getSiteBlocks(siteId: string) {
  const { data, error } = await supabase
    .from("site_blocks")
    .select("*")
    .eq("site_id", siteId)
    .eq("is_visible", true)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}
