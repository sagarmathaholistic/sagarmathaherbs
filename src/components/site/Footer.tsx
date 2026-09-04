import { Link } from "@tanstack/react-router";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";
import type { SiteConfig } from "@/lib/site-config";
import { SocialLinks } from "./SocialLinks";
import { WhatsAppLink } from "./WhatsAppButton";

const footerNav = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
] as const;

export function Footer({ config }: { config: SiteConfig }) {
  const { contact } = config;

  return (
    <footer className="mt-24 border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={`${config.brandName} logo`}
                className="h-10 w-auto max-w-[170px] object-contain"
                loading="lazy"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Leaf className="size-4.5" aria-hidden="true" />
              </span>
            )}
            <span className="font-display text-lg font-semibold">{config.brandName}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {config.tagline}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <SocialLinks config={config} />
            <WhatsAppLink config={config} />
          </div>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold tracking-wide uppercase">Explore</h2>
          <ul className="mt-4 space-y-2.5">
            {footerNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">Get in touch</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {contact.phone ? (
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                  className="transition-colors hover:text-primary"
                >
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.email ? (
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all transition-colors hover:text-primary"
                >
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.address ? (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{contact.address}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {config.brandName}. All rights reserved.
          </p>
          <Link to="/admin" className="transition-colors hover:text-primary">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
