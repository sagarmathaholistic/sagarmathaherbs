import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone } from "lucide-react";
import { siteDataQuery } from "@/lib/site.queries";
import { SocialLinks } from "@/components/site/SocialLinks";
import { WhatsAppLink } from "@/components/site/WhatsAppButton";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Himalaya Naturals — Talk to Our Wellness Team" },
      {
        name: "description",
        content:
          "Call, email or message us on WhatsApp for product advice, bulk orders and stockist enquiries.",
      },
      { property: "og:title", content: "Contact Himalaya Naturals" },
      {
        property: "og:description",
        content: "Call, email or message us on WhatsApp for product advice and orders.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useSuspenseQuery(siteDataQuery);
  const { config } = data;
  const { contact } = config;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Contact us</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          We reply fastest on WhatsApp, usually within a few hours during business days.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
          <ul className="space-y-5 text-sm">
            {contact.phone ? (
              <ContactRow icon={<Phone className="size-4" aria-hidden="true" />} label="Phone">
                <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="hover:text-primary">
                  {contact.phone}
                </a>
              </ContactRow>
            ) : null}
            {contact.email ? (
              <ContactRow icon={<Mail className="size-4" aria-hidden="true" />} label="Email">
                <a href={`mailto:${contact.email}`} className="break-all hover:text-primary">
                  {contact.email}
                </a>
              </ContactRow>
            ) : null}
            {contact.address ? (
              <ContactRow icon={<MapPin className="size-4" aria-hidden="true" />} label="Address">
                {contact.address}
              </ContactRow>
            ) : null}
          </ul>

          <div className="mt-7 border-t border-border pt-6">
            <WhatsAppLink config={config} className="px-6 py-3" />
            <div className="mt-5 flex flex-wrap gap-3">
              <SocialLinks config={config} />
            </div>
          </div>
        </div>

        {contact.mapEmbedUrl ? (
          <div className="overflow-hidden rounded-3xl border border-border bg-muted">
            <iframe
              src={contact.mapEmbedUrl}
              title="Our location on the map"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[420px] w-full border-0"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3.5">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-0.5 text-foreground">{children}</p>
      </div>
    </li>
  );
}
