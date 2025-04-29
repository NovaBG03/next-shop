'use client';

import { useActionState } from 'react';

import Form from 'next/form';
import Link from 'next/link';

import { AlertCircleIcon } from 'lucide-react';

import { createCategoryAction } from '~/lib/actions';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface CategoryFormProps {
  initialData?: { name: string; slug: string; description?: string | undefined };
  action: typeof createCategoryAction;
}

export const CategoryForm = ({ initialData, action: formAction }: CategoryFormProps) => {
  const [state, action, isPending] = useActionState(
    formAction,
    initialData ? { data: initialData } : undefined,
  );

  return (
    <Form action={action}>
      {state?.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-line">{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name*</Label>
            <Input
              id="name"
              name="name"
              defaultValue={state?.data?.name?.toString?.()}
              placeholder="Enter category name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug*</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={state?.data?.slug?.toString?.()}
              placeholder="category-slug"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={state?.data?.description?.toString?.()}
              placeholder="Describe this category (optional)"
              rows={4}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-row-reverse items-center justify-between border-t pt-6">
          <Button type="submit" disabled={isPending}>
            {initialData ? 'Update Category' : 'Save Category'}
          </Button>
          <Button asChild variant="outline" type="button">
            <Link href="/admin/categories">Back to Categories</Link>
          </Button>
        </div>
      </div>
    </Form>
  );
};
