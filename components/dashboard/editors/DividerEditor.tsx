"use client";

import * as React from "react";

export function DividerEditor() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/50 mb-3">Divider block</div>
      <div className="flex justify-center py-4">
        <div className="h-px w-24 bg-white/20" />
      </div>
      <div className="text-xs text-white/40 mt-2">No settings yet.</div>
    </div>
  );
}

