import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Db } from 'mongodb';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { isProductTextSearchIndexInitialized } from '~/lib/actions';
import { collections, getDefaultDb } from '~/lib/mongodb/db';

const ITEMS_PER_PAGE = 8;

const regexSearch = async (query: string, page: number, limit: number, db: Db) => {
  const filter = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ],
  };

  const [results, total] = await Promise.all([
    await collections
      .products(db)
      .find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    await collections.products(db).countDocuments(filter),
  ]);

  return { results, total };
};

const indexSearch = async (query: string, page: number, limit: number, db: Db) => {
  const filter = { $text: { $search: query } };

  const [results, total] = await Promise.all([
    await collections
      .products(db)
      .find(filter, {
        projection: {
          score: { $meta: 'textScore' },
        },
      })
      .sort({ score: { $meta: 'textScore' } })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    await collections.products(db).countDocuments(filter),
  ]);

  return { results, total };
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q;
  let currentPage = parseInt(params.page ?? '1', 10);
  currentPage = isNaN(currentPage) || currentPage <= 0 ? 1 : currentPage;

  if (!query) {
    return redirect('/');
  }

  const db = getDefaultDb();
  const hasTextIndex = await isProductTextSearchIndexInitialized();
  const searchFunction = hasTextIndex ? indexSearch : regexSearch;

  const { results: products, total } = await searchFunction(query, currentPage, ITEMS_PER_PAGE, db);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back to home</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          Search results for: <span className="italic">&ldquo;{query}&rdquo;</span>
        </h1>
      </div>

      {!hasTextIndex && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-amber-800">
            <strong>Note:</strong> Search index is not initialized. The website might be vulnerable
            to redos attacks. Please, contact an <strong>Administrator to fix this issue</strong>.
          </p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="my-16 text-center">
          <p className="mb-2 text-xl">No products found for &ldquo;{query}&rdquo;</p>
          <p className="text-muted-foreground">Try a different search term</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
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

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} asChild>
                <Link
                  className={currentPage <= 1 ? 'pointer-events-none opacity-40' : undefined}
                  href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Link>
              </Button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} asChild>
                <Link
                  className={
                    currentPage >= totalPages ? 'pointer-events-none opacity-40' : undefined
                  }
                  href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
