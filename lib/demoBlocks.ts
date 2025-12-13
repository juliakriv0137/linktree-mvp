import { Block } from "./blocks";

export const demoBlocks: Block[] = [
  {
    id: "h1",
    type: "heading",
    text: "Julia",
    size: "xl",
    align: "center",
  },
  {
    id: "bio",
    type: "text",
    text: "Mini site built with Link Page MVP",
    align: "center",
  },
  {
    id: "btn1",
    type: "button",
    label: "Telegram",
    url: "https://t.me/",
  },
  {
    id: "btn2",
    type: "button",
    label: "Instagram",
    url: "https://instagram.com/",
    style: "secondary",
  },
  {
    id: "img1",
    type: "image",
    url: "https://picsum.photos/600/400",
    radius: 16,
  },
];
