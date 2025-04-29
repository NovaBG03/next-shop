import Link from 'next/link';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { getAllCategories, getProductsPage } from '~/lib/actions';

interface ProductsPageProps {
  searchParams: { page?: string };
}

export default async function Products({ searchParams }: ProductsPageProps) {
  let currentPage = parseInt(searchParams.page ?? '1', 10);
  currentPage = isNaN(currentPage) || currentPage <= 0 ? 1 : currentPage;

  const { results: products, totalPages } = await getProductsPage(currentPage, 10);
  const categories = await getAllCategories();

  const categoryMap = new Map();
  categories.forEach((category) => {
    categoryMap.set(category._id.toString(), category.name);
  });

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">Add Product</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-muted-foreground py-6 text-center">
                No products found. Create your first product.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const id = product._id.toString();
              return (
                <TableRow key={id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.slug}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    {product.categoryIds
                      .map((catId) => categoryMap.get(catId.toString()) || 'Unknown')
                      .join(', ')}
                  </TableCell>
                  <TableCell>{formatDate(product.createdAt)}</TableCell>
                  <TableCell>{formatDate(product.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/products/${id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage <= 1} asChild>
            <Link
              className={currentPage <= 1 ? 'pointer-events-none opacity-40' : undefined}
              href={`/admin/products?page=${currentPage - 1}`}
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
              className={currentPage >= totalPages ? 'pointer-events-none opacity-40' : undefined}
              href={`/admin/products?page=${currentPage + 1}`}
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};
