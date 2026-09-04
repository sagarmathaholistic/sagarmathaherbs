import { queryOptions } from "@tanstack/react-query";
import { getSiteData } from "./site.functions";
import { defaultSiteConfig } from "./site-config";
import type { SiteData } from "./site-data";

const fallback: SiteData = { config: defaultSiteConfig, categories: [], products: [] };

export const siteDataQuery = queryOptions({
  queryKey: ["site-data"],
  // The public website must open even when the backend is unavailable.
  queryFn: async (): Promise<SiteData> => {
    try {
      return await getSiteData();
    } catch (error) {
      console.error("[site] using default content", error);
      return fallback;
    }
  },
  staleTime: 30_000,
});
