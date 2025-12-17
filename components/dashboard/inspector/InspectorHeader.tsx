"use client";

import * as React from "react";

type Props = {
  tab?: "block" | "theme";
  onTabChange?: (tab: "block" | "theme") => void;
};

export function InspectorHeader(_props: Props) {
  return (
    <div className="shrink-0 border-b border-white/10 bg-black/20">
      <div className="p-4">
        <div className="text-sm font-semibold">Inspector</div>
        <div className="text-xs text-white/50 mt-1">Edit selected block.</div>
      </div>
    </div>
  );
}
