-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Site settings (singleton)
CREATE TABLE public.site_settings (
  id text PRIMARY KEY DEFAULT 'main',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 'main')
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enabled categories are publicly readable"
  ON public.categories FOR SELECT TO anon USING (enabled = true);
CREATE POLICY "Authenticated can read categories"
  ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  price_npr numeric(10,2),
  show_price boolean NOT NULL DEFAULT true,
  image_url text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enabled products are publicly readable"
  ON public.products FOR SELECT TO anon USING (enabled = true);
CREATE POLICY "Authenticated can read products"
  ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX products_category_idx ON public.products(category_id);

-- Seed site settings
INSERT INTO public.site_settings (id, config) VALUES ('main', '{
  "brandName": "Himalaya Naturals",
  "tagline": "Natural Wellness, Thoughtfully Made.",
  "logoUrl": "",
  "home": {
    "heroTitle": "Pure Himalayan Nutraceuticals",
    "heroSubtitle": "Clean, tested and thoughtfully formulated supplements sourced from Nepal''s highlands.",
    "heroCta": "Explore Products",
    "highlights": [
      {"title": "100% Natural", "text": "Plant-based actives with no artificial fillers."},
      {"title": "Lab Tested", "text": "Every batch verified for purity and potency."},
      {"title": "Ethically Sourced", "text": "Harvested with Himalayan farming communities."}
    ]
  },
  "about": {
    "title": "About Us",
    "paragraphs": [
      "Himalaya Naturals crafts nutraceutical supplements from herbs and botanicals grown in the clean highlands of Nepal.",
      "We work directly with local farming cooperatives, test every batch in accredited laboratories, and formulate in small runs so each product stays fresh and effective."
    ]
  },
  "contact": {
    "phone": "+977 9800000000",
    "email": "hello@himalayanaturals.com",
    "address": "Jhamsikhel, Lalitpur, Kathmandu, Nepal",
    "mapEmbedUrl": "https://www.google.com/maps?q=Jhamsikhel,Lalitpur,Nepal&output=embed"
  },
  "socialMedia": {
    "facebook": {"enabled": true, "url": "https://facebook.com/example", "label": "Facebook"},
    "instagram": {"enabled": true, "url": "https://instagram.com/example", "label": "Instagram"},
    "tiktok": {"enabled": true, "url": "https://tiktok.com/@example", "label": "TikTok"},
    "whatsapp": {"enabled": true, "phoneNumber": "9779800000000", "defaultMessage": "Hello, I would like to know more about your products.", "buttonLabel": "Chat on WhatsApp"}
  }
}'::jsonb);

-- Seed categories
INSERT INTO public.categories (id, name, slug, enabled, sort_order) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Herbal Supplements', 'herbal-supplements', true, 1),
  ('22222222-2222-4222-8222-222222222222', 'Vitamins & Minerals', 'vitamins-minerals', true, 2),
  ('33333333-3333-4333-8333-333333333333', 'Superfoods', 'superfoods', true, 3);

-- Seed products
INSERT INTO public.products (category_id, name, slug, description, price_npr, show_price, enabled, sort_order) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Himalayan Ashwagandha', 'himalayan-ashwagandha', 'Adaptogenic root extract standardised to 5% withanolides, supporting calm energy and healthy stress response.', 1450.00, true, true, 1),
  ('11111111-1111-4111-8111-111111111111', 'Turmeric Curcumin Plus', 'turmeric-curcumin-plus', 'High-potency curcumin with black pepper extract for everyday joint comfort and antioxidant support.', 1250.00, true, true, 2),
  ('22222222-2222-4222-8222-222222222222', 'Vitamin D3 + K2 Drops', 'vitamin-d3-k2-drops', 'Sunshine vitamin paired with K2 MK-7 for bone strength and immune balance. 30 ml liquid drops.', 980.00, true, true, 3),
  ('22222222-2222-4222-8222-222222222222', 'Chelated Magnesium', 'chelated-magnesium', 'Gentle, highly absorbable magnesium bisglycinate for muscle recovery and restful sleep.', 1120.00, true, true, 4),
  ('33333333-3333-4333-8333-333333333333', 'Wild Sea Buckthorn Berry', 'wild-sea-buckthorn-berry', 'Cold-processed berry powder rich in omega-7, vitamin C and carotenoids for skin and immunity.', 1650.00, true, true, 5),
  ('33333333-3333-4333-8333-333333333333', 'Organic Moringa Leaf', 'organic-moringa-leaf', 'Shade-dried moringa leaf powder, a whole-food source of plant protein, iron and chlorophyll.', 890.00, true, true, 6);