import * as React from "react";

import HeroBlock from "./HeroBlock";
import TextBlock from "./TextBlock";
import ButtonsBlock from "./ButtonsBlock";
import ImageBlock from "./ImageBlock";
import ProductsBlock from "./ProductsBlock";

function asObj(v: any) {
  if (v == null) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return {};
    try {
      const parsed = JSON.parse(s);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export default function BlockRenderer({
  block,
  className,
}: {
  block: any;
  className?: string;
}) {
  const content = asObj(block?.content);


  switch (block?.type) {
    case "hero":
      return <HeroBlock {...content} />;

    case "text":
      return <TextBlock {...content} />;

    case "buttons":
      return <ButtonsBlock {...content} />;

    case "image":
      return <ImageBlock {...content} />;

    case "products": {
      const c = content ?? {};
      return (
        <ProductsBlock
          siteId={block.site_id}
          content={c}
          className={className}
        />
      );
    }

    default:
      return null;
  }
}
