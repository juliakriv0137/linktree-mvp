"use client";

import * as React from "react";
import { THEMES } from "@/lib/themes";
import { Card } from "@/components/dashboard/shared/Card";
import { ColorField } from "@/components/dashboard/shared/ColorField";

type Props = {
  site: any;
  canAct: boolean;
  themeKeys: string[];
  colors: Record<string, string>;
  setColors: (v: any) => void;
  updateSiteTheme: (siteId: string, patch: any) => Promise<void>;
  setSite: (v: any) => void;
  saveColorField: (key: any, v: string) => void;
};

export function ThemeInspector({
  site,
  canAct,
  themeKeys,
  colors,
  setColors,
  updateSiteTheme,
  setSite,
  saveColorField,
}: Props) {
  if (!site) return null;

  return (
    <Card className="bg-white/3 shadow-none">
      <div className="p-4 space-y-5">
        <div>
          <div className="text-sm font-semibold">Theme</div>
          <div className="text-xs text-white/50 mt-1">Applies to the whole site.</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-xs text-white/50 mb-2">Theme</div>
            <select
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              value={site.theme_key}
              disabled={!canAct}
              onChange={async (e) => {
                const theme_key = e.target.value;
                await updateSiteTheme(site.id, { theme_key });
                setSite({ ...site, theme_key });
              }}
            >
              {themeKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs text-white/50 mb-2">Layout width</div>
            <select
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              value={site.layout_width}
              disabled={!canAct}
              onChange={async (e) => {
                const layout_width = e.target.value;
                await updateSiteTheme(site.id, { layout_width });
                setSite({ ...site, layout_width });
              }}
            >
              <option value="compact">compact</option>
              <option value="wide">wide</option>
              <option value="full">full</option>
            </select>
          </label>
        </div>

        <div className="pt-2 border-t border-white/10" />

        <div className="space-y-4">
          <ColorField
            label="Background"
            value={colors.bg_color}
            onChange={(v) => {
              setColors((p: any) => ({ ...p, bg_color: v }));
              saveColorField("bg_color", v);
            }}
          />
          <ColorField
            label="Text"
            value={colors.text_color}
            onChange={(v) => {
              setColors((p: any) => ({ ...p, text_color: v }));
              saveColorField("text_color", v);
            }}
          />
        </div>
      </div>
    </Card>
  );
}
