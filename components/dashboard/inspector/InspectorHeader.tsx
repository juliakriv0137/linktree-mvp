"use client";

import * as React from "react";
import { Button } from "@/components/dashboard/ui/Button";

type Props = {
  tab: "block" | "theme";
  onTabChange: (tab: "block" | "theme") => void;
};

export function InspectorHeader({ tab, onTabChange }: Props) {
  return (
    <div className="p-4 border-b border-white/10 bg-black/20">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">Inspector</div>
          <div className="text-xs text-white/50 mt-1">
            Edit theme or selected block.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={tab === "block" ? "primary" : "ghost"}
            className="px-4 py-2 text-xs"
            onClick={() => onTabChange("block")}
          >
            Block
          </Button>
          <Button
            variant={tab === "theme" ? "primary" : "ghost"}
            className="px-4 py-2 text-xs"
            onClick={() => onTabChange("theme")}
          >
            Theme
          </Button>
        </div>
      </div>
    </div>
  );
}
