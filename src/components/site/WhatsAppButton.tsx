import { buildWhatsAppUrl, type SiteConfig } from "@/lib/site-config";
import { WhatsAppIcon } from "./icons";
import { cn } from "@/lib/utils";

export function WhatsAppFloatingButton({ config }: { config: SiteConfig }) {
  const whatsapp = config.socialMedia.whatsapp;
  const href = buildWhatsAppUrl(whatsapp);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={whatsapp.buttonLabel}
      className="group fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-whatsapp py-3 pr-4 pl-3 text-whatsapp-foreground shadow-lift transition-all duration-200 hover:scale-[1.04] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-6 shrink-0 transition-transform duration-300 group-hover:rotate-[8deg]" />
      <span className="hidden text-sm font-medium sm:inline">{whatsapp.buttonLabel}</span>
    </a>
  );
}

export function WhatsAppLink({
  config,
  message,
  className,
  children,
}: {
  config: SiteConfig;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const whatsapp = config.socialMedia.whatsapp;
  const href = buildWhatsAppUrl(whatsapp, message);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={whatsapp.buttonLabel}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-medium text-whatsapp-foreground transition-transform hover:scale-[1.03]",
        className,
      )}
    >
      <WhatsAppIcon className="size-4" />
      {children ?? whatsapp.buttonLabel}
    </a>
  );
}
