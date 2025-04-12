import { AppIcon } from '~/components/app-icon';
import { LoginWithSocialButton } from '~/components/login-with-social-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

type AuthPageProps = {
  searchParams: Promise<{ callbackURL?: string }>;
};

export default async function Auth({ searchParams }: AuthPageProps) {
  const { callbackURL } = await searchParams;

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <AppIcon className="size-4" />
          </div>
          Next Shop
        </a>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>Login with your Google account</CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="grid gap-6">
                  <div className="flex flex-col gap-4">
                    <LoginWithSocialButton provider="google" callbackURL={callbackURL} />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
            By continuing, you agree to our <a href="#">Terms of Service</a> and{' '}
            <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
