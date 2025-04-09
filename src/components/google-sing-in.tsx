'use client';

import { authClient } from '~/lib/auth/client';
import { Button } from './ui/button';

type GoogleSingInProps = {
  callbackURL?: string;
};

export const GoogleSingIn = ({ callbackURL }: GoogleSingInProps) => {
  return (
    <Button onClick={() => authClient.signIn.social({ callbackURL, provider: 'google' })}>
      Login with Google
    </Button>
  );
};
