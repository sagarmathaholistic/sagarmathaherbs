import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { siteDataQuery } from "@/lib/site.queries";
import { ProductCard } from "@/components/site/ProductCard";
import { WhatsAppLink } from "@/components/site/WhatsAppButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Himalaya Naturals — Natural Nutraceutical Supplements in Nepal" },
      {
        name: "description",
        content:
          "Lab-tested herbal supplements, vitamins and superfoods sourced from Nepal's Himalayan highlands. Clean formulas, honest pricing, WhatsApp ordering.",
      },
      { property: "og:title", content: "Himalaya Naturals — Natural Wellness, Thoughtfully Made" },
      {
        property: "og:description",
        content:
          "Lab-tested herbal supplements, vitamins and superfoods sourced from Nepal's Himalayan highlands.",
      },
      { name: "twitter:title", content: "Himalaya Naturals — Natural Wellness" },
      {
        name: "twitter:description",
        content: "Lab-tested herbal supplements and superfoods from Nepal's highlands.",
      },
    ],
  }),
  component: HomePage,
});

const highlightIcons = [Leaf, ShieldCheck, Sprout];

function HomePage() {
  const { data } = useSuspenseQuery(siteDataQuery);
  const { config, products, categories } = data;
  const featured = products.slice(0, 3);
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name;

  return (
    <>
      <section className="leaf-gradient border-b border-border/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/70 px-3.5 py-1.5 text-xs font-medium tracking-wide text-primary uppercase">
              <Leaf className="size-3.5" aria-hidden="true" />
              {config.tagline}
            </p>
            <h1 className="mt-5 text-4xl leading-[1.08] font-semibold text-balance sm:text-5xl lg:text-6xl">
              {config.home.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {config.home.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                {config.home.heroCta || "Explore Products"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {config.home.highlights.map((highlight, index) => {
              const Icon = highlightIcons[index % highlightIcons.length]!;
              return (
                <div
                  key={highlight.title}
                  className="flex gap-4 rounded-2xl border border-border bg-card/80 p-5 shadow-soft backdrop-blur-sm"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold">{highlight.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{highlight.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Featured formulas</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Small-batch products our customers reorder most.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View all products
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoryName(product.category_id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="rounded-3xl border border-border bg-secondary/70 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Not sure where to start?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Message us and our wellness team will help you pick the right formula for your routine.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <WhatsAppLink config={config} className="px-6 py-3" />
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:border-primary"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
