import { CategoryForm } from '~/components/category-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { createCategoryAction } from '~/lib/actions';

export default function CategoriesNew() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">New Category</CardTitle>
          <CardDescription>Create a new category for your store</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm action={createCategoryAction} />
        </CardContent>
      </Card>
    </div>
  );
}
