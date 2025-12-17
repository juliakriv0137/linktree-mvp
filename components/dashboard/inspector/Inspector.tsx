"use client";

import * as React from "react";
import { Card } from "@/components/dashboard/ui/Card";
import { InspectorHeader } from "@/components/dashboard/inspector/InspectorHeader";

type Props = {
  tab: "block" | "theme";
  onTabChange: (tab: "block" | "theme") => void;
block: React.ReactNode;
};

export function Inspector({ tab, onTabChange, block }: Props) {
  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <div className="shrink-0">
        <InspectorHeader tab={tab} onTabChange={onTabChange} />
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        {block}
      </div>
    </Card>
  );
}
