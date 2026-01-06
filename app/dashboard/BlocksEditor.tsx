"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Site = {
  id: string;
  owner_id: string;
  slug: string;
  name: string | null;
  theme: any;
  created_at: string;
};

type BlockRow = {
  id: string;
  site_id: string;
  type: string;
  content: any;
  position: number;
  is_visible: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
};

function safeUsername(u: string | null) {
  const s = (u ?? "").trim();
  return s.length ? s : `user_${Math.floor(Math.random() * 1_000_000)}`;
}

function defaultContentFor(type: string, profile?: Profile | null) {
  if (type === "hero") {
    return {
      title: profile?.display_name ?? "My Page",
      subtitle: profile?.bio ?? "",
    };
  }
  if (type === "text") {
    return {
      text: "Hello! This is a text block.",
    };
  }
  if (type === "links") {
    return {
      items: [
        { title: "Telegram", url: "https://t.me/" },
        { title: "Instagram", url: "https://instagram.com/" },
      ],
    };
  }
  return {};
}

export default function BlocksEditor() {
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<Site | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [newType, setNewType] = useState<"hero" | "text" | "links">("links");
  const [newContentJson, setNewContentJson] = useState<string>("");

  const sortedBlocks = useMemo(
    () => [...blocks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [blocks]
  );

  async function loadAll() {
    setLoading(true);
    setErr(null);

    // 1) current user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      setErr(userErr.message);
      setLoading(false);
      return;
    }
    if (!user) {
      setErr("Not authenticated. Please sign in.");
      setLoading(false);
      return;
    }

    // 2) profile (username for slug)
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("id, username, display_name, bio")
      .eq("id", user.id)
      .single();

    if (profErr) {
      setErr(`Profile load error: ${profErr.message}`);
      setLoading(false);
      return;
    }

    setProfile(prof as Profile);

    const username = safeUsername((prof as Profile).username);

    // 3) get or create site for this user
    const { data: existingSite, error: siteErr } = await supabase
      .from("sites")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (siteErr) {
      setErr(`Site load error: ${siteErr.message}`);
      setLoading(false);
      return;
    }

    let s = existingSite as Site | null;

    if (!s) {
      const { data: created, error: createErr } = await supabase
        .from("sites")
        .insert({
          owner_id: user.id,
          slug: username,
          name: prof.display_name ?? username,
          theme: { mode: "dark" },
        })
        .select("*")
        .single();

      if (createErr) {
        setErr(`Site create error: ${createErr.message}`);
        setLoading(false);
        return;
      }

      s = created as Site;

      // create default hero + links once
      const { error: seedErr } = await supabase.from("site_blocks").insert([
        {
          site_id: s.id,
          type: "hero",
          content: defaultContentFor("hero", prof as Profile),
          position: 1,
          is_visible: true,
        },
        {
          site_id: s.id,
          type: "links",
          content: defaultContentFor("links", prof as Profile),
          position: 2,
          is_visible: true,
        },
      ]);

      if (seedErr) {
        // not fatal
        console.warn("Seed blocks error:", seedErr.message);
      }
    }

    setSite(s);

    // 4) load blocks
    const { data: b, error: bErr } = await supabase
      .from("site_blocks")
      .select("*")
      .eq("site_id", s.id)
      .order("position", { ascending: true });

    if (bErr) {
      setErr(`Blocks load error: ${bErr.message}`);
      setLoading(false);
      return;
    }

    setBlocks((b ?? []) as BlockRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // auto-fill editor JSON when type changes
    const obj = defaultContentFor(newType, profile);
    setNewContentJson(JSON.stringify(obj, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newType, profile?.id]);

  async function addBlock() {
    if (!site) return;
    setErr(null);

    let content: any = {};
    try {
      content = JSON.parse(newContentJson || "{}");
    } catch (e: any) {
      setErr("Content JSON is invalid. Fix JSON and try again.");
      return;
    }

    const maxPos = blocks.reduce((m, x) => Math.max(m, x.position ?? 0), 0);
    const nextPos = maxPos + 1;

    const { data: created, error } = await supabase
      .from("site_blocks")
      .insert({
        site_id: site.id,
        type: newType,
        content,
        position: nextPos,
        is_visible: true,
      })
      .select("*")
      .single();

    if (error) {
      setErr(`Add block error: ${error.message}`);
      return;
    }

    setBlocks((prev) => [...prev, created as BlockRow]);
  }

  async function toggleVisibility(blockId: string, current: boolean) {
    setErr(null);

    const { data, error } = await supabase
      .from("site_blocks")
      .update({ is_visible: !current })
      .eq("id", blockId)
      .select("*")
      .single();

    if (error) {
      setErr(`Toggle error: ${error.message}`);
      return;
    }

    setBlocks((prev) => prev.map((b) => (b.id === blockId ? (data as BlockRow) : b)));
  }

  async function removeBlock(blockId: string) {
    setErr(null);

    const { error } = await supabase.from("site_blocks").delete().eq("id", blockId);

    if (error) {
      setErr(`Delete error: ${error.message}`);
      return;
    }

    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }

  async function move(blockId: string, dir: -1 | 1) {
    setErr(null);

    const list = sortedBlocks;
    const idx = list.findIndex((b) => b.id === blockId);
    if (idx === -1) return;

    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= list.length) return;

    const a = list[idx];
    const b = list[swapWith];

    // swap positions
    const { error: e1 } = await supabase
      .from("site_blocks")
      .update({ position: b.position })
      .eq("id", a.id);

    if (e1) {
      setErr(`Move error: ${e1.message}`);
      return;
    }

    const { error: e2 } = await supabase
      .from("site_blocks")
      .update({ position: a.position })
      .eq("id", b.id);

    if (e2) {
      setErr(`Move error: ${e2.message}`);
      return;
    }

    // refresh in UI
    setBlocks((prev) =>
      prev.map((x) => {
        if (x.id === a.id) return { ...x, position: b.position };
        if (x.id === b.id) return { ...x, position: a.position };
        return x;
      })
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <p className="text-neutral-300">Loading blocks…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Mini-site blocks</h2>
            <p className="text-sm text-neutral-400 mt-1">
              Site: <span className="text-neutral-200">{site?.slug}</span>
            </p>
          </div>
          {site?.slug && (
            <a
              href={`/${site.slug}`}
              className="rounded-full bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700"
              target="_blank"
              rel="noreferrer"
            >
              Open public page
            </a>
          )}
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="text-sm text-neutral-300">Block type</label>
            <select
              className="mt-2 w-full rounded-xl border border-neutral-800 bg-black px-3 py-2"
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
            >
              <option value="header">header</option>
<option value="hero">hero</option>
<option value="links">links</option>
<option value="image">image</option>
<option value="text">text</option>
<option value="divider">divider</option>
<option value="products">products</option>

            </select>

            <button
              onClick={addBlock}
              className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-black font-medium hover:bg-neutral-200"
            >
              Add block
            </button>

            <button
              onClick={loadAll}
              className="mt-2 w-full rounded-xl bg-neutral-800 px-4 py-2 text-white hover:bg-neutral-700"
            >
              Refresh
            </button>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-neutral-300">Content (JSON)</label>
            <textarea
              className="mt-2 h-44 w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 font-mono text-xs"
              value={newContentJson}
              onChange={(e) => setNewContentJson(e.target.value)}
              spellCheck={false}
            />
            <p className="mt-2 text-xs text-neutral-500">
              Tip: for links use <code>{"{ items: [{title,url}] }"}</code>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <h3 className="text-lg font-semibold">Existing blocks</h3>

        {sortedBlocks.length === 0 ? (
          <p className="mt-3 text-neutral-400 text-sm">No blocks yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {sortedBlocks.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-neutral-800 bg-black p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs">
                      {b.type}
                    </span>
                    <span className="text-xs text-neutral-500">pos {b.position}</span>
                    {!b.is_visible && (
                      <span className="text-xs text-neutral-400">(hidden)</span>
                    )}
                  </div>

                  <pre className="mt-3 max-h-40 overflow-auto rounded-xl border border-neutral-900 bg-neutral-950 p-3 text-xs text-neutral-200">
{JSON.stringify(b.content ?? {}, null, 2)}
                  </pre>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => move(b.id, -1)}
                      className="rounded-xl bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(b.id, 1)}
                      className="rounded-xl bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  <button
                    onClick={() => toggleVisibility(b.id, b.is_visible)}
                    className="rounded-xl bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
                  >
                    {b.is_visible ? "Hide" : "Show"}
                  </button>

                  <button
                    onClick={() => removeBlock(b.id)}
                    className="rounded-xl bg-red-600 px-3 py-2 text-sm hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
