import { redirect } from 'next/navigation';

import { CategoryForm } from '~/components/category-form';
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
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Edit Category</h1>
      <CategoryForm
        action={updateCategoryAction.bind(null, categoryId)}
        initialData={{
          name: category.name,
          slug: category.slug,
          description: category.description,
        }}
      />
    </div>
  );
}
