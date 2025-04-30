import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ShoppingCartIcon } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { getProductBySlug } from '~/lib/actions';
import { Category, ProductOption } from '~/lib/mongodb/schema';

interface ProductDetailsPageProps {
  params: {
    productId: string;
  };
}

interface ImageType {
  url: string;
  alt?: string;
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { productId } = params;
  const product = await getProductBySlug(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link href="/products" className="text-primary hover:underline">
          &larr; Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="sticky top-24">
            {product.images && product.images.length > 0 ? (
              <div className="overflow-hidden rounded-lg bg-white">
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  width={600}
                  height={600}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex h-[400px] items-center justify-center rounded-lg bg-gray-100">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}

            {product.images && product.images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((image: ImageType, index: number) => (
                  <div
                    key={index}
                    className="cursor-pointer overflow-hidden rounded-md border border-gray-200"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name} - Image ${index + 1}`}
                      width={150}
                      height={150}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>

          <div className="mb-4 flex flex-wrap gap-2">
            {product.categories?.map((category: Category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="text-primary mb-6 text-2xl font-bold">${product.price.toFixed(2)}</div>

          <div className="mb-6">
            <p className="text-muted-foreground">
              {product.description || 'No description available for this product.'}
            </p>
          </div>

          {product.options && product.options.length > 0 && (
            <div className="mb-6">
              {product.options.map((option: ProductOption) => (
                <div key={option.name} className="mb-4">
                  <h3 className="mb-2 font-medium">{option.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value: string) => (
                      <div
                        key={value}
                        className="hover:border-primary cursor-pointer rounded-md border border-gray-200 px-4 py-2"
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Availability:</span>
              {product.stock > 0 ? (
                <span className="text-sm text-green-600">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-sm text-red-600">Out of Stock</span>
              )}
            </div>
          </div>

          <Button size="lg" className="mb-4 w-full" disabled={product.stock <= 0}>
            <ShoppingCartIcon className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>

          <Separator className="my-6" />

          <div>
            <h2 className="mb-4 text-xl font-semibold">Product Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">SKU</span>
                <span className="font-medium">{product._id.toString()}</span>
              </div>
              {product.variants && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Variants</span>
                  <span className="font-medium">{product.variants.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
