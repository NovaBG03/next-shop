import { headers } from 'next/headers';

import { GoogleSingIn } from '~/components/google-sing-in';
import { SignOut } from '~/components/sing-out';
import { auth } from '~/lib/auth/server';

export default async function Profile() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <div className="p-5">
        <div>Not authenticated</div>
        <GoogleSingIn />
      </div>
    );
  }

  return (
    <div className="p-5">
      <h1>Welcome {session.user.name}</h1>
      <SignOut />
    </div>
  );
}
