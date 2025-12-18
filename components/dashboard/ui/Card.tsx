"use client";

import * as React from "react";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type CardProps = React.PropsWithChildren<
  React.HTMLAttributes<HTMLElement> & {
    as?: React.ElementType;
  }
>;

export function Card({ children, className, as: As = "div", ...rest }: CardProps) {
  return (
    <As
      {...rest}
      className={clsx(
        // Светлая SaaS-карточка (как в примере), цвета берём из DB vars
        "rounded-[var(--db-radius)] border border-[rgb(var(--db-border))] bg-[rgb(var(--db-panel))] shadow-[0_10px_30px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      {children}
    </As>
  );
}
