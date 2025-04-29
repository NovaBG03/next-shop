import Image from 'next/image';
import Link from 'next/link';

import { ArrowRight, Tag } from 'lucide-react';

import { SearchForm } from '~/components/search-form';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { collections, getDefaultDb } from '~/lib/mongodb/db';

export default async function HomePage() {
  const db = getDefaultDb();

  const featuredProducts = await collections
    .products(db)
    .find({})
    .sort({ price: -1 })
    .limit(4)
    .toArray();

  const categories = await collections.categories(db).find({}).limit(6).toArray();

  return (
    <div className="flex min-h-screen flex-col">
      <section className="bg-muted/30 flex min-h-[40svh] items-center py-6">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-2xl font-bold">Find Your Next Thing</h2>
          <div className="mx-auto max-w-2xl">
            <SearchForm variant="hero" />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link
              href="/products"
              className="text-primary hover:text-primary/90 flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <Card key={product._id.toString()}>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.images && product.images[0] && (
                    <div className="relative mb-4 aspect-square overflow-hidden rounded-md">
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        className="h-full w-full object-cover"
                        width={800}
                        height={800}
                      />
                    </div>
                  )}
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {product.description || 'No description available'}
                  </p>
                  <p className="mt-2 text-lg font-bold">${product.price.toFixed(2)}</p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/product/${product.slug}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/10 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">Our Best Categories</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link href={`/category/${category.slug}`} key={category._id.toString()}>
                <div className="bg-background hover:border-primary/20 flex flex-col items-center rounded-lg border p-4 transition-all hover:shadow-sm">
                  <div className="bg-muted/40 mb-3 rounded-full p-3">
                    <Tag className="text-foreground/80 h-6 w-6" />
                  </div>
                  <span className="text-center font-medium">{category.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
