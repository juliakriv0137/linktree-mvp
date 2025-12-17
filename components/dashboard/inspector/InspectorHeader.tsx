"use client";

import * as React from "react";
import { Button } from "@/components/dashboard/ui/Button";

type Props = {
  tab: "block" | "theme";
  onTabChange: (tab: "block" | "theme") => void;
};

export function InspectorHeader({ tab, onTabChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-semibold">Inspector</div>
      <div className="flex items-center gap-2">
        <Button
          variant={tab === "block" ? "primary" : "ghost"}
          className="px-3 py-2 text-xs"
          onClick={() => onTabChange("block")}
        >
          Block
        </Button>
        <Button
          variant={tab === "theme" ? "primary" : "ghost"}
          className="px-3 py-2 text-xs"
          onClick={() => onTabChange("theme")}
        >
          Theme
        </Button>
      </div>
    </div>
  );
}
