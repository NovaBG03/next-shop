// src/components/product-form.tsx
'use client';

import React, { useActionState, useEffect, useState } from 'react';

import Form from 'next/form';
import Link from 'next/link';

import { AlertCircle, PlusCircle, Trash2 } from 'lucide-react';
import { ObjectId } from 'mongodb';

import { createProductAction, updateProductAction, type ProductFormState } from '~/lib/actions';
import type {
  Category,
  ImageMetadata,
  Product,
  ProductOption,
  ProductVariant,
} from '~/lib/mongodb/schema';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

interface ProductWithId extends Omit<Product, 'categoryIds'> {
  _id: ObjectId;
  categoryIds: ObjectId[];
}

interface CategoryWithId extends Omit<Category, '_id'> {
  _id: ObjectId;
}

interface ProductFormProps {
  initialData?: ProductWithId | null;
  categories: CategoryWithId[];
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const isEditing = !!initialData?._id;

  // Setup action function with proper type
  const formAction = isEditing
    ? (prevState: ProductFormState | undefined, formData: FormData) =>
        updateProductAction(initialData._id.toString(), prevState, formData)
    : createProductAction;

  // Initialize form state
  const [state, action] = useActionState(formAction);

  // Client-side state
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [isPending, setIsPending] = useState(false);

  // Initialize form state from initial data
  useEffect(() => {
    if (initialData) {
      const initialOptions = initialData.options ?? [];
      const initialVariants = initialData.variants ?? [];
      setOptions(initialOptions);
      setVariants(initialVariants);
      setHasVariants(initialOptions.length > 0 || initialVariants.length > 0);
      setImages(initialData.images ?? []);
    }
  }, [initialData]);

  // Update client state based on server response
  useEffect(() => {
    if (state?.productData) {
      // Attempt to cast server state back to usable format
      const productData = state.productData as Partial<Product>;

      if (productData.options) {
        setOptions(productData.options as ProductOption[]);
      }

      if (productData.variants) {
        setVariants(productData.variants as ProductVariant[]);
      }

      if (productData.images) {
        setImages(productData.images as ImageMetadata[]);
      }

      setHasVariants(!!(productData.options?.length || productData.variants?.length));
    }
  }, [state?.productData]);

  // Set isPending based on form submission
  useEffect(() => {
    const formElement = document.querySelector('form');
    if (!formElement) return;

    const handleSubmit = () => setIsPending(true);
    const handleFormReset = () => setIsPending(false);

    formElement.addEventListener('submit', handleSubmit);
    formElement.addEventListener('formdata', handleFormReset);

    return () => {
      formElement.removeEventListener('submit', handleSubmit);
      formElement.removeEventListener('formdata', handleFormReset);
    };
  }, []);

  // --- Variant Generation Logic ---
  const generateVariantCombinations = (currentOptions: ProductOption[]): ProductVariant[] => {
    if (
      currentOptions.length === 0 ||
      currentOptions.some((opt) => !opt.name || opt.values.length === 0)
    ) {
      return [];
    }

    let combinations: string[][] = [[]];

    for (const option of currentOptions) {
      if (!option.name || option.values.length === 0) continue;
      const newCombinations: string[][] = [];
      for (const existingCombo of combinations) {
        for (const value of option.values) {
          newCombinations.push([...existingCombo, value]);
        }
      }
      combinations = newCombinations;
    }

    // Get base values from either existing form or initial data
    let basePrice = 0;

    if (typeof window !== 'undefined') {
      const priceInput = document.getElementById('price') as HTMLInputElement | null;
      basePrice = parseFloat(priceInput?.value || '0') || initialData?.price || 0;
    }

    const preservedVariants = combinations.map((comboValues) => {
      const existing = variants.find(
        (v) =>
          v.optionValues.length === comboValues.length &&
          v.optionValues.every((val, index) => val === comboValues[index]),
      );

      return {
        optionValues: comboValues,
        price: existing?.price ?? basePrice,
        sku: existing?.sku ?? '',
        stock: existing?.stock ?? 0,
        images: existing?.images ?? [],
      };
    });

    return preservedVariants;
  };

  // Regenerate variants when options change
  useEffect(() => {
    if (hasVariants) {
      const newGeneratedVariants = generateVariantCombinations(options);
      setVariants(newGeneratedVariants);
    } else {
      setVariants([]);
    }
  }, [options, hasVariants]);

