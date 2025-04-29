import { ProductForm } from '~/components/product-form';
import { createProductAction, getAllCategories } from '~/lib/actions';

export default async function ProductsNew() {
  const categories = await getAllCategories();

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Create New Product</h1>
      <ProductForm
        categories={categories.map((c) => ({ id: c._id.toString(), name: c.name, slug: c.slug }))}
        action={createProductAction}
      />
    </div>
  );
}
