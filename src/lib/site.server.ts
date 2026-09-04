import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import {
  isValidSocialUrl,
  isValidWhatsAppNumber,
  parseSiteConfig,
  type SiteConfig,
} from "./site-config";
import type { Category, Product, SiteData } from "./site-data";

type Client = SupabaseClient<Database>;

const IMAGE_BUCKET = "site-images";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

const PRODUCT_COLUMNS =
  "id, category_id, name, slug, description, price_npr, show_price, image_url, enabled, sort_order";

/** Anon-key client for public reads during SSR. */
function publicClient(): Client {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase environment variables are not configured.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export async function assertAdmin(supabase: Client, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("Forbidden: administrator access required.");
}

/** Server-side re-validation of admin-submitted configuration. */
export function validateConfigOrThrow(config: SiteConfig): void {
  for (const platform of ["facebook", "instagram", "tiktok"] as const) {
    const link = config.socialMedia[platform];
    if (link.enabled && !isValidSocialUrl(platform, link.url)) {
      throw new Error(`Enter a valid ${link.label} URL (https://...) or disable the platform.`);
    }
  }
  const whatsapp = config.socialMedia.whatsapp;
  if (whatsapp.enabled && !isValidWhatsAppNumber(whatsapp.phoneNumber)) {
    throw new Error(
      "Enter the WhatsApp number in international format, digits only (e.g. 9779800000000).",
    );
  }
  if (config.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contact.email)) {
    throw new Error("Enter a valid contact email address.");
  }
  for (const key of ["mapEmbedUrl"] as const) {
    const value = config.contact[key];
    if (value && !/^https?:\/\//i.test(value)) {
      throw new Error("The map URL must start with http:// or https://");
    }
  }
  if (config.logoUrl && !isSafeImageRef(config.logoUrl)) {
    throw new Error("The logo reference is not valid.");
  }
}

function isSafeImageRef(value: string): boolean {
  if (/^https?:\/\//i.test(value)) return true;
  return /^[A-Za-z0-9/_.-]+$/.test(value) && !value.includes("..");
}

/** Signed storage URLs round-trip back to the bucket path so they never expire. */
export function toStorageRef(value: string): string {
  const match = value.match(
    new RegExp(`/storage/v1/object/(?:sign|public)/${IMAGE_BUCKET}/([^?]+)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : value;
}

export function sanitizeImageRef(value: string | null): string | null {
  if (!value) return null;
  const trimmed = toStorageRef(value.trim());
  if (!trimmed) return null;
  return isSafeImageRef(trimmed) ? trimmed : null;
}

/** Turns storage paths into signed URLs; leaves absolute URLs untouched. */
async function resolveImageRefs(refs: (string | null)[]): Promise<Map<string, string>> {
  const paths = Array.from(
    new Set(refs.filter((ref): ref is string => !!ref && !/^https?:\/\//i.test(ref))),
  );
  const resolved = new Map<string, string>();
  if (paths.length === 0) return resolved;
  try {
    const { data } = await supabaseAdmin.storage
      .from(IMAGE_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    for (const entry of data ?? []) {
      if (entry.signedUrl && entry.path) resolved.set(entry.path, entry.signedUrl);
    }
  } catch (error) {
    console.error("[site] unable to sign image URLs", error);
  }
  return resolved;
}

/** Falls back to the built-in defaults so the public site renders without a backend. */
export function fallbackSiteData(): SiteData {
  return { config: parseSiteConfig({}), categories: [], products: [] };
}

export async function loadSiteData({
  includeDisabled,
}: {
  includeDisabled: boolean;
}): Promise<SiteData> {
  const client: Client = includeDisabled ? (supabaseAdmin as Client) : publicClient();


  const settingsPromise = client.from("site_settings").select("config").eq("id", "main").maybeSingle();
  let categoryQuery = client.from("categories").select("id, name, slug, enabled, sort_order");
  let productQuery = client.from("products").select(PRODUCT_COLUMNS);
  if (!includeDisabled) {
    categoryQuery = categoryQuery.eq("enabled", true);
    productQuery = productQuery.eq("enabled", true);
  }

  const [settings, categories, products] = await Promise.all([
    settingsPromise,
    categoryQuery.order("sort_order", { ascending: true }),
    productQuery.order("sort_order", { ascending: true }),
  ]);

  const config = parseSiteConfig(settings.data?.config ?? {});
  const categoryRows = (categories.data ?? []) as Category[];
  const productRows = (products.data ?? []) as Product[];

  const signed = await resolveImageRefs([
    config.logoUrl || null,
    ...productRows.map((product) => product.image_url),
  ]);

  return {
    config: { ...config, logoUrl: signed.get(config.logoUrl) ?? config.logoUrl },
    categories: categoryRows,
    products: productRows.map((product) => ({
      ...product,
      image_url: product.image_url ? (signed.get(product.image_url) ?? product.image_url) : null,
      price_npr: product.price_npr === null ? null : Number(product.price_npr),
    })),
  };
}

export async function uniqueSlug(
  client: Client,
  table: "categories" | "products",
  base: string,
): Promise<string> {
  let candidate = base;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data } = await client.from(table).select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt + 2}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}
