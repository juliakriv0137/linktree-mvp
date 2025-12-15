"use client";

import React from "react";

export type BlockType = "header" | "hero" | "links" | "image" | "text" | "divider";

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
  const types: BlockType[] = ["header", "hero", "links", "image", "text", "divider"];

  return (
    <div className="flex justify-center">
      <div className={"relative " + (showOnHover ? "group" : "")}>
        <button
          type="button"
          className={[
            "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10",
            showOnHover
              ? "opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              : "",
          ].join(" ")}
          onClick={onToggle}
          disabled={disabled}
          title="Insert block"
        >
          <span className="text-base leading-none">＋</span>
          {showLabel && <span className="hidden sm:inline">Add block</span>}
        </button>

        {isOpen && (
          <div className="absolute left-1/2 z-50 mt-2 w-44 -translate-x-1/2 rounded-2xl border border-white/10 bg-black p-2 shadow-xl">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                onClick={() => onInsert(t)}
                disabled={disabled}
              >
                {inserting?.index === insertIndex && inserting?.type === t
                  ? "Adding..."
                  : `+ ${t}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
