import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Category, Product } from "@/lib/site-data";
import { deleteProduct, saveProduct, type ProductInput } from "@/lib/site.functions";
import { formatNpr } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Draft = {
  id?: string;
  name: string;
  category_id: string | null;
  description: string;
  price: string;
  show_price: boolean;
  image_url: string;
  enabled: boolean;
  sort_order: number;
};

const emptyDraft: Draft = {
  name: "",
  category_id: null,
  description: "",
  price: "",
  show_price: true,
  image_url: "",
  enabled: true,
  sort_order: 0,
};

export function ProductsPanel({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const save = useServerFn(saveProduct);
  const remove = useServerFn(deleteProduct);

  const saveMutation = useMutation({
    mutationFn: (input: ProductInput) => save({ data: input }),
    onSuccess: () => {
      toast.success("Product saved");
      setDraft(emptyDraft);
      void queryClient.invalidateQueries();
    },
    onError: (err: Error) => toast.error(err.message || "Could not save product"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Product deleted");
      void queryClient.invalidateQueries();
    },
    onError: (err: Error) => toast.error(err.message || "Could not delete product"),
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!draft.name.trim()) found["name"] = "Name is required.";
    const priceValue = draft.price.trim() === "" ? null : Number(draft.price);
    if (priceValue !== null && (Number.isNaN(priceValue) || priceValue < 0)) {
      found["price"] = "Enter a valid price in NPR.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    saveMutation.mutate({
      ...(draft.id ? { id: draft.id } : {}),
      name: draft.name.trim(),
      category_id: draft.category_id,
      description: draft.description.trim(),
      price_npr: priceValue,
      show_price: draft.show_price,
      image_url: draft.image_url.trim() || null,
      enabled: draft.enabled,
      sort_order: draft.sort_order,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={onSubmit} className="h-fit rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">{draft.id ? "Edit product" : "New product"}</h2>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product-name">Name</Label>
            <Input
              id="product-name"
              value={draft.name}
              maxLength={120}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            {errors["name"] ? <p className="text-xs text-destructive">{errors["name"]}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-category">Category</Label>
            <select
              id="product-category"
              value={draft.category_id ?? ""}
              onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              rows={4}
              value={draft.description}
              maxLength={4000}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-price">Price (NPR)</Label>
            <Input
              id="product-price"
              inputMode="decimal"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            />
            {errors["price"] ? <p className="text-xs text-destructive">{errors["price"]}</p> : null}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="product-show-price"
              checked={draft.show_price}
              onCheckedChange={(checked) => setDraft({ ...draft, show_price: checked })}
            />
            <Label htmlFor="product-show-price">Show price on site</Label>
          </div>

          <ImageUploader
            label="Product image"
            folder="products"
            hint="Remember to save the product after uploading."
            value={draft.image_url}
            onChange={(next) => setDraft({ ...draft, image_url: next })}
          />

          <div className="space-y-1.5">
            <Label htmlFor="product-order">Sort order</Label>
            <Input
              id="product-order"
              type="number"
              min={0}
              max={9999}
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="product-enabled"
              checked={draft.enabled}
              onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })}
            />
            <Label htmlFor="product-enabled">Visible on site</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {draft.id ? "Save changes" : "Add product"}
            </Button>
            {draft.id ? (
              <Button type="button" variant="ghost" onClick={() => setDraft(emptyDraft)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-card p-2">
        {products.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No products yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {products.map((product) => {
              const category = categories.find((item) => item.id === product.category_id);
              return (
                <li key={product.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category ? `${category.name} · ` : ""}
                      {product.show_price && product.price_npr !== null
                        ? formatNpr(product.price_npr)
                        : "Price hidden"}
                      {product.enabled ? "" : " · hidden"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDraft({
                        id: product.id,
                        name: product.name,
                        category_id: product.category_id,
                        description: product.description,
                        price: product.price_npr === null ? "" : String(product.price_npr),
                        show_price: product.show_price,
                        image_url: product.image_url ?? "",
                        enabled: product.enabled,
                        sort_order: product.sort_order,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${product.name}`}
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete "${product.name}"?`)) deleteMutation.mutate(product.id);
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
