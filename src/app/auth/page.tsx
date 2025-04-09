import { GoogleSingIn } from '~/components/google-sing-in';

type AuthPageProps = {
  searchParams: {
    callbackURL?: string;
  };
};

export default function Auth({ searchParams }: AuthPageProps) {
  return (
    <div>
      <GoogleSingIn callbackURL={searchParams.callbackURL} />
    </div>
  );
}
