import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getBasicLoggedInUser } from "~/server/queries/users";
import { SignInOptions } from "../_components/sign-in-page/sign-in-options";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getBasicLoggedInUser();

  const rawRedirectUrlParam = (await searchParams).redirect;

  let redirectUrl = rawRedirectUrlParam?.toString();

  // If redirect url includes the word redirect - do not redirect
  if (redirectUrl?.includes("redirect")) {
    redirectUrl = undefined;
  }

  // Check for a redirect url in the query string - check its a valid url for the app
  if (user) {
    if (!redirectUrl?.startsWith("/")) {
      redirectUrl = "/" + redirectUrl;
    }
    redirect(redirectUrl);
  }

  return (
    <section className="bg-gradient-to-b from-violet-900 to-[#15162c] text-white">
      <div className="container flex min-h-screen flex-col items-center justify-center gap-12 px-4">
        <div className="mb-[60px] mt-[-60px] sm:mt-[-200px]">
          <SignInOptions redirectUrl={redirectUrl} />
        </div>
      </div>
    </section>
  );
}
