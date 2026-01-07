"use client";

import * as React from "react";
import { THEMES } from "@/lib/themes";
import { Card } from "@/components/dashboard/ui/Card";
import { ThemeColorField } from "@/components/dashboard/ui/ThemeColorField";


type Props = {
  site: any;
  canAct: boolean;
  themeKeys: string[];

  colors: {
    bg_color: string;
    text_color: string;
    muted_color: string;
    border_color: string;
    button_color: string;
    button_text_color: string;
  };

  setColors: React.Dispatch<
    React.SetStateAction<{
      bg_color: string;
      text_color: string;
      muted_color: string;
      border_color: string;
      button_color: string;
      button_text_color: string;
    }>
  >;

  updateSiteTheme: (siteId: string, patch: any) => Promise<void>;
  setSite: (v: any) => void;

  saveColorField: (key: "bg_color" | "text_color" | "muted_color" | "border_color" | "button_color" | "button_text_color", v: string) => void;
};

function themeLabel(key: string) {
  const t: any = (THEMES as any)?.[key];
  return String(t?.label ?? t?.name ?? key);
}

const WIDTH_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "compact", label: "compact" },
  { value: "wide", label: "wide" },
  { value: "xwide", label: "xwide" },
  { value: "xxwide", label: "xxwide" },
  { value: "full", label: "full" },
];

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

  const themeKeyValue = String(site.theme_key ?? "");
  const layoutWidthValue = String(site.layout_width ?? "compact");

  async function resetColors() {
    setColors({
      bg_color: "",
      text_color: "",
      muted_color: "",
      border_color: "",
      button_color: "",
      button_text_color: "",
    });

    await updateSiteTheme(site.id, {
      bg_color: null,
      text_color: null,
      muted_color: null,
      border_color: null,
      button_color: null,
      button_text_color: null,
    });

    setSite({
      ...site,
      bg_color: null,
      text_color: null,
      muted_color: null,
      border_color: null,
      button_color: null,
      button_text_color: null,
    });
  }

  return (
    <Card className="bg-[rgb(var(--db-panel))] shadow-none">
      <div className="p-4 space-y-5">
        <div>
          <div className="text-sm font-semibold">Theme</div>
          <div className="text-xs text-[rgb(var(--db-muted))] mt-1">Applies to the whole site.</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Theme</div>
            <select
              className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm"
              value={themeKeyValue}
              disabled={!canAct}
              onChange={async (e) => {
                const theme_key = (e.target as HTMLSelectElement).value;
                await updateSiteTheme(site.id, { theme_key });
                setSite({ ...site, theme_key });
              }}
            >
              {themeKeys.map((k) => (
                <option key={k} value={String(k)}>
                  {themeLabel(String(k))}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs text-[rgb(var(--db-muted))] mb-2">Layout width</div>
            <select
              className="w-full rounded-2xl border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] px-3 py-2 text-sm"
              value={layoutWidthValue}
              disabled={!canAct}
              onChange={async (e) => {
                const layout_width = (e.target as HTMLSelectElement).value;
                await updateSiteTheme(site.id, { layout_width });
                setSite({ ...site, layout_width });
              }}
            >
              {WIDTH_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="pt-2 border-t border-[rgb(var(--db-border))]" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[rgb(var(--db-muted))]">Colors (optional)</div>
            <div className="text-[11px] text-[rgb(var(--db-muted))] mt-1">Leave empty to use theme defaults.</div>
          </div>

          <button
            type="button"
            disabled={!canAct}
            className="text-xs font-semibold text-[rgb(var(--db-muted))] hover:text-[rgb(var(--db-text))] disabled:opacity-50"
            onClick={() => {
              void resetColors();
            }}
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ThemeColorField
            label="Background"
            value={colors.bg_color}
            onChange={(v) => {
              setColors((p) => ({ ...p, bg_color: v }));
              saveColorField("bg_color", v);
            }}
          />
          <ThemeColorField
            label="Text"
            value={colors.text_color}
            onChange={(v) => {
              setColors((p) => ({ ...p, text_color: v }));
              saveColorField("text_color", v);
            }}
          />
          <ThemeColorField
            label="Muted"
            value={colors.muted_color}
            onChange={(v) => {
              setColors((p) => ({ ...p, muted_color: v }));
              saveColorField("muted_color", v);
            }}
          />
          <ThemeColorField
            label="Border"
            value={colors.border_color}
            onChange={(v) => {
              setColors((p) => ({ ...p, border_color: v }));
              saveColorField("border_color", v);
            }}
          />
          <ThemeColorField
            label="Button"
            value={colors.button_color}
            onChange={(v) => {
              setColors((p) => ({ ...p, button_color: v }));
              saveColorField("button_color", v);
            }}
          />
          <ThemeColorField
            label="Button text"
            value={colors.button_text_color}
            onChange={(v) => {
              setColors((p) => ({ ...p, button_text_color: v }));
              saveColorField("button_text_color", v);
            }}
          />
        </div>
      </div>
    </Card>
  );
}
