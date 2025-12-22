"use client";

import * as React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  // можно расширять позже
};

export const DbPopoverPanel = React.forwardRef<HTMLDivElement, Props>(function DbPopoverPanel(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      {...props}
      className={[
        // позиционирование будет задаваться снаружи (absolute right-0 mt-2 и т.п.)
        "rounded-2xl border",
        "border-[rgb(var(--db-border))]",
        // ВАЖНО: НЕПРОЗРАЧНЫЙ фон (убираем /0.7 и backdrop-blur)
        "bg-[rgb(var(--db-panel))]",
        "shadow-[0_20px_60px_rgba(2,6,23,0.20)]",
        // чтобы не “прибивалось” к краям внутри панели
        "p-4",
        // чтобы Colors можно было смотреть целиком
        "max-h-[min(70vh,560px)] overflow-auto overscroll-contain",
        // текст/контент
        "text-[rgb(var(--db-text))]",
        className ?? "",
      ].join(" ")}
      // клики внутри не должны всплывать до details (иначе может закрываться/тогглиться)
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        props.onClick?.(e);
      }}
    />
  );
});
