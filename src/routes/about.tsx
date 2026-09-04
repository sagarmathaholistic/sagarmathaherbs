import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Leaf } from "lucide-react";
import { siteDataQuery } from "@/lib/site.queries";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Himalaya Naturals" },
      {
        name: "description",
        content:
          "How we source, formulate and test our Himalayan nutraceuticals — and the people behind the small-batch formulas.",
      },
      { property: "og:title", content: "About Himalaya Naturals" },
      {
        property: "og:description",
        content: "How we source, formulate and test our Himalayan nutraceuticals.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useSuspenseQuery(siteDataQuery);
  const { about } = data.config;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Leaf className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">{about.title || "About Us"}</h1>
      <div className="mt-6 space-y-5 leading-relaxed text-muted-foreground">
        {about.paragraphs.length > 0 ? (
          about.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
        ) : (
          <p>Our story is coming soon.</p>
        )}
      </div>
    </div>
  );
}
