import * as React from "react";
import type { SiteBlockRow } from "@/components/blocks/BlocksRenderer";
import { blockFrameClassName } from "@/lib/blocks/style";

type Props = {
  block: SiteBlockRow;
  anchorId?: string;
  children: React.ReactNode;
};

export function BlockFrame({ block, anchorId, children }: Props) {
  const outerCls = "scroll-mt-24 min-w-0";

  const innerCls = blockFrameClassName(block.style);

  return (
    <section
      id={anchorId || undefined}
      data-block-id={block.id}
      data-block-type={block.type}
      data-anchor-id={anchorId || undefined}
            style={{ marginBottom: "var(--block-gap,16px)" }}
      className={block.type === "header" ? outerCls + " relative z-[50]" : outerCls}
    >
      <div className={innerCls} style={{ borderRadius: "var(--radius,15px)" }}>{children}</div>
    </section>
  );
}
