import * as React from "react";

type AnyObj = Record<string, any>;

export function BlockFrame({
  block,
  anchorId,
  children,
}: {
  block: any;
  anchorId?: string;
  children: React.ReactNode;
}) {
  const s: AnyObj = isPlainObj(block?.style) ? (block.style as AnyObj) : {};

  // ожидаемые ключи из Block style UI:
  // padding, width, background, align, radius, border
  // + поддерживаем легаси/альтернативные ключи, чтобы "Width" точно работал
  const paddingRaw = s.padding;
  const widthRaw = s.width ?? s.layout_width ?? s.block_width ?? s.content_width;
  const bgRaw = s.background;
  const alignRaw = s.align;
  const radiusRaw = s.radius;
  const borderRaw = s.border;

  const paddingPx = normalizePadding(paddingRaw);
  const widthClass = normalizeWidthClass(widthRaw);
  const alignClass = normalizeAlignClass(alignRaw);
  const bgStyle = normalizeBackgroundStyle(bgRaw);

  const radiusValue = normalizeRadius(radiusRaw);
  const borderValue = normalizeBorder(borderRaw);

  // Styles apply to the inner frame (background/padding/border/radius)
  const frameStyle: React.CSSProperties = {
    width: "100%",
    minWidth: 0,
    ...(bgStyle ?? {}),
  };

  // применяем только если реально выбрано
  if (paddingPx) frameStyle.padding = paddingPx;
  if (radiusValue) frameStyle.borderRadius = radiusValue;
  if (borderValue) frameStyle.border = borderValue;

  return (
    <section id={anchorId} className="w-full min-w-0">
      {/* align управляет положением "widthClass" контейнера */}
      <div className={`w-full min-w-0 ${alignClass}`}>
        {/* widthClass должен жить на контейнере, который реально ограничивает ширину */}
        <div className={`min-w-0 ${widthClass}`}>
          {/* frameStyle — только про визуальный фрейм */}
          <div className="min-w-0 w-full" style={frameStyle}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- helpers ---------------- */

function isPlainObj(v: any): v is Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v);
}

function normalizeRadius(v: any): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  const s = raw.toLowerCase();

  // allow css
  if (raw.startsWith("var(")) return raw;
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(s)) return raw;

  switch (s) {
    case "default":
      return null;
    case "none":
      return "0px";
    case "sm":
      return "12px";
    case "md":
      return "16px";
    case "lg":
      return "20px";
    case "xl":
      return "24px";
    case "2xl":
      return "32px";
    case "full":
      return "9999px";
    default:
      return "var(--radius)";
  }
}

function normalizeBorder(v: any): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  const s = raw.toLowerCase();

  // allow raw css border
  if (/\b(solid|dashed|dotted)\b/.test(s) || s.includes("px")) return raw;

  switch (s) {
    case "default":
      return null;
    case "none":
      return null;
    case "subtle":
      return "1px solid rgb(var(--border))";
    case "strong":
      return "2px solid rgb(var(--border))";
    default:
      return null;
  }
}

function normalizePadding(v: any): string | null {
  const raw = String(v ?? "").trim();
  if (!raw) return null;
  const s = raw.toLowerCase();

  // allow css
  if (raw.startsWith("var(")) return raw;
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(s)) return raw;

  switch (s) {
    case "default":
      return null;
    case "none":
      return null;
    case "sm":
      return "10px";
    case "md":
      return "14px";
    case "lg":
      return "18px";
    case "xl":
      return "24px";
    default:
      return null;
  }
}

// width управляет шириной внутреннего контейнера блока
function normalizeWidthClass(v: any): string {
  const s = String(v ?? "").trim().toLowerCase();

  // default = пусть решает внешний контейнер страницы
  if (!s || s === "default") return "w-full";

  // Расширенные варианты ширины блока (внутри общего контейнера страницы)
  switch (s) {
    case "xs":
    case "xsmall":
    case "narrow":
      return "w-full max-w-sm"; // ~384px

    case "sm":
    case "small":
      return "w-full max-w-md"; // ~448px

    case "compact":
      return "w-full max-w-lg"; // ~512px

    case "md":
    case "medium":
    case "normal":
      return "w-full max-w-xl"; // ~576px

    case "lg":
    case "large":
      return "w-full max-w-2xl"; // ~672px

    case "wide":
      return "w-full max-w-5xl"; // ~1024px

    case "xl":
    case "xlarge":
      return "w-full max-w-6xl"; // ~1152px

    case "full":
      return "w-full";

    default:
      return "w-full";
  }
}

// align = выравнивание внутреннего контейнера внутри блока
function normalizeAlignClass(v: any): string {
  const s = String(v ?? "").trim().toLowerCase();
  switch (s) {
    case "center":
      return "flex justify-center";
    case "right":
      return "flex justify-end";
    case "left":
    default:
      return "flex justify-start";
  }
}

// background применяем как фон самого блока (внутренней обёртки)
function normalizeBackgroundStyle(v: any): React.CSSProperties | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s || s === "default" || s === "none") return null;

  // базовые варианты
  switch (s) {
    case "soft":
      return { background: "rgb(var(--card-bg))" };
    case "contrast":
      return { background: "rgba(0,0,0,0.06)" };
    case "solid":
      return { background: "rgb(var(--bg))" };
    default:
      return null;
  }
}
