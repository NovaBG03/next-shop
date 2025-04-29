'use client';

import { useActionState, useMemo, useState } from 'react';

import Form from 'next/form';
import Link from 'next/link';

import { AlertCircleIcon, CheckIcon, ChevronsUpDown, XIcon } from 'lucide-react';

import { MutateAction } from '~/lib/actions';
import { cn } from '~/lib/utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Textarea } from './ui/textarea';

type ProductFormProps = {
  categories: { id: string; name: string; slug: string }[];
  initialData?: {
    name: string;
    slug: string;
    description?: string | undefined;
    price: number;
    stock: number;
    categoryIds?: string[];
  };
  action: MutateAction;
};

export const ProductForm = ({ initialData, action: formAction, categories }: ProductFormProps) => {
  const [state, action, isPending] = useActionState(
    formAction,
    initialData ? { data: initialData } : { data: {} },
  );

  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => {
    const categoryIds = state?.data?.categoryIds;
    return new Set(
      Array.isArray(categoryIds) && categoryIds.every((id) => typeof id === 'string')
        ? categoryIds
        : undefined,
    );
  });
  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedCategoryIds.has(category.id)),
    [categories, selectedCategoryIds],
  );
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <Form action={action}>
      {/* Hidden inputs to submit categoryIds */}
      {Array.from(selectedCategoryIds).map((id) => (
        <input key={id} type="hidden" name="categoryIds" value={id} />
      ))}

      {state?.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-line">{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                name="name"
                defaultValue={state?.data?.name?.toString?.() ?? 'Keyboard for MacOS'}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug*</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={state?.data?.slug?.toString?.() ?? 'keyboard-mac'}
                placeholder="product-slug"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={state?.data?.description?.toString?.()}
                placeholder="Describe this product (optional)"
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price*</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={state?.data?.price?.toString?.() ?? 29.55}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock*</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                step="1"
                min="0"
                defaultValue={state?.data?.stock?.toString?.() ?? 12}
                placeholder="0"
                required
              />
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <Label>Categories*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    <span className="truncate">
                      {selectedCategories.length > 0
                        ? selectedCategories.map((cat) => cat.name).join(', ')
                        : 'Select categories...'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandList>
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.name}
                            onSelect={() => handleSelectCategory(category.id)}
                            className="flex items-center justify-between"
                          >
                            <span>{category.name}</span>
                            <CheckIcon
                              className={cn(
                                'ml-2 h-4 w-4',
                                selectedCategoryIds.has(category.id) ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {/* Display selected categories as badges */}
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedCategories.map((category) => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(category.id)}
                      className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                      aria-label={`Remove ${category.name}`}
                    >
                      <XIcon className="text-muted-foreground hover:text-foreground h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-row-reverse items-center justify-between border-t pt-6">
          <Button type="submit" disabled={isPending}>
            {initialData ? 'Update Product' : 'Save Product'}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href="/admin/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    </Form>
  );
};
