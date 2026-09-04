import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { parseSiteConfig, siteConfigSchema } from "./site-config";
import { slugify, type Category, type Product, type SiteData } from "./site-data";

/* ------------------------------------------------------------------ */
/* Input schemas                                                       */
/* ------------------------------------------------------------------ */

const categoryInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(80),
  enabled: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

const productInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  category_id: z.string().uuid().nullable(),
  description: z.string().trim().max(4000),
  price_npr: z.number().min(0).max(10_000_000).nullable(),
  show_price: z.boolean(),
  image_url: z.string().trim().max(500).nullable(),
  enabled: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
});

const idInput = z.object({ id: z.string().uuid() });

export type CategoryInput = z.infer<typeof categoryInput>;
export type ProductInput = z.infer<typeof productInput>;

/* ------------------------------------------------------------------ */
/* Public read                                                         */
/* ------------------------------------------------------------------ */

export const getSiteData = createServerFn({ method: "GET" }).handler(async (): Promise<SiteData> => {
  const { loadSiteData, fallbackSiteData } = await import("./site.server");
  try {
    return await loadSiteData({ includeDisabled: false });
  } catch (error) {
    // The public website must render even when the backend is unreachable.
    console.error("[site] falling back to default content", error);
    return fallbackSiteData();
  }
});

/* ------------------------------------------------------------------ */
/* Admin reads / writes                                                */
/* ------------------------------------------------------------------ */

export const getAdminSiteData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SiteData> => {
    const { assertAdmin, loadSiteData } = await import("./site.server");
    await assertAdmin(context.supabase, context.userId);
    return loadSiteData({ includeDisabled: true });
  });

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean; userId: string }> => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: data === true, userId: context.userId };
  });

export const saveSiteConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ config: siteConfigSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin, validateConfigOrThrow, toStorageRef } = await import("./site.server");
    await assertAdmin(context.supabase, context.userId);
    const config = { ...data.config, logoUrl: toStorageRef(data.config.logoUrl.trim()) };
    validateConfigOrThrow(config);

    const { error } = await context.supabase
      .from("site_settings")
      .update({ config })
      .eq("id", "main");
    if (error) throw new Error(error.message);
    return { ok: true as const, config: parseSiteConfig(config) };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => categoryInput.parse(input))
  .handler(async ({ data, context }): Promise<Category> => {
    const { assertAdmin, uniqueSlug } = await import("./site.server");
    await assertAdmin(context.supabase, context.userId);

    const base = slugify(data.name) || "category";
    const row = {
      name: data.name,
      enabled: data.enabled,
      sort_order: data.sort_order,
    };

    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("categories")
        .update(row)
        .eq("id", data.id)
        .select("id, name, slug, enabled, sort_order")
        .single();
      if (error) throw new Error(error.message);
      return updated as Category;
    }

    const slug = await uniqueSlug(context.supabase, "categories", base);
    const { data: inserted, error } = await context.supabase
      .from("categories")
      .insert({ ...row, slug })
      .select("id, name, slug, enabled, sort_order")
      .single();
    if (error) throw new Error(error.message);
    return inserted as Category;
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./site.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productInput.parse(input))
  .handler(async ({ data, context }): Promise<Product> => {
    const { assertAdmin, uniqueSlug, sanitizeImageRef } = await import("./site.server");
    await assertAdmin(context.supabase, context.userId);

    const row = {
      name: data.name,
      category_id: data.category_id,
      description: data.description,
      price_npr: data.price_npr,
      show_price: data.show_price,
      image_url: sanitizeImageRef(data.image_url),
      enabled: data.enabled,
      sort_order: data.sort_order,
    };
    const columns = "id, category_id, name, slug, description, price_npr, show_price, image_url, enabled, sort_order";

    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("products")
        .update(row)
        .eq("id", data.id)
        .select(columns)
        .single();
      if (error) throw new Error(error.message);
      return updated as Product;
    }

    const slug = await uniqueSlug(context.supabase, "products", slugify(data.name) || "product");
    const { data: inserted, error } = await context.supabase
      .from("products")
      .insert({ ...row, slug })
      .select(columns)
      .single();
    if (error) throw new Error(error.message);
    return inserted as Product;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./site.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
