import Link from 'next/link';

import {
  AlertCircle,
  ChevronRight,
  DatabaseIcon,
  PackageIcon,
  ShoppingCart,
  TagIcon,
} from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { clearDatabaseAction, initializeIndexesAction, seedDatabaseAction } from '~/lib/actions';
import { collections, getDefaultDb } from '~/lib/mongodb/db';

export default async function Admin() {
  const db = getDefaultDb();

  const [productStats] = await collections
    .products(db)
    .aggregate([
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          lowStockCount: [{ $match: { stock: { $gt: 0, $lte: 10 } } }, { $count: 'count' }],
          outOfStockCount: [{ $match: { stock: { $eq: 0 } } }, { $count: 'count' }],
          avgPrice: [{ $group: { _id: null, avg: { $avg: '$price' } } }],
        },
      },
    ])
    .toArray();

  const categoryCount = await collections.categories(db).countDocuments();

  const productCount = productStats.totalCount[0]?.count ?? 0;
  const lowStockCount = productStats.lowStockCount[0]?.count ?? 0;
  const outOfStockCount = productStats.outOfStockCount[0]?.count ?? 0;
  const avgPrice = Math.round((productStats.avgPrice[0].avg ?? 0) * 100) / 100;

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <PackageIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full justify-between" asChild>
              <Link href="/admin/products">
                View all products
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <TagIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount}</div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full justify-between" asChild>
              <Link href="/admin/categories">
                View all categories
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <ShoppingCart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgPrice}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Products</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-muted-foreground text-xs">
              Products with 10 or fewer items in stock
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock Products</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockCount}</div>
            <p className="text-muted-foreground text-xs">Products with zero stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Database Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <form action={seedDatabaseAction}>
              <Button type="submit" className="w-full" disabled={!!categoryCount || !!productCount}>
                Seed Database
              </Button>
            </form>

            <form action={clearDatabaseAction}>
              <Button type="submit" variant="destructive" className="w-full">
                Clear Database
              </Button>
            </form>

            <form action={initializeIndexesAction}>
              <Button type="submit" variant="outline" className="w-full">
                Initialize Indexes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
