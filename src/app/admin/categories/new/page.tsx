import { CategoryForm } from '~/components/category-form';
import { createCategoryAction } from '~/lib/actions';

export default function CategoriesNew() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Create New Category</h1>
      <CategoryForm action={createCategoryAction} />
    </div>
  );
}
