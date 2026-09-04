import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { formatNpr } from "@/lib/site-config";
import type { Product } from "@/lib/site-data";

export function ProductCard({ product, categoryName }: { product: Product; categoryName?: string | undefined }) {
  return (
    <article className="card-lift group overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div className="aspect-4/3 w-full overflow-hidden bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="leaf-gradient flex size-full items-center justify-center">
              <Leaf className="size-10 text-primary/50" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-5">
          {categoryName ? (
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              {categoryName}
            </p>
          ) : null}
          <h3 className="mt-1.5 text-lg leading-snug font-semibold">{product.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          {product.show_price && product.price_npr !== null ? (
            <p className="mt-4 font-display text-base font-semibold text-primary">
              {formatNpr(product.price_npr)}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
