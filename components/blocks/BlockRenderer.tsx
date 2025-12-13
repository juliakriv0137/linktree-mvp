import HeroBlock from "./HeroBlock";
import TextBlock from "./TextBlock";
import ButtonsBlock from "./ButtonsBlock";
import ImageBlock from "./ImageBlock";
import ProductsBlock from "./ProductsBlock";

export default function BlockRenderer({ block }: { block: any }) {
  const { type, content } = block;

  switch (type) {
    case "hero":
      return <HeroBlock {...content} />;

    case "text":
      return <TextBlock {...content} />;

    case "buttons":
      return <ButtonsBlock {...content} />;

    case "image":
      return <ImageBlock {...content} />;

    case "products":
      return <ProductsBlock {...content} />;

    default:
      return null;
  }
}
