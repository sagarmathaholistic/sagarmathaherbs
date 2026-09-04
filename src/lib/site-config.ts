import { z } from "zod";

/**
 * Client-safe module: the shape of the site configuration (the JSON document
 * stored in the single `site_settings` row), validation schemas and pure
 * helpers. Imported by both the browser and server function handlers.
 */

export const socialLinkSchema = z.object({
  enabled: z.boolean(),
  url: z.string().trim().max(500),
  label: z.string().trim().min(1).max(60),
});

export const whatsappSchema = z.object({
  enabled: z.boolean(),
  phoneNumber: z.string().trim().max(20),
  defaultMessage: z.string().trim().max(500),
  buttonLabel: z.string().trim().min(1).max(60),
});

export const siteConfigSchema = z.object({
  brandName: z.string().trim().min(1, "Brand name is required").max(80),
  tagline: z.string().trim().max(160),
  logoUrl: z.string().trim().max(500),
  home: z.object({
    heroTitle: z.string().trim().min(1, "Hero title is required").max(120),
    heroSubtitle: z.string().trim().max(400),
    heroCta: z.string().trim().max(40),
    highlights: z
      .array(
        z.object({
          title: z.string().trim().max(60),
          text: z.string().trim().max(240),
        }),
      )
      .max(6),
  }),
  about: z.object({
    title: z.string().trim().max(80),
    paragraphs: z.array(z.string().trim().max(2000)).max(10),
  }),
  contact: z.object({
    phone: z.string().trim().max(40),
    email: z.string().trim().max(160),
    address: z.string().trim().max(300),
    mapEmbedUrl: z.string().trim().max(1000),
  }),
  socialMedia: z.object({
    facebook: socialLinkSchema,
    instagram: socialLinkSchema,
    tiktok: socialLinkSchema,
    whatsapp: whatsappSchema,
  }),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type WhatsAppConfig = z.infer<typeof whatsappSchema>;

export const defaultSiteConfig: SiteConfig = {
  brandName: "Himalaya Naturals",
  tagline: "Natural Wellness, Thoughtfully Made.",
  logoUrl: "",
  home: {
    heroTitle: "Pure Himalayan Nutraceuticals",
    heroSubtitle: "Clean, tested and thoughtfully formulated supplements.",
    heroCta: "Explore Products",
    highlights: [],
  },
  about: { title: "About Us", paragraphs: [] },
  contact: { phone: "", email: "", address: "", mapEmbedUrl: "" },
  socialMedia: {
    facebook: { enabled: false, url: "", label: "Facebook" },
    instagram: { enabled: false, url: "", label: "Instagram" },
    tiktok: { enabled: false, url: "", label: "TikTok" },
    whatsapp: {
      enabled: false,
      phoneNumber: "",
      defaultMessage: "",
      buttonLabel: "Chat on WhatsApp",
    },
  },
};

/** Never throws: falls back to defaults so bad config can't break the site. */
export function parseSiteConfig(raw: unknown): SiteConfig {
  const merged = deepMerge(defaultSiteConfig, raw);
  const result = siteConfigSchema.safeParse(merged);
  return result.success ? result.data : defaultSiteConfig;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override === undefined ? base : (override as T)) ?? base;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue;
    out[key] = key in base ? deepMerge((base as Record<string, unknown>)[key], value) : value;
  }
  return out as T;
}

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

export const socialHosts: Record<"facebook" | "instagram" | "tiktok", string[]> = {
  facebook: ["facebook.com", "fb.com", "m.facebook.com"],
  instagram: ["instagram.com", "instagr.am"],
  tiktok: ["tiktok.com", "vm.tiktok.com"],
};

export function isValidSocialUrl(
  platform: "facebook" | "instagram" | "tiktok",
  url: string,
): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  return socialHosts[platform].some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/** International format, digits only, no `+`, spaces or brackets. */
export function isValidWhatsAppNumber(value: string): boolean {
  return /^[1-9]\d{7,14}$/.test(value.trim());
}

export function normalizeWhatsAppNumber(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/** Builds the wa.me chat URL at runtime — never hard-code it in a component. */
export function buildWhatsAppUrl(whatsapp: WhatsAppConfig, messageOverride?: string): string | null {
  const phone = normalizeWhatsAppNumber(whatsapp.phoneNumber);
  if (!whatsapp.enabled || !isValidWhatsAppNumber(phone)) return null;
  const message = (messageOverride ?? whatsapp.defaultMessage).trim();
  const query = message ? `?text=${encodeURIComponent(message.slice(0, 500))}` : "";
  return `https://wa.me/${phone}${query}`;
}

export const socialAccessibleLabels: Record<"facebook" | "instagram" | "tiktok", string> = {
  facebook: "Visit us on Facebook",
  instagram: "Follow us on Instagram",
  tiktok: "Follow us on TikTok",
};

/** Only the social links that are enabled AND have a valid URL. */
export function activeSocialLinks(config: SiteConfig) {
  return (["facebook", "instagram", "tiktok"] as const)
    .map((platform) => ({ platform, ...config.socialMedia[platform] }))
    .filter((link) => link.enabled && isValidSocialUrl(link.platform, link.url));
}

export function formatNpr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return `NPR ${new Intl.NumberFormat("en-NP", { maximumFractionDigits: 0 }).format(value)}`;
}
