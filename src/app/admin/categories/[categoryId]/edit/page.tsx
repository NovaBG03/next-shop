import { redirect } from 'next/navigation';

import { CategoryForm } from '~/components/category-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { getCategory, updateCategoryAction } from '~/lib/actions';

type CategoriesEditProps = {
  params: Promise<{ categoryId: string }>;
};

export default async function CategoriesEdit({ params }: CategoriesEditProps) {
  const { categoryId } = await params;
  const category = await getCategory(categoryId).catch(() => null);
  if (!category) {
    redirect('/admin/categories');
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Edit Category</CardTitle>
          <CardDescription>Update the details for this category</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass the fetched category and the update action */}
          <CategoryForm
            action={updateCategoryAction.bind(null, categoryId)}
            initialData={{
              name: category.name,
              slug: category.slug,
              description: category.description,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
