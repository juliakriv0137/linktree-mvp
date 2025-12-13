// lib/blocks.ts
export type BlockType =
  | "heading"
  | "text"
  | "button"
  | "image"
  | "divider"
  | "spacer";

export type BaseBlock = {
  id: string;
  type: BlockType;
};

export type HeadingBlock = BaseBlock & {
  type: "heading";
  text: string;
  align?: "left" | "center" | "right";
  size?: "xl" | "lg" | "md";
};

export type TextBlock = BaseBlock & {
  type: "text";
  text: string;
  align?: "left" | "center" | "right";
};

export type ButtonBlock = BaseBlock & {
  type: "button";
  label: string;
  url: string;
  style?: "primary" | "secondary";
};

export type ImageBlock = BaseBlock & {
  type: "image";
  url: string;
  alt?: string;
  radius?: number;
};

export type DividerBlock = BaseBlock & {
  type: "divider";
};

export type SpacerBlock = BaseBlock & {
  type: "spacer";
  height?: number;
};

export type Block =
  | HeadingBlock
  | TextBlock
  | ButtonBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock;

export function makeId(): string {
  return "b_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function defaultHomeBlocks(): Block[] {
  return [
    { id: makeId(), type: "heading", text: "My site", align: "center", size: "lg" },
    { id: makeId(), type: "text", text: "Welcome 👋", align: "center" },
    { id: makeId(), type: "spacer", height: 12 },
    { id: makeId(), type: "button", label: "My Instagram", url: "https://instagram.com", style: "primary" },
  ];
}
