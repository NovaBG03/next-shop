'use client';

import { useRouter } from 'next/navigation';

import { authClient } from '~/lib/auth/client';
import { Button } from './ui/button';

export const SignOut = () => {
  const router = useRouter();

  return (
    <Button
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
    >
      Sign Out
    </Button>
  );
};
