"use client";

import React from "react";

type ButtonStyle = "solid" | "outline" | "soft";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function LinkButton({
  href,
  label,
  buttonStyle,
  className,
}: {
  href: string;
  label: string;
  buttonStyle: ButtonStyle;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center font-semibold transition select-none " +
    "focus:outline-none focus:ring-2 focus:ring-white/25 " +
    "active:scale-[0.99]";

  // ВАЖНО: фикс ширины кнопки, чтобы выравнивание работало.
  // Кнопка не w-full — она ограничена, и контейнер решает left/center/right.
  const width = "w-[min(360px,100%)]";

  const padding = "px-5 py-3 text-sm";

  const solid = "bg-[rgb(var(--primary))] text-[rgb(var(--button-text))] hover:opacity-95";
  const outline =
    "bg-transparent text-[rgb(var(--text))] border border-[rgb(var(--border))] hover:bg-white/5";
  const soft = "bg-white/8 text-[rgb(var(--text))] hover:bg-white/12";

  const styleClass =
    buttonStyle === "outline" ? outline : buttonStyle === "soft" ? soft : solid;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={clsx(base, width, padding, styleClass, className)}
      style={{
        borderRadius: "var(--button-radius)",
      }}
    >
      {label}
    </a>
  );
}
