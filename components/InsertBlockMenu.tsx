"use client";

import React from "react";

export type BlockType = "header" | "hero" | "links" | "image" | "text" | "divider" | "products";


export default function InsertBlockMenu({
  insertIndex,
  isOpen,
  onToggle,
  onInsert,
  disabled,
  inserting,
  showLabel = true,
  showOnHover = false,
}: {
  insertIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onInsert: (type: BlockType) => void;
  disabled: boolean;
  inserting: null | { index: number; type: BlockType };
  showLabel?: boolean;
  showOnHover?: boolean;
}) {
  const types: BlockType[] = ["header", "hero", "links", "image", "text", "divider", "products"];


  return (
    <div className="flex justify-center">
      <div className={"relative " + (showOnHover ? "group" : "")}>
        <button
          type="button"
          className={[
            // Dashboard light theme tokens (from app/dashboard/page.tsx vars)
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
            "border-[rgb(var(--db-border))] bg-[rgb(var(--db-soft))] text-[rgb(var(--db-muted))]",
            "hover:border-[rgb(var(--db-accent)/0.65)] hover:text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-panel))]",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]",
            disabled ? "cursor-not-allowed opacity-40" : "",
            // IMPORTANT: on hover mode we keep it visible (not fully opacity-0)
            showOnHover ? "opacity-50 group-hover:opacity-100 focus:opacity-100" : "",
          ].join(" ")}
          onClick={onToggle}
          disabled={disabled}
          title="Insert block"
        >
          <span className="text-base leading-none">＋</span>
          {showLabel && <span className="hidden sm:inline">Add block</span>}
        </button>

        {isOpen && (
          <div className="absolute left-1/2 z-50 mt-2 w-44 -translate-x-1/2 rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] p-2 shadow-xl">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-[rgb(var(--db-text))] hover:bg-[rgb(var(--db-soft))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--db-accent)/0.35)]"
                onClick={() => onInsert(t)}
                disabled={disabled}
              >
                {inserting?.index === insertIndex && inserting?.type === t ? "Adding..." : `+ ${t}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
