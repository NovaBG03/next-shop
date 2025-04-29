import Link from 'next/link';

import { Button } from '~/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { getAllCategories, getAllProducts } from '~/lib/actions';

export default async function Products() {
  const products = await getAllProducts();
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
                      <Link href={`/admin/products/${id}/edit`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
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
