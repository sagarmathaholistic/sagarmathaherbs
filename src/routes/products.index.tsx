import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteDataQuery } from "@/lib/site.queries";
import { ProductCard } from "@/components/site/ProductCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Shop Natural Supplements — Himalaya Naturals" },
      {
        name: "description",
        content:
          "Browse herbal supplements, vitamins, minerals and superfoods. Lab-tested, ethically sourced and priced in NPR.",
      },
      { property: "og:title", content: "Shop Natural Supplements — Himalaya Naturals" },
      {
        property: "og:description",
        content: "Herbal supplements, vitamins and superfoods, lab-tested and ethically sourced.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { data } = useSuspenseQuery(siteDataQuery);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visibleCategories = data.categories;
  const products = activeCategory
    ? data.products.filter((product) => product.category_id === activeCategory)
    : data.products;
  const categoryName = (id: string | null) => visibleCategories.find((c) => c.id === id)?.name;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Our products</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every formula is made in small batches and tested for purity before it reaches you.
        </p>
      </header>

      {visibleCategories.length > 0 ? (
        <div className="mt-8 -mx-1 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <FilterChip
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
            label="All"
          />
          {visibleCategories.map((category) => (
            <FilterChip
              key={category.id}
              active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              label={category.name}
            />
          ))}
        </div>
      ) : null}

      {products.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No products to show yet. Please check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryName={categoryName(product.category_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "mx-1 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
