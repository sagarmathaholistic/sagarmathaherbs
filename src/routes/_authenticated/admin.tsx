import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminSiteData } from "@/lib/site.functions";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { ProductsPanel } from "@/components/admin/ProductsPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Himalaya Naturals" },
      { name: "description", content: "Manage products, categories, content and social settings." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Panel — Himalaya Naturals" },
      { property: "og:description", content: "Internal content management for Himalaya Naturals." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchAdminData = useServerFn(getAdminSiteData);
  const { data, isPending, error } = useQuery({
    queryKey: ["admin-site-data"],
    queryFn: () => fetchAdminData(),
    retry: false,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    void navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold">Admin panel</h1>
            <p className="text-xs text-muted-foreground">Manage your site content and catalogue.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-primary"
            >
              View site
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
            <Button type="button" variant="ghost" onClick={signOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {isPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading your content…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-card p-8">
            <h2 className="text-base font-semibold">You don't have admin access</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This account isn't allowed to manage the site. Sign in with an admin account.
            </p>
            <Button type="button" className="mt-5" onClick={signOut}>
              Sign out
            </Button>
          </div>
        ) : data ? (
          <Tabs defaultValue="settings">
            <TabsList>
              <TabsTrigger value="settings">Site settings</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            <TabsContent value="settings" className="mt-6">
              <SettingsForm key={JSON.stringify(data.config)} initialConfig={data.config} />
            </TabsContent>
            <TabsContent value="products" className="mt-6">
              <ProductsPanel products={data.products} categories={data.categories} />
            </TabsContent>
            <TabsContent value="categories" className="mt-6">
              <CategoriesPanel categories={data.categories} />
            </TabsContent>
          </Tabs>
        ) : null}
      </main>
    </div>
  );
}
