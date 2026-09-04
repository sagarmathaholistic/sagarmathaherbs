import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Leaf } from "lucide-react";
import { siteDataQuery } from "@/lib/site.queries";
import { formatNpr } from "@/lib/site-config";
import { WhatsAppLink } from "@/components/site/WhatsAppButton";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(siteDataQuery);
    const product = data.products.find((item) => item.slug === params.slug);
    if (!product) throw notFound();
    return { name: product.name, description: product.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Product unavailable — Himalaya Naturals" }, { name: "robots", content: "noindex" }],
      };
    }
    const description = loaderData.description.slice(0, 155);
    const title = `${loaderData.name} — Himalaya Naturals`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductDetailPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Product not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This product may have been removed or is no longer available.
      </p>
      <Link to="/products" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
        Back to all products
      </Link>
    </div>
  ),
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(siteDataQuery);
  const product = data.products.find((item) => item.slug === slug);

  if (!product) return null;
  const category = data.categories.find((item) => item.id === product.category_id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All products
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="aspect-4/3 overflow-hidden rounded-3xl border border-border bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="size-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="leaf-gradient flex size-full items-center justify-center">
              <Leaf className="size-14 text-primary/50" aria-hidden="true" />
            </div>
          )}
        </div>

        <div>
          {category ? (
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              {category.name}
            </p>
          ) : null}
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{product.name}</h1>
          {product.show_price && product.price_npr !== null ? (
            <p className="mt-4 font-display text-2xl font-semibold text-primary">
              {formatNpr(product.price_npr)}
            </p>
          ) : null}
          <p className="mt-6 leading-relaxed whitespace-pre-line text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8">
            <WhatsAppLink
              config={data.config}
              message={`Hello, I would like to know more about ${product.name}.`}
              className="px-6 py-3"
            >
              Enquire on WhatsApp
            </WhatsAppLink>
          </div>
        </div>
      </div>
    </div>
  );
}
