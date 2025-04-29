import Link from 'next/link';

import { ChevronLeftIcon, ChevronRightIcon, InfoIcon, MinusCircleIcon } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { getCategoriesPage } from '~/lib/actions';

interface CategoriesPageProps {
  searchParams: { page?: string };
}

export default async function Categories({ searchParams }: CategoriesPageProps) {
  let currentPage = parseInt(searchParams.page ?? '1', 10);
  currentPage = isNaN(currentPage) || currentPage <= 0 ? 1 : currentPage;

  const { results: categories, totalPages } = await getCategoriesPage(currentPage, 10);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button asChild>
          <Link href="/admin/categories/new">Add Category</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-6 text-center">
                No categories found. Create your first category.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => {
              const id = category._id.toString();
              return (
                <TableRow key={id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>
                    {category.description ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex cursor-help items-center gap-1">
                              <InfoIcon className="text-primary h-4 w-4" />
                              <span className="text-sm">Details</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{category.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <MinusCircleIcon className="text-muted-foreground h-4 w-4 opacity-70" />
                        <span className="text-muted-foreground text-sm">None</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(category.createdAt)}</TableCell>
                  <TableCell>{formatDate(category.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/categories/${id}/edit`}>Edit</Link>
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
              href={`/admin/categories?page=${currentPage - 1}`}
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
              href={`/admin/categories?page=${currentPage + 1}`}
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
