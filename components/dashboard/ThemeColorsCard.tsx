"use client";

import * as React from "react";
import { Card } from "@/components/dashboard/ui/Card";

type Colors = {
  bg_color: string;
  text_color: string;
  muted_color: string;
  border_color: string;
  button_color: string;
  button_text_color: string;
};

type Props = {
  colors: Colors;
  setColors: React.Dispatch<React.SetStateAction<Colors>>;
};

export function ThemeInspector({ colors, setColors }: Props) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[color:var(--text)]">Colors (optional)</div>
          <div className="mt-1 text-xs text-[color:var(--muted)]">Leave empty to use theme defaults.</div>
        </div>

        <button
          type="button"
          className="text-sm font-semibold text-[color:var(--muted)] hover:text-[color:var(--text)] transition"
          onClick={() =>
            setColors({
              bg_color: "",
              text_color: "",
              muted_color: "",
              border_color: "",
              button_color: "",
              button_text_color: "",
            })
          }
        >
          Reset
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-white/40 p-4">
        <div className="text-xs text-[color:var(--muted)]">
          ThemeInspector skeleton is ready. Next step: move the 6 ColorField controls here.
        </div>
      </div>
    </Card>
  );
}
