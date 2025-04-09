'use client';

import { authClient } from '~/lib/auth/client';
import { Button } from './ui/button';

export const GoogleSingIn = () => {
  return (
    <Button
      onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/profile' })}
    >
      Login with Google
    </Button>
  );
};
