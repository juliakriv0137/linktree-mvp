export type ThemeKey = "midnight" | "rose" | "emerald";

export type ButtonStyle = "solid" | "outline" | "soft";
export type BackgroundStyle = "solid" | "gradient" | "dots";

export type ThemeDefinition = {
  key: ThemeKey;
  label: string;
  vars: Record<string, string>;
};

export const THEMES: ThemeDefinition[] = [
  {
    key: "midnight",
    label: "Midnight",
    vars: {
      "--bg": "10 12 16",
      "--card": "16 19 26",
      "--text": "244 246 250",
      "--muted": "167 174 189",
      "--border": "32 38 52",
      "--primary": "99 102 241",
      "--primary-2": "139 92 246"
    }
  },
  {
    key: "rose",
    label: "Rose",
    vars: {
      "--bg": "12 10 14",
      "--card": "20 14 22",
      "--text": "249 245 250",
      "--muted": "190 176 195",
      "--border": "46 34 52",
      "--primary": "236 72 153",
      "--primary-2": "168 85 247"
    }
  },
  {
    key: "emerald",
    label: "Emerald",
    vars: {
      "--bg": "8 12 10",
      "--card": "14 20 16",
      "--text": "243 250 246",
      "--muted": "170 190 178",
      "--border": "30 52 40",
      "--primary": "16 185 129",
      "--primary-2": "34 197 94"
    }
  }
];

export function getTheme(key: string | null | undefined) {
  return THEMES.find(t => t.key === key) ?? THEMES[0];
}

export function cssVarsFromTheme(key: string | null | undefined) {
  return getTheme(key).vars;
}
