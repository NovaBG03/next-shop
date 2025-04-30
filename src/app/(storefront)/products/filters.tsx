'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type FilterProps = {
  categories: Category[];
  query?: string | undefined;
  sort?: string | undefined;
  categorySlug?: string | undefined;
};

export function ProductFilters({ categories, query, sort, categorySlug }: FilterProps) {
  const router = useRouter();

  const showClearButton = query || sort || categorySlug;

  return (
    <div className="bg-background flex flex-col space-y-6 rounded-lg border p-4 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Filters</h2>
        {query && (
          <p className="text-muted-foreground text-sm">
            Showing results for: <span className="font-medium">{query}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Sort By</h3>
        <Select
          value={sort ?? 'default'}
          onValueChange={(value) => {
            console.log(value);
            const url = new URL(window.location.href);
            url.searchParams.delete('page');
            if (value !== 'default') {
              url.searchParams.set('sort', value);
            } else {
              url.searchParams.delete('sort');
            }
            router.push(url.href);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Relevance</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="name_asc">Name: A to Z</SelectItem>
            <SelectItem value="name_desc">Name: Z to A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Categories</h3>
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.slug}`}
                  checked={categorySlug === category.slug}
                  onCheckedChange={(checked) => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('page');
                    if (checked) {
                      url.searchParams.set('category', category.slug);
                    } else {
                      url.searchParams.delete('category');
                    }
                    router.push(url.href);
                  }}
                />
                <Label htmlFor={`category-${category.slug}`} className="cursor-pointer text-sm">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showClearButton && (
        <Button variant="outline" className="w-full" asChild>
          <Link href="/products">Clear All Filters</Link>
        </Button>
      )}
    </div>
  );
}
