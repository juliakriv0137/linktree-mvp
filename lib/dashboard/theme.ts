export type DashboardThemeVars = {
  "--db-bg": string;
  "--db-panel": string;
  "--db-border": string;
  "--db-text": string;
  "--db-muted": string;
  "--db-accent": string;
  "--db-accent-weak": string;
  "--db-ring": string;
  "--db-radius": string;
};

export const DASHBOARD_THEME_VARS: DashboardThemeVars = {
  // Light SaaS look (like your example)
  "--db-bg": "247 250 252",        // #F7FAFC-ish
  "--db-panel": "255 255 255",     // #FFFFFF
  "--db-border": "230 238 245",    // soft border
  "--db-text": "31 41 55",         // slate-800
  "--db-muted": "107 114 128",     // slate-500
  "--db-accent": "79 209 197",     // mint/teal
  "--db-accent-weak": "227 250 247",
  "--db-ring": "79 209 197",
  "--db-radius": "16px",
};
