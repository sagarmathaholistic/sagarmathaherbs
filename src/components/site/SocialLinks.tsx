import { Facebook, Instagram } from "lucide-react";
import { TikTokIcon } from "./icons";
import { activeSocialLinks, socialAccessibleLabels, type SiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const iconFor = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: TikTokIcon,
} as const;

export function SocialLinks({ config, className }: { config: SiteConfig; className?: string }) {
  const links = activeSocialLinks(config);
  if (links.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map((link) => {
        const Icon = iconFor[link.platform];
        return (
          <li key={link.platform}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={socialAccessibleLabels[link.platform]}
              title={link.label}
              className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Icon className="size-5" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