  // --- Option Handlers ---
  const addOption = () => {
    setOptions([...options, { name: '', values: [] }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOptionName = (index: number, name: string) => {
    const newOptions = [...options];
    newOptions[index].name = name;
    setOptions(newOptions);
  };

  const updateOptionValues = (index: number, valuesString: string) => {
    const newOptions = [...options];
    const values = valuesString
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    newOptions[index].values = values;
    setOptions(newOptions);
  };

  // --- Variant Handlers ---
  const updateVariantField = (
    variantIndex: number,
    field: 'price' | 'sku' | 'stock',
    value: string | number,
  ) => {
    setVariants((currentVariants) => {
      const newVariants = [...currentVariants];
      const variantToUpdate = { ...newVariants[variantIndex] };

      if (field === 'price' || field === 'stock') {
        variantToUpdate[field] = Number(value) || 0;
      } else if (field === 'sku') {
        variantToUpdate[field] = value as string;
      }

      newVariants[variantIndex] = variantToUpdate;
      return newVariants;
    });
  };

  // Set the variant image
  const updateVariantImage = (variantIndex: number, imageUrl: string) => {
    setVariants((currentVariants) => {
      const newVariants = [...currentVariants];
      const variantToUpdate = { ...newVariants[variantIndex] };

      // Find the image by URL
      const selectedImage = images.find((img) => img.url === imageUrl);

      if (selectedImage) {
        variantToUpdate.images = [selectedImage];
      } else {
        variantToUpdate.images = [];
      }

      newVariants[variantIndex] = variantToUpdate;
      return newVariants;
    });
  };

  // --- Image Handlers ---
  const handleAddImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      try {
        new URL(url);
        const altText = prompt('Enter image alt text (optional):');
        const alt = altText || undefined;

        setImages((prevImages) => [...prevImages, { url, alt }]);
      } catch {
        alert('Invalid URL entered.');
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <Form action={action}>
      {state?.message && (
        <Alert variant={state.errors ? 'destructive' : 'default'} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{state.errors ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription className="whitespace-pre-line">{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name*</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initialData?.name}
              placeholder="Enter product name"
              aria-invalid={!!state?.errors?.name}
              aria-describedby={state?.errors?.name ? 'name-error' : undefined}
            />
            {state?.errors?.name && (
              <p id="name-error" className="text-destructive text-xs">
                {state.errors.name.join(', ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug*</Label>
            <Input
              id="slug"
              name="slug"
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              title="Slug must be lowercase alphanumeric with hyphens"
              defaultValue={initialData?.slug}
              placeholder="product-slug"
              aria-invalid={!!state?.errors?.slug}
              aria-describedby={state?.errors?.slug ? 'slug-error' : undefined}
            />
            {state?.errors?.slug && (
              <p id="slug-error" className="text-destructive text-xs">
                {state.errors.slug.join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={initialData?.description}
            placeholder="Describe this product"
            rows={4}
            aria-invalid={!!state?.errors?.description}
            aria-describedby={state?.errors?.description ? 'description-error' : undefined}
          />
          {state?.errors?.description && (
            <p id="description-error" className="text-destructive text-xs">
              {state.errors.description.join(', ')}
            </p>
          )}
        </div>

        {/* Price & Stock */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="price">Base Price*</Label>
            <Input
              id="price"
              name="price"
              type="number"
              required
              step="0.01"
              min="0"
              defaultValue={initialData?.price}
              placeholder="0.00"
              aria-invalid={!!state?.errors?.price}
              aria-describedby={state?.errors?.price ? 'price-error' : undefined}
            />
            {state?.errors?.price && (
              <p id="price-error" className="text-destructive text-xs">
                {state.errors.price.join(', ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">Base SKU</Label>
            <Input
              id="sku"
              name="sku"
              defaultValue={initialData?.sku}
              placeholder="SKU-123"
              aria-invalid={!!state?.errors?.sku}
              aria-describedby={state?.errors?.sku ? 'sku-error' : undefined}
            />
            {state?.errors?.sku && (
              <p id="sku-error" className="text-destructive text-xs">
                {state.errors.sku.join(', ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Base Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              step="1"
              min="0"
              defaultValue={initialData?.stock}
              placeholder="0"
              aria-invalid={!!state?.errors?.stock}
              aria-describedby={state?.errors?.stock ? 'stock-error' : undefined}
            />
            {state?.errors?.stock && (
              <p id="stock-error" className="text-destructive text-xs">
                {state.errors.stock.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <Label htmlFor="categoryIds">Categories*</Label>
          <select
            id="categoryIds"
            name="categoryIds"
            multiple
            required
            defaultValue={initialData?.categoryIds.map((id) => id.toString()) || []}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring h-32 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-invalid={!!state?.errors?.categoryIds}
            aria-describedby={state?.errors?.categoryIds ? 'categoryIds-error' : undefined}
          >
            {categories.map((cat) => (
              <option key={cat._id.toString()} value={cat._id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
          {state?.errors?.categoryIds && (
            <p id="categoryIds-error" className="text-destructive text-xs">
              {state.errors.categoryIds.join(', ')}
            </p>
          )}
        </div>

        {/* Images */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Images</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddImage}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Image
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              {images.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {images.map((img, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-md border p-2">
                      <img
                        src={img.url}
                        alt={img.alt || 'Product image'}
                        className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.className =
                            'h-16 w-16 flex-shrink-0 rounded-md bg-gray-200 flex items-center justify-center text-gray-400 text-xs';
                          placeholder.textContent = 'Error';
                          e.currentTarget.parentNode?.insertBefore(placeholder, e.currentTarget);
                        }}
                      />
                      <div className="min-w-0 flex-grow">
                        <p className="truncate text-sm font-medium">{img.alt || 'Product image'}</p>
                        <p className="text-muted-foreground truncate text-xs">{img.url}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No images added yet. Click &quot;Add Image&quot; to add product images.
                </p>
              )}
            </CardContent>
          </Card>
          <input type="hidden" name="images" value={JSON.stringify(images)} />
          {state?.errors?.images && (
            <p className="text-destructive text-xs">{state.errors.images.join(', ')}</p>
          )}
        </div>

        {/* Variants Toggle */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="hasVariants"
            name="hasVariants"
            checked={hasVariants}
            onCheckedChange={(checked) => setHasVariants(!!checked)}
          />
          <Label htmlFor="hasVariants">This product has variants (e.g., size, color)</Label>
        </div>

        {/* Variants Section */}
        {hasVariants && (
          <Card>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Product Options</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                </div>

                {options.map((option, index) => (
                  <div key={index} className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`option-name-${index}`}>Option Name*</Label>
                      <Input
                        id={`option-name-${index}`}
                        placeholder="e.g., Size"
                        value={option.name}
                        onChange={(e) => updateOptionName(index, e.target.value)}
                        required={hasVariants}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`option-values-${index}`}>
                        Option Values (comma-separated)*
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`option-values-${index}`}
                          placeholder="e.g., Small, Medium, Large"
                          value={option.values.join(', ')}
                          onChange={(e) => updateOptionValues(index, e.target.value)}
                          required={hasVariants}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {options.length === 0 && (
                  <p className="text-muted-foreground text-center text-sm">
                    No options added yet. Click &quot;Add Option&quot; to create product variants.
                  </p>
                )}

                <input type="hidden" name="options" value={JSON.stringify(options)} />
                <input type="hidden" name="variants" value={JSON.stringify(variants)} />

                {state?.errors?.options && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Options Error</AlertTitle>
                    <AlertDescription>{state.errors.options.join(', ')}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Variants Table */}
              {variants.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="text-lg font-medium">Variant Details</h3>

                  {state?.errors?.variants && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Variants Error</AlertTitle>
                      <AlertDescription>{state.errors.variants.join(', ')}</AlertDescription>
                    </Alert>
                  )}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {options
                            .filter((opt) => opt.name)
                            .map((opt) => (
                              <TableHead key={opt.name}>{opt.name}</TableHead>
                            ))}
                          <TableHead>Price*</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Stock*</TableHead>
                          <TableHead>Image</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((variant, vIndex) => (
                          <TableRow key={vIndex}>
                            {variant.optionValues.map((val, valIndex) => (
                              <TableCell key={valIndex}>{val}</TableCell>
                            ))}
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                required={hasVariants}
                                value={variant.price}
                                onChange={(e) =>
                                  updateVariantField(vIndex, 'price', e.target.value)
                                }
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => updateVariantField(vIndex, 'sku', e.target.value)}
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                required={hasVariants}
                                value={variant.stock}
                                onChange={(e) =>
                                  updateVariantField(vIndex, 'stock', e.target.value)
                                }
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <select
                                value={variant.images?.[0]?.url || ''}
                                onChange={(e) => updateVariantImage(vIndex, e.target.value)}
                                className="border-input w-full rounded-md border px-3 py-2 text-sm"
                              >
                                <option value="">-- Select --</option>
                                {images.map((img, imgIndex) => (
                                  <option key={imgIndex} value={img.url}>
                                    {img.alt || img.url.split('/').pop() || `Image ${imgIndex + 1}`}
                                  </option>
                                ))}
                                {images.length === 0 && (
                                  <option value="" disabled>
                                    No images available
                                  </option>
                                )}
                              </select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {hasVariants && options.length > 0 && variants.length === 0 && (
                <Alert>
                  <AlertDescription>
                    Please ensure all options have names and at least one value to generate
                    variants.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="mt-6 flex flex-row-reverse items-center justify-between border-t pt-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href="/admin/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    </Form>
  );
}

export default ProductForm;
