"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteBlockRow as BlockRow } from "@/components/blocks/BlocksRenderer";
import { Button } from "@/components/dashboard/ui/Button";
import { DbFieldRow } from "@/components/dashboard/ui/DbFieldRow";
import { DbInput } from "@/components/dashboard/ui/DbInput";
import { DbTextarea } from "@/components/dashboard/ui/DbTextarea";
import { DbSelect } from "@/components/dashboard/ui/DbSelect";

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

  const sizeClass =
    size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  const cleanedText = useMemo(() => safeTrim(text), [text]);
  const canSave = cleanedText.length > 0;

  return (
    <div className="space-y-4">
      <div className="text-xs text-[rgb(var(--db-muted))]">Text block</div>

      <DbFieldRow label="Text">
        <DbTextarea
          rows={6}
          placeholder="Write something…"
          value={text}
          onChange={(e) => setText((e.target as HTMLTextAreaElement).value)}
        />
      </DbFieldRow>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DbFieldRow label="Text size">
          <DbSelect
            value={size}
            onChange={(e) => setSize((e.target as HTMLSelectElement).value as any)}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </DbSelect>
        </DbFieldRow>

        <DbFieldRow label="Align">
          <DbSelect
            value={align}
            onChange={(e) => setAlign((e.target as HTMLSelectElement).value as any)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </DbSelect>
        </DbFieldRow>
      </div>

      <div className="rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] p-4 space-y-2 min-w-0">
        <div className="text-xs text-[rgb(var(--db-muted))]">Preview</div>
        <div
          className={`${sizeClass} ${alignClass} text-[rgb(var(--db-text))] whitespace-pre-wrap min-w-0`}
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
        >
          {cleanedText || "Write something to see preview…"}
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
