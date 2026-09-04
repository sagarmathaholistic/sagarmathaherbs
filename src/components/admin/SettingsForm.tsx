import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  isValidSocialUrl,
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
  type SiteConfig,
} from "@/lib/site-config";
import { saveSiteConfig } from "@/lib/site.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Platform = "facebook" | "instagram" | "tiktok";
const platforms: Platform[] = ["facebook", "instagram", "tiktok"];
const platformLabels: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};
const platformPlaceholders: Record<Platform, string> = {
  facebook: "https://facebook.com/yourpage",
  instagram: "https://instagram.com/yourhandle",
  tiktok: "https://tiktok.com/@yourhandle",
};

export function SettingsForm({ initialConfig }: { initialConfig: SiteConfig }) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const save = useServerFn(saveSiteConfig);

  const mutation = useMutation({
    mutationFn: (next: SiteConfig) => save({ data: { config: next } }),
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Could not save settings"),
  });

  const update = (updater: (draft: SiteConfig) => SiteConfig) => setConfig((prev) => updater(prev));

  const validate = (next: SiteConfig) => {
    const found: Record<string, string> = {};
    if (!next.brandName.trim()) found["brandName"] = "Brand name is required.";
    if (!next.home.heroTitle.trim()) found["heroTitle"] = "Hero title is required.";
    if (next.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.contact.email)) {
      found["email"] = "Enter a valid email address.";
    }
    for (const platform of platforms) {
      const link = next.socialMedia[platform];
      if (link.enabled && !isValidSocialUrl(platform, link.url)) {
        found[platform] = `Enter a valid ${platformLabels[platform]} URL.`;
      }
      if (!link.label.trim()) found[`${platform}-label`] = "Label is required.";
    }
    const whatsapp = next.socialMedia.whatsapp;
    if (whatsapp.enabled && !isValidWhatsAppNumber(normalizeWhatsAppNumber(whatsapp.phoneNumber))) {
      found["whatsapp"] = "Use international format, digits only (e.g. 9779812345678).";
    }
    if (!whatsapp.buttonLabel.trim()) found["whatsapp-label"] = "Button label is required.";
    return found;
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized: SiteConfig = {
      ...config,
      socialMedia: {
        ...config.socialMedia,
        whatsapp: {
          ...config.socialMedia.whatsapp,
          phoneNumber: normalizeWhatsAppNumber(config.socialMedia.whatsapp.phoneNumber),
        },
      },
    };
    const found = validate(normalized);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setConfig(normalized);
    mutation.mutate(normalized);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Section title="Brand" description="Shown in the header, footer and browser tab.">
        <Field label="Brand name" error={errors["brandName"]}>
          <Input
            value={config.brandName}
            maxLength={80}
            onChange={(e) => update((d) => ({ ...d, brandName: e.target.value }))}
          />
        </Field>
        <Field label="Tagline">
          <Input
            value={config.tagline}
            maxLength={160}
            onChange={(e) => update((d) => ({ ...d, tagline: e.target.value }))}
          />
        </Field>
        <ImageUploader
          label="Logo"
          folder="logo"
          hint="Leave empty to use the leaf mark. Remember to save settings after uploading."
          value={config.logoUrl}
          onChange={(next) => update((d) => ({ ...d, logoUrl: next }))}
        />
      </Section>

      <Section title="Home page" description="Hero content and the three highlight cards.">
        <Field label="Hero title" error={errors["heroTitle"]}>
          <Input
            value={config.home.heroTitle}
            maxLength={120}
            onChange={(e) => update((d) => ({ ...d, home: { ...d.home, heroTitle: e.target.value } }))}
          />
        </Field>
        <Field label="Hero subtitle">
          <Textarea
            rows={3}
            value={config.home.heroSubtitle}
            maxLength={400}
            onChange={(e) =>
              update((d) => ({ ...d, home: { ...d.home, heroSubtitle: e.target.value } }))
            }
          />
        </Field>
        <Field label="Hero button text">
          <Input
            value={config.home.heroCta}
            maxLength={40}
            onChange={(e) => update((d) => ({ ...d, home: { ...d.home, heroCta: e.target.value } }))}
          />
        </Field>

        <div className="space-y-4">
          <p className="text-sm font-medium">Highlights</p>
          {config.home.highlights.map((highlight, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
              <Input
                aria-label={`Highlight ${index + 1} title`}
                value={highlight.title}
                maxLength={60}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    home: {
                      ...d.home,
                      highlights: d.home.highlights.map((item, i) =>
                        i === index ? { ...item, title: e.target.value } : item,
                      ),
                    },
                  }))
                }
              />
              <Input
                aria-label={`Highlight ${index + 1} text`}
                value={highlight.text}
                maxLength={240}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    home: {
                      ...d.home,
                      highlights: d.home.highlights.map((item, i) =>
                        i === index ? { ...item, text: e.target.value } : item,
                      ),
                    },
                  }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  update((d) => ({
                    ...d,
                    home: { ...d.home, highlights: d.home.highlights.filter((_, i) => i !== index) },
                  }))
                }
              >
                Remove
              </Button>
            </div>
          ))}
          {config.home.highlights.length < 6 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                update((d) => ({
                  ...d,
                  home: { ...d.home, highlights: [...d.home.highlights, { title: "", text: "" }] },
                }))
              }
            >
              Add highlight
            </Button>
          ) : null}
        </div>
      </Section>

      <Section title="About page" description="Each paragraph is shown as its own block.">
        <Field label="Page title">
          <Input
            value={config.about.title}
            maxLength={80}
            onChange={(e) => update((d) => ({ ...d, about: { ...d.about, title: e.target.value } }))}
          />
        </Field>
        {config.about.paragraphs.map((paragraph, index) => (
          <div key={index} className="flex gap-3">
            <Textarea
              aria-label={`Paragraph ${index + 1}`}
              rows={3}
              value={paragraph}
              maxLength={2000}
              onChange={(e) =>
                update((d) => ({
                  ...d,
                  about: {
                    ...d.about,
                    paragraphs: d.about.paragraphs.map((item, i) =>
                      i === index ? e.target.value : item,
                    ),
                  },
                }))
              }
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                update((d) => ({
                  ...d,
                  about: { ...d.about, paragraphs: d.about.paragraphs.filter((_, i) => i !== index) },
                }))
              }
            >
              Remove
            </Button>
          </div>
        ))}
        {config.about.paragraphs.length < 10 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              update((d) => ({ ...d, about: { ...d.about, paragraphs: [...d.about.paragraphs, ""] } }))
            }
          >
            Add paragraph
          </Button>
        ) : null}
      </Section>

      <Section title="Contact details" description="Used on the contact page and in the footer.">
        <Field label="Phone">
          <Input
            value={config.contact.phone}
            maxLength={40}
            onChange={(e) =>
              update((d) => ({ ...d, contact: { ...d.contact, phone: e.target.value } }))
            }
          />
        </Field>
        <Field label="Email" error={errors["email"]}>
          <Input
            type="email"
            value={config.contact.email}
            maxLength={160}
            onChange={(e) =>
              update((d) => ({ ...d, contact: { ...d.contact, email: e.target.value } }))
            }
          />
        </Field>
        <Field label="Address">
          <Input
            value={config.contact.address}
            maxLength={300}
            onChange={(e) =>
              update((d) => ({ ...d, contact: { ...d.contact, address: e.target.value } }))
            }
          />
        </Field>
        <Field label="Google Maps embed URL" hint="Optional. The src value of a Maps embed iframe.">
          <Input
            value={config.contact.mapEmbedUrl}
            maxLength={1000}
            placeholder="https://www.google.com/maps/embed?..."
            onChange={(e) =>
              update((d) => ({ ...d, contact: { ...d.contact, mapEmbedUrl: e.target.value } }))
            }
          />
        </Field>
      </Section>

      <Section title="Social media" description="Disabled links are hidden from the site.">
        {platforms.map((platform) => {
          const link = config.socialMedia[platform];
          return (
            <div key={platform} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{platformLabels[platform]}</p>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`${platform}-enabled`} className="text-xs text-muted-foreground">
                    Show
                  </Label>
                  <Switch
                    id={`${platform}-enabled`}
                    checked={link.enabled}
                    onCheckedChange={(checked) =>
                      update((d) => ({
                        ...d,
                        socialMedia: {
                          ...d.socialMedia,
                          [platform]: { ...d.socialMedia[platform], enabled: checked },
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Profile URL" error={errors[platform]}>
                  <Input
                    value={link.url}
                    maxLength={500}
                    placeholder={platformPlaceholders[platform]}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        socialMedia: {
                          ...d.socialMedia,
                          [platform]: { ...d.socialMedia[platform], url: e.target.value },
                        },
                      }))
                    }
                  />
                </Field>
                <Field label="Label" error={errors[`${platform}-label`]}>
                  <Input
                    value={link.label}
                    maxLength={60}
                    onChange={(e) =>
                      update((d) => ({
                        ...d,
                        socialMedia: {
                          ...d.socialMedia,
                          [platform]: { ...d.socialMedia[platform], label: e.target.value },
                        },
                      }))
                    }
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </Section>

      <Section
        title="WhatsApp"
        description="Powers the floating chat button and every WhatsApp link on the site."
      >
        <div className="flex items-center gap-2">
          <Switch
            id="whatsapp-enabled"
            checked={config.socialMedia.whatsapp.enabled}
            onCheckedChange={(checked) =>
              update((d) => ({
                ...d,
                socialMedia: {
                  ...d.socialMedia,
                  whatsapp: { ...d.socialMedia.whatsapp, enabled: checked },
                },
              }))
            }
          />
          <Label htmlFor="whatsapp-enabled">Enable WhatsApp button</Label>
        </div>
        <Field
          label="Phone number"
          error={errors["whatsapp"]}
          hint="International format, digits only — country code first, no + or spaces."
        >
          <Input
            inputMode="numeric"
            value={config.socialMedia.whatsapp.phoneNumber}
            maxLength={20}
            placeholder="9779812345678"
            onChange={(e) =>
              update((d) => ({
                ...d,
                socialMedia: {
                  ...d.socialMedia,
                  whatsapp: { ...d.socialMedia.whatsapp, phoneNumber: e.target.value },
                },
              }))
            }
          />
        </Field>
        <Field label="Default message" hint="Pre-filled in the customer's chat window.">
          <Textarea
            rows={2}
            value={config.socialMedia.whatsapp.defaultMessage}
            maxLength={500}
            onChange={(e) =>
              update((d) => ({
                ...d,
                socialMedia: {
                  ...d.socialMedia,
                  whatsapp: { ...d.socialMedia.whatsapp, defaultMessage: e.target.value },
                },
              }))
            }
          />
        </Field>
        <Field label="Button label" error={errors["whatsapp-label"]}>
          <Input
            value={config.socialMedia.whatsapp.buttonLabel}
            maxLength={60}
            onChange={(e) =>
              update((d) => ({
                ...d,
                socialMedia: {
                  ...d.socialMedia,
                  whatsapp: { ...d.socialMedia.whatsapp, buttonLabel: e.target.value },
                },
              }))
            }
          />
        </Field>
      </Section>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" disabled={mutation.isPending} className="shadow-lift">
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          Save settings
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
