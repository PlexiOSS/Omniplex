import { Container } from "@/components/layout/Container";
import { LoginButton } from "./LoginButton";

export const metadata = {
  title: "Sign in",
};

const ERROR_MESSAGES: Record<string, string> = {
  no_code: "No authorization code was received. Please try again.",
  callback_failed: "Sign in failed. Please try again.",
};

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.")
    : null;

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Sign in to Omniplex
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Connect your Discord account to vote, review bots, and more.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <LoginButton />

        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </Container>
  );
}
