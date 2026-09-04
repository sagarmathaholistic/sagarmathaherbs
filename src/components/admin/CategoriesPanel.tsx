import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@/lib/site-data";
import { deleteCategory, saveCategory } from "@/lib/site.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Draft = { id?: string; name: string; enabled: boolean; sort_order: number };

const emptyDraft: Draft = { name: "", enabled: true, sort_order: 0 };

export function CategoriesPanel({ categories }: { categories: Category[] }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const save = useServerFn(saveCategory);
  const remove = useServerFn(deleteCategory);

  const refresh = () => queryClient.invalidateQueries();

  const saveMutation = useMutation({
    mutationFn: (input: Draft) => save({ data: input }),
    onSuccess: () => {
      toast.success("Category saved");
      setDraft(emptyDraft);
      void refresh();
    },
    onError: (err: Error) => toast.error(err.message || "Could not save category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Category deleted");
      void refresh();
    },
    onError: (err: Error) => toast.error(err.message || "Could not delete category"),
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    saveMutation.mutate({ ...draft, name: draft.name.trim() });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={onSubmit} className="h-fit rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">{draft.id ? "Edit category" : "New category"}</h2>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={draft.name}
              maxLength={80}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category-order">Sort order</Label>
            <Input
              id="category-order"
              type="number"
              min={0}
              max={9999}
              value={draft.sort_order}
              onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="category-enabled"
              checked={draft.enabled}
              onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })}
            />
            <Label htmlFor="category-enabled">Visible on site</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              <Plus className="size-4" aria-hidden="true" />
              {draft.id ? "Save changes" : "Add category"}
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
        {categories.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {categories.map((category) => (
              <li key={category.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{category.slug} · order {category.sort_order}
                    {category.enabled ? "" : " · hidden"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      id: category.id,
                      name: category.name,
                      enabled: category.enabled,
                      sort_order: category.sort_order,
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${category.name}`}
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete "${category.name}"? Products keep existing without it.`)) {
                      deleteMutation.mutate(category.id);
                    }
                  }}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
