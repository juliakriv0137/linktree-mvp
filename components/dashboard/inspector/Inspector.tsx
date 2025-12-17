"use client";

import * as React from "react";
import { Card } from "@/components/dashboard/ui/Card";
import { Button } from "@/components/dashboard/ui/Button";

type Props = {
  tab: "block" | "theme";
  onTabChange: (tab: "block" | "theme") => void;
  theme: React.ReactNode;
  block: React.ReactNode;
};

export function Inspector({ tab, onTabChange, theme, block }: Props) {
  return (
    <Card>
      <div className="p-4 space-y-4">
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

        {tab === "theme" ? theme : block}
      </div>
    </Card>
  );
}
