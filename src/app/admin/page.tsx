import { redirect } from 'next/navigation';

export default function Admin() {
  redirect('/admin/products');
  // return (
  //   <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6">
  //     <p>Admin dashboard</p>
  //   </div>
  // );
}
