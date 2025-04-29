import Link from 'next/link';

import { Button } from '~/components/ui/button';

export default function Products() {
  return (
    <div>
      <Button asChild>
        <Link href="/admin/products/new">Add new</Link>
      </Button>
      Products
    </div>
  );
}
