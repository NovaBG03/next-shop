'use client';

import { useActionState, useMemo, useRef, useState } from 'react';

import Form from 'next/form';
import Image from 'next/image';
import Link from 'next/link';

import { AlertCircleIcon, CheckIcon, ChevronsUpDown, LinkIcon, XIcon } from 'lucide-react';

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
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

type DataImage = { url: string; alt?: string };

type ProductFormProps = {
  categories: { id: string; name: string; slug: string }[];
  initialData?: {
    name: string;
    slug: string;
    description?: string | undefined;
    price: number;
    stock: number;
    categoryIds?: string[];
    images?: DataImage[];
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

  const imageUrlInputRef = useRef<React.ComponentRef<'input'>>(null);
  const [selectedImages, setSelectedImages] = useState<DataImage[]>(
    () => (state?.data?.images as DataImage[]) ?? [],
  );
  const handleAddImageUrl = () => {
    const currentImageUrl = imageUrlInputRef.current?.value?.trim?.();
    if (!currentImageUrl) return;
    try {
      new URL(currentImageUrl);
      if (!selectedImages.some((x) => x.url === currentImageUrl)) {
        setSelectedImages((prev) => [...prev, { url: currentImageUrl, alt: 'Product Image' }]);
      }
    } catch (error) {
      console.log('Invalid URL provided', error);
    }
    if (imageUrlInputRef.current) {
      imageUrlInputRef.current.value = '';
    }
  };
  const handleRemoveImageUrl = (urlToRemove: string) => {
    setSelectedImages((prev) => prev.filter((x) => x.url !== urlToRemove));
  };

  return (
    <Form action={action}>
      {/* Hidden inputs to submit categoryIds */}
      {Array.from(selectedCategoryIds).map((id) => (
        <input key={id} type="hidden" name="categoryIds" value={id} />
      ))}
      {/* Hidden inputs to submit imageUrls */}
      {selectedImages.map((image, index) => (
        <input key={`img-${index}`} type="hidden" name="imageUrls" value={image.url} />
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
                defaultValue={state?.data?.name?.toString?.()}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug*</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={state?.data?.slug?.toString?.()}
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
                defaultValue={state?.data?.price?.toString?.()}
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
                defaultValue={state?.data?.stock?.toString?.()}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Categories*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    <span className="truncate">
                      {selectedCategories.length > 0
                        ? selectedCategories.map((category) => category.name).join(', ')
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

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URLs</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={imageUrlInputRef}
                  id="imageUrl"
                  placeholder="Paste image URL here"
                  type="url"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddImageUrl} variant="outline">
                  Add
                </Button>
              </div>
              {/* Display added image URLs */}
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedImages.map((image, index) => (
                  <div key={index} className="group relative p-1">
                    <Image
                      src={image.url}
                      alt={image.alt ?? `Product image ${index + 1}`}
                      className="h-32 w-32 rounded-sm object-cover"
                      width={128}
                      height={128}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImageUrl(image.url)}
                      className="ring-offset-background focus:ring-ring absolute -top-1 -right-1 hidden cursor-pointer rounded-full bg-red-500 p-0.5 text-white opacity-80 group-hover:inline-flex hover:opacity-100 focus:ring-2 focus:ring-offset-2"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                    <Tooltip disableHoverableContent>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(image.url)}
                          className="bg-primary absolute top-1/2 left-1/2 hidden -translate-1/2 cursor-pointer rounded-full text-white opacity-80 group-hover:inline-flex hover:opacity-100"
                        >
                          <LinkIcon />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs break-all">{image.url}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
              {selectedImages.length === 0 && (
                <p className="text-muted-foreground text-sm">No images added yet.</p>
              )}
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
