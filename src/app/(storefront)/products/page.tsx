import Image from 'next/image';
import Link from 'next/link';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Db, Sort } from 'mongodb';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { getAllCategories, isProductTextSearchIndexInitialized } from '~/lib/actions';
import { collections, getDefaultDb } from '~/lib/mongodb/db';
import { Category } from '~/lib/mongodb/schema';
import { ProductFilters } from './filters';

const ITEMS_PER_PAGE = 8;

const buildProductsQuery = async (
  db: Db,
  query: string | undefined,
  categorySlug: string | undefined,
  sort: string | undefined,
  page: number,
  limit: number,
  hasTextIndex: boolean,
) => {
  const queryFilter: Record<string, unknown> = {};
  const categoryFilter: Record<string, unknown> = {};

  if (query) {
    if (hasTextIndex) {
      queryFilter.$text = { $search: query };
    } else {
      queryFilter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }
  }

  if (categorySlug) {
    categoryFilter.categories = {
      $elemMatch: {
        slug: categorySlug,
      },
    };
  }

  let sortOptions: Sort = {};
  const projection: Record<string, unknown> = {};

  switch (sort) {
    case 'price_asc':
      sortOptions = { price: 1 };
      break;
    case 'price_desc':
      sortOptions = { price: -1 };
      break;
    case 'name_asc':
      sortOptions = { name: 1 };
      break;
    case 'name_desc':
      sortOptions = { name: -1 };
      break;
    default:
      if (query && hasTextIndex) {
        projection.score = { $meta: 'textScore' };
        sortOptions = { score: { $meta: 'textScore' } } as Sort;
      } else {
        sortOptions = { name: -1 };
      }
  }

  const [results, total] = await Promise.all([
    await collections
      .products(db)
      .aggregate([
        { $match: queryFilter },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryIds',
            foreignField: '_id',
            as: 'categories',
          },
        },
        { $match: categoryFilter },
        {
          $project: {
            ...projection,
            name: 1,
            slug: 1,
            description: 1,
            price: 1,
            images: 1,
            categoryIds: 1,
            categories: 1,
          },
        },
        { $sort: sortOptions },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ])
      .toArray(),
    await collections
      .products(db)
      .aggregate([
        { $match: queryFilter },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryIds',
            foreignField: '_id',
            as: 'categories',
          },
        },
        { $match: categoryFilter },
        { $count: 'total' },
      ])
      .toArray()
      .then((x) => x[0]?.total ?? 0),
  ]);
  return { results, total };
};

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const query = params.q;
  const categorySlug = params.category;
  const sortOption = params.sort;
  let currentPage = parseInt(params.page ?? '1', 10);
  currentPage = isNaN(currentPage) || currentPage <= 0 ? 1 : currentPage;

  const db = getDefaultDb();
  const hasTextIndex = await isProductTextSearchIndexInitialized();
  const categories = await getAllCategories();
  const { results: products, total } = await buildProductsQuery(
    db,
    query,
    categorySlug,
    sortOption,
    currentPage,
    ITEMS_PER_PAGE,
    hasTextIndex,
  );

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const url = new URLSearchParams();

    if (newParams.q || params.q) url.set('q', newParams.q ?? params.q ?? '');
    if (newParams.category || params.category)
      url.set('category', newParams.category ?? params.category ?? '');
    if (newParams.sort || params.sort) url.set('sort', newParams.sort ?? params.sort ?? '');
    if (newParams.page) url.set('page', newParams.page);

    return `/products?${url.toString()}`;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:sticky md:top-8 md:top-18 md:w-64 md:self-start lg:w-72">
          <ProductFilters
            categories={categories.map((c) => ({
              id: c._id.toString(),
              name: c.name,
              slug: c.slug,
            }))}
            categorySlug={categorySlug}
            query={query}
            sort={sortOption}
          />
        </div>

        <div className="flex-1">
          {!hasTextIndex && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-amber-800">
                <strong>Note:</strong> Search index is not initialized. The website might be
                vulnerable to redos attacks. Please, contact an{' '}
                <strong>Administrator to fix this issue</strong>.
              </p>
            </div>
          )}
          {products.length === 0 ? (
            <div className="my-16 text-center">
              <p className="mb-2 text-xl">No products found</p>
              <p className="text-muted-foreground">Try different search terms or filters</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing <span className="font-medium">{products.length}</span> of{' '}
                  <span className="font-medium">{total}</span> products
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      <div className="mt-1 flex flex-wrap gap-1">
                        {product.categories.map((category?: Category) => {
                          if (!category) return null;
                          return (
                            <span
                              key={category.slug}
                              className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs"
                            >
                              {category.name}
                            </span>
                          );
                        })}
                      </div>
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
                      href={buildUrl({ page: (currentPage - 1).toString() })}
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
                      href={buildUrl({ page: (currentPage + 1).toString() })}
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
      </div>
    </div>
  );
}
