/**
 * Dashboard-level shared types.
 * Keep this file dependency-free (types only).
 */

export type ThemeKey =
  | "lilac"
  | "noir"
  | "sunset"
  | "mint"
  | "sky"
  | "paper"
  | "ocean"
  | "forest"
  | "rose"
  | "sand"
  | "mono";

export type BackgroundStyle = "flat" | "gradient" | "mesh";
export type ButtonStyle = "solid" | "soft" | "outline";
export type FontScale = "sm" | "md" | "lg";
export type ButtonRadius = "sm" | "md" | "lg" | "xl" | "full";
export type CardStyle = "none" | "soft" | "solid" | "outline";
export type LayoutWidth = "compact" | "wide" | "xwide" | "xxwide" | "full";


export type BlockType = "header" | "hero" | "links" | "text" | "image" | "divider";

export type BlockMode = "public" | "preview";

export type BlockStyle = {
  // spacing
  pad_y?: number | null;
  pad_x?: number | null;
  gap?: number | null;

  // card-ish wrapper
  card?: "none" | "soft" | "solid" | "outline" | null;
  radius?: number | null; // px

  // background / border
  bg_color?: string | null; // hex
  border_color?: string | null; // hex
  border_w?: number | null; // px

  // text
  text_align?: "left" | "center" | "right" | null;

  // extra
  shadow?: "none" | "sm" | "md" | "lg" | null;
};

export type SiteRow = {
  id: string;
  owner_id: string;
  username: string;

  theme_key: ThemeKey | null;
  background_style: BackgroundStyle | null;
  button_style: ButtonStyle | null;

  font_scale: FontScale | null;
  button_radius: ButtonRadius | null;
  card_style: CardStyle | null;
  layout_width?: LayoutWidth | null;

  // optional custom colors (can be null)
  bg_color?: string | null;
  text_color?: string | null;
  muted_color?: string | null;
  border_color?: string | null;
  button_color?: string | null;
  button_text_color?: string | null;

  updated_at?: string | null;
};

export type HeaderContent = {
  title?: string;
  links?: Array<{ title: string; href: string; anchor_id?: string }>;
};

export type HeroVariant = "centered" | "split" | "background";

export type HeroImageSide = "left" | "right";

export type HeroImageSize =
  | "Small"
  | "Medium"
  | "Large"
  | "X-Large"
  | "2X-Large";

export type HeroImageRatio =
  | "1:1"
  | "4:3"
  | "3:2"
  | "16:9"
  | "21:9";

export type HeroContent = {
  variant?: HeroVariant;

  title?: string;
  subtitle?: string;

  primary_button_title?: string;
  primary_button_url?: string;

  secondary_button_title?: string;
  secondary_button_url?: string;

  // split/background image
  image_url?: string;
  image_side?: HeroImageSide;
  image_size?: HeroImageSize;
  image_ratio?: HeroImageRatio;

  // background variant
  bg_overlay?: "soft" | "medium" | "strong";
};

export type LinksItem = {
  title: string;
  url: string;
  align?: "left" | "center" | "right";
  anchor_id?: string;
};

export type LinksContent = {
  items: LinksItem[];
};

export type TextContent = {
  text?: string;
};

export type ImageContent = {
  url?: string;
  alt?: string;
  caption?: string;
};

export type DividerContent = {
  label?: string;
};

export type BlockContent =
  | HeaderContent
  | HeroContent
  | LinksContent
  | TextContent
  | ImageContent
  | DividerContent
  | Record<string, any>;

export type BlockRow = {
  id: string;
  site_id: string;

  type: BlockType;
  position: number;

  hidden?: boolean | null;

  anchor_id?: string | null;

  variant?: string | null;
  style?: BlockStyle | null;

  content: BlockContent | null;

  updated_at?: string | null;
};
