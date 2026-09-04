import type { SiteConfig } from "./site-config";

export type Category = {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price_npr: number | null;
  show_price: boolean;
  image_url: string | null;
  enabled: boolean;
  sort_order: number;
};

export type SiteData = {
  config: SiteConfig;
  categories: Category[];
  products: Product[];
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
