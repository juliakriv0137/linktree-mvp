"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import type { SiteBlockRow as BlockRow } from "@/components/blocks/BlocksRenderer";
import { Button } from "@/components/Button";

type TextContent = {
  text?: string | null;
  size?: "sm" | "md" | "lg" | null;
  align?: "left" | "center" | "right" | null;
};

function safeTrim(v: any) {
  return String(v ?? "").trim();
}

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

export function TextEditor({
  block,
  onSave,
}: {
  block: BlockRow;
  onSave: (next: TextContent) => Promise<void>;
}) {
  const initial = asObj(block.content) as TextContent;

  const [text, setText] = useState<string>(safeTrim(initial.text ?? ""));
  const [size, setSize] = useState<"sm" | "md" | "lg">((initial.size as any) ?? "md");
  const [align, setAlign] = useState<"left" | "center" | "right">((initial.align as any) ?? "left");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = asObj(block.content) as TextContent;
    setText(safeTrim(c.text ?? ""));
    setSize((c.size as any) ?? "md");
    setAlign((c.align as any) ?? "left");
  }, [block.id, block.content]);

  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  const cleanedText = useMemo(() => safeTrim(text), [text]);
  const canSave = cleanedText.length > 0;

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/50">Text block</div>

      <label className="block">
        <div className="text-sm text-white/80 mb-2">Text</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write something..."
          rows={6}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <div className="text-sm text-white/80 mb-2">Text size</div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            value={size}
            onChange={(e) => setSize(e.target.value as any)}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>

        <label className="block">
          <div className="text-sm text-white/80 mb-2">Align</div>
          <select
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            value={align}
            onChange={(e) => setAlign(e.target.value as any)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
      </div>

      <div
        style={{
          background: "var(--card-bg)",
          border: "var(--card-border)",
          boxShadow: "var(--card-shadow)",
          padding: "var(--card-padding)",
          borderRadius: "var(--button-radius)",
        }}
        className="space-y-2 min-w-0"
      >
        <div className="text-xs text-white/50">Preview</div>
        <div
          className={`${sizeClass} ${alignClass} text-[rgb(var(--text))] whitespace-pre-wrap min-w-0`}
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
        >
          {cleanedText ? cleanedText : "Write something to see preview…"}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={saving || !canSave}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                text: cleanedText,
                size,
                align,
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
